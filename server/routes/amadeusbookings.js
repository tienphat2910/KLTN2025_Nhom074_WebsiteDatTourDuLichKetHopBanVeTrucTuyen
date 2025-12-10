const express = require('express');
const router = express.Router();
const AmadeusBooking = require('../models/AmadeusBooking');
const User = require('../models/User');
const Discount = require('../models/Discount');
const auth = require('../middleware/auth');
const { getFlightOfferPricing, getSeatMap } = require('../config/amadeus');
const { generateQRCode, uploadQRCodeToCloudinary, generateBarcode, generateBarcodeBase64 } = require('../utils/qrCodeGenerator');
const { sendEmail } = require('../utils/emailService');
const {
    createZaloPayOrder,
    verifyZaloPayCallback,
    queryZaloPayOrderStatus,
    getPaymentStatusText
} = require('../utils/zalopayService');
const { notifyBookingCreated } = require('../utils/socketHandler');

/**
 * @swagger
 * /api/amadeus-bookings/pricing:
 *   post:
 *     summary: Xác nhận giá chuyến bay từ Amadeus
 *     tags: [Amadeus Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flightOffer:
 *                 type: object
 *                 description: Flight offer từ Amadeus
 *     responses:
 *       200:
 *         description: Pricing response
 */
router.post('/pricing', async (req, res) => {
    try {
        const { flightOffer, flightOffers } = req.body;
        const offers = flightOffers || (flightOffer ? [flightOffer] : []);

        if (!offers || offers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp flight offer'
            });
        }

        const pricingResponse = await getFlightOfferPricing(offers);

        res.json({
            success: true,
            data: pricingResponse.data,
            dictionaries: pricingResponse.dictionaries || {}
        });
    } catch (error) {
        console.error('Error getting pricing:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy giá: ' + error.message
        });
    }
});

/**
 * @swagger
 * /api/amadeus-bookings/seatmap:
 *   post:
 *     summary: Lấy sơ đồ ghế từ Amadeus
 *     tags: [Amadeus Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flightOffer:
 *                 type: object
 *                 description: Flight offer từ Amadeus
 *     responses:
 *       200:
 *         description: Seatmap response
 */
router.post('/seatmap', async (req, res) => {
    try {
        const { flightOffer } = req.body;

        if (!flightOffer) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp flight offer'
            });
        }

        const seatmapResponse = await getSeatMap(flightOffer);

        res.json({
            success: true,
            data: seatmapResponse.data || [],
            dictionaries: seatmapResponse.dictionaries || {}
        });
    } catch (error) {
        console.error('Error getting seatmap:', error);
        // Seatmap có thể không available cho một số chuyến bay
        res.json({
            success: false,
            message: 'Không thể lấy sơ đồ ghế: ' + error.message,
            data: []
        });
    }
});

/**
 * @swagger
 * /api/amadeus-bookings:
 *   post:
 *     summary: Tạo booking mới từ Amadeus flight
 *     tags: [Amadeus Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AmadeusBookingInput'
 *     responses:
 *       201:
 *         description: Booking đã được tạo
 */
router.post('/', auth, async (req, res) => {
    try {
        const {
            outboundFlightOffer,
            returnFlightOffer,
            passengers,
            seatSelections,
            addOns,
            discountCode,
            paymentMethod,
            contactInfo,
            specialRequests,
            note
        } = req.body;

        // Validate required fields
        if (!outboundFlightOffer) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp thông tin chuyến bay'
            });
        }

        if (!passengers || passengers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp thông tin hành khách'
            });
        }

        if (!contactInfo || !contactInfo.email || !contactInfo.phone) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp thông tin liên hệ'
            });
        }

        // Generate booking reference
        const bookingReference = AmadeusBooking.generateBookingReference();

        // Get pricing from Amadeus to confirm price
        const offersToPrice = [outboundFlightOffer];
        if (returnFlightOffer) {
            offersToPrice.push(returnFlightOffer);
        }

        let pricingData;
        try {
            const pricingResponse = await getFlightOfferPricing(offersToPrice);
            pricingData = pricingResponse.data;
        } catch (pricingError) {
            console.warn('Could not get pricing, using original prices:', pricingError.message);
        }

        // Parse outbound flight
        const outboundItineraries = parseItineraries(outboundFlightOffer);
        const outboundPricing = parsePricing(outboundFlightOffer);

        // Parse return flight if exists
        let returnItineraries = [];
        let returnPricing = null;
        if (returnFlightOffer) {
            returnItineraries = parseItineraries(returnFlightOffer);
            returnPricing = parsePricing(returnFlightOffer);
        }

        // Calculate total pricing
        let pricing = {
            currency: outboundPricing.currency,
            basePrice: outboundPricing.basePrice + (returnPricing?.basePrice || 0),
            totalPrice: outboundPricing.totalPrice + (returnPricing?.totalPrice || 0),
            grandTotal: outboundPricing.grandTotal + (returnPricing?.grandTotal || 0),
            travelerPrices: outboundPricing.travelerPrices
        };

        // Calculate add-ons price
        const EXTRA_BAGGAGE_PRICE = 200000;
        const INSURANCE_PRICE = 150000;
        const PRIORITY_BOARDING_PRICE = 100000;

        let addOnsTotal = 0;
        const processedAddOns = {
            extraBaggage: addOns?.extraBaggage || 0,
            extraBaggagePrice: (addOns?.extraBaggage || 0) * EXTRA_BAGGAGE_PRICE,
            insurance: addOns?.insurance || false,
            insurancePrice: addOns?.insurance ? INSURANCE_PRICE * passengers.length : 0,
            priorityBoarding: addOns?.priorityBoarding || false,
            priorityBoardingPrice: addOns?.priorityBoarding ? PRIORITY_BOARDING_PRICE * passengers.length : 0
        };
        addOnsTotal = processedAddOns.extraBaggagePrice +
            processedAddOns.insurancePrice +
            processedAddOns.priorityBoardingPrice;

        // Calculate seat selection price
        let seatTotal = 0;
        if (seatSelections && seatSelections.length > 0) {
            seatTotal = seatSelections.reduce((sum, seat) => sum + (seat.seatPrice || 0), 0);
        }

        // Apply discount
        let discountAmount = 0;
        let appliedDiscount = null;
        if (discountCode) {
            try {
                appliedDiscount = await Discount.findOne({
                    code: discountCode.toUpperCase(),
                    isActive: true,
                    applicableType: { $in: ['all', 'flight'] },
                    startDate: { $lte: new Date() },
                    endDate: { $gte: new Date() },
                    $or: [
                        { usageLimit: { $exists: false } },
                        { usageLimit: null },
                        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
                    ]
                });

                if (appliedDiscount) {
                    const subtotal = pricing.grandTotal + addOnsTotal + seatTotal;
                    if (appliedDiscount.discountType === 'percentage') {
                        discountAmount = Math.round((subtotal * appliedDiscount.value) / 100);
                        if (appliedDiscount.maxDiscount) {
                            discountAmount = Math.min(discountAmount, appliedDiscount.maxDiscount);
                        }
                    } else {
                        discountAmount = Math.min(appliedDiscount.value, subtotal);
                    }

                    // Update discount usage
                    await Discount.findByIdAndUpdate(appliedDiscount._id, {
                        $inc: { usedCount: 1 }
                    });
                }
            } catch (discountError) {
                console.warn('Discount error:', discountError.message);
            }
        }

        // Calculate total
        const totalAmount = pricing.grandTotal + addOnsTotal + seatTotal - discountAmount;

        // Create booking
        const booking = new AmadeusBooking({
            userId: req.user._id,
            bookingReference,
            isRoundTrip: !!returnFlightOffer,

            outboundFlight: {
                amadeusOfferId: outboundFlightOffer.id,
                validatingAirlineCode: outboundFlightOffer.validatingAirlineCodes?.[0],
                validatingAirlineName: '', // Can be filled from dictionaries
                itineraries: outboundItineraries,
                lastTicketingDate: outboundFlightOffer.lastTicketingDate ? new Date(outboundFlightOffer.lastTicketingDate) : null,
                numberOfBookableSeats: outboundFlightOffer.numberOfBookableSeats
            },

            returnFlight: returnFlightOffer ? {
                amadeusOfferId: returnFlightOffer.id,
                validatingAirlineCode: returnFlightOffer.validatingAirlineCodes?.[0],
                validatingAirlineName: '',
                itineraries: returnItineraries,
                lastTicketingDate: returnFlightOffer.lastTicketingDate ? new Date(returnFlightOffer.lastTicketingDate) : null,
                numberOfBookableSeats: returnFlightOffer.numberOfBookableSeats
            } : undefined,

            passengers: passengers.map(p => ({
                type: p.type || 'ADULT',
                firstName: p.firstName,
                lastName: p.lastName,
                gender: p.gender,
                dateOfBirth: new Date(p.dateOfBirth),
                nationality: p.nationality || 'VN',
                identityNumber: p.identityNumber,
                email: p.email,
                phone: p.phone,
                selectedSeat: p.selectedSeat
            })),

            pricing,
            seatSelections: seatSelections || [],
            addOns: processedAddOns,

            discountCode: discountCode?.toUpperCase(),
            discountAmount,
            totalAmount,

            paymentMethod,
            paymentStatus: 'pending',
            status: 'pending',

            contactInfo: {
                email: contactInfo.email,
                phone: contactInfo.phone,
                fullName: contactInfo.fullName || passengers[0]?.firstName + ' ' + passengers[0]?.lastName
            },

            specialRequests,
            note,

            rawAmadeusOffer: outboundFlightOffer
        });

        await booking.save();

        // Generate QR code
        try {
            const qrData = JSON.stringify({
                bookingRef: bookingReference,
                type: 'AMADEUS_FLIGHT',
                passengers: passengers.length,
                totalAmount,
                createdAt: booking.createdAt
            });
            const qrCodeBuffer = await generateQRCode(qrData);
            const qrUpload = await uploadQRCodeToCloudinary(qrCodeBuffer, `amadeus_booking_${booking._id}`);

            booking.qrCode = qrUpload.secure_url;
            booking.qrCodePublicId = qrUpload.public_id;
            await booking.save();
        } catch (qrError) {
            console.warn('QR Code generation error:', qrError.message);
        }

        // Generate Barcode
        try {
            const barcodeResult = await generateBarcode(bookingReference);
            if (barcodeResult.success) {
                booking.barcode = barcodeResult.barcodeUrl;
                booking.barcodePublicId = barcodeResult.barcodePublicId;
                await booking.save();
            }
        } catch (barcodeError) {
            console.warn('Barcode generation error:', barcodeError.message);
        }

        // Get populated booking
        const populatedBooking = await AmadeusBooking.findById(booking._id)
            .populate('userId', 'fullName email phone');

        // Send confirmation email
        try {
            const user = await User.findById(req.user._id);
            if (user && user.email) {
                await sendBookingConfirmationEmail(user.email, populatedBooking);
            }
        } catch (emailError) {
            console.warn('Email sending error:', emailError.message);
        }

        // Notify admin via socket about new booking
        try {
            const outboundSegment = populatedBooking.outboundFlight?.itineraries?.[0]?.segments?.[0];
            const socketBookingData = {
                _id: populatedBooking._id,
                userId: populatedBooking.userId,
                bookingType: 'amadeus_flight',
                totalPrice: populatedBooking.totalAmount,
                status: populatedBooking.status,
                createdAt: populatedBooking.createdAt,
                // Additional flight info for admin notification
                bookingReference: populatedBooking.bookingReference,
                flightInfo: outboundSegment ? {
                    departure: outboundSegment.departure?.iataCode,
                    arrival: outboundSegment.arrival?.iataCode,
                    airline: populatedBooking.outboundFlight?.validatingAirlineCode
                } : null
            };
            notifyBookingCreated(socketBookingData);
        } catch (socketError) {
            console.warn('Socket notification error:', socketError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Đặt vé thành công!',
            data: populatedBooking
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo booking: ' + error.message
        });
    }
});

/**
 * @swagger
 * /api/amadeus-bookings:
 *   get:
 *     summary: Lấy danh sách booking của user
 *     tags: [Amadeus Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', auth, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const filter = { userId: req.user._id };
        if (status) {
            filter.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [bookings, total] = await Promise.all([
            AmadeusBooking.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            AmadeusBooking.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách booking'
        });
    }
});

/**
 * @swagger
 * /api/amadeus-bookings/{id}:
 *   get:
 *     summary: Lấy chi tiết booking
 *     tags: [Amadeus Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const booking = await AmadeusBooking.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate('userId', 'fullName email phone');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin booking'
        });
    }
});

/**
 * @swagger
 * /api/amadeus-bookings/reference/{reference}:
 *   get:
 *     summary: Lấy booking theo mã đặt vé
 *     tags: [Amadeus Bookings]
 */
router.get('/reference/:reference', async (req, res) => {
    try {
        const booking = await AmadeusBooking.findOne({
            bookingReference: req.params.reference.toUpperCase()
        }).populate('userId', 'fullName email phone');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking với mã này'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin booking'
        });
    }
});

/**
 * @swagger
 * /api/amadeus-bookings/{id}/cancel:
 *   post:
 *     summary: Hủy booking
 *     tags: [Amadeus Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/cancel', auth, async (req, res) => {
    try {
        const { reason } = req.body;

        const booking = await AmadeusBooking.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking'
            });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking đã bị hủy trước đó'
            });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy booking đã hoàn thành'
            });
        }

        booking.status = 'cancelled';
        booking.note = booking.note
            ? `${booking.note}\n[Hủy] ${reason || 'Không có lý do'}`
            : `[Hủy] ${reason || 'Không có lý do'}`;

        await booking.save();

        res.json({
            success: true,
            message: 'Đã hủy booking thành công',
            data: booking
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi hủy booking'
        });
    }
});

/**
 * @swagger
 * /api/amadeus-bookings/{id}/payment-status:
 *   put:
 *     summary: Cập nhật trạng thái thanh toán
 *     tags: [Amadeus Bookings]
 */
router.put('/:id/payment-status', async (req, res) => {
    try {
        const { paymentStatus, zalopayTransId, zalopayZpTransId } = req.body;

        const booking = await AmadeusBooking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking'
            });
        }

        booking.paymentStatus = paymentStatus;
        if (paymentStatus === 'paid') {
            booking.status = 'confirmed';
            booking.paidAt = new Date();
        }
        if (zalopayTransId) booking.zalopayTransId = zalopayTransId;
        if (zalopayZpTransId) booking.zalopayZpTransId = zalopayZpTransId;

        await booking.save();

        res.json({
            success: true,
            message: 'Đã cập nhật trạng thái thanh toán',
            data: booking
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái thanh toán'
        });
    }
});

// Helper functions
function parseItineraries(offer) {
    if (!offer.itineraries) return [];

    return offer.itineraries.map(itin => ({
        duration: itin.duration,
        segments: (itin.segments || []).map(seg => ({
            segmentId: seg.id,
            carrierCode: seg.carrierCode,
            flightNumber: `${seg.carrierCode}${seg.number}`,
            aircraft: seg.aircraft?.code,
            departure: {
                iataCode: seg.departure?.iataCode,
                terminal: seg.departure?.terminal,
                at: seg.departure?.at ? new Date(seg.departure.at) : null
            },
            arrival: {
                iataCode: seg.arrival?.iataCode,
                terminal: seg.arrival?.terminal,
                at: seg.arrival?.at ? new Date(seg.arrival.at) : null
            },
            duration: seg.duration,
            cabin: offer.travelerPricings?.[0]?.fareDetailsBySegment?.find(f => f.segmentId === seg.id)?.cabin,
            class: offer.travelerPricings?.[0]?.fareDetailsBySegment?.find(f => f.segmentId === seg.id)?.class,
            fareBasis: offer.travelerPricings?.[0]?.fareDetailsBySegment?.find(f => f.segmentId === seg.id)?.fareBasis
        }))
    }));
}

function parsePricing(offer) {
    const price = offer.price || {};
    const currency = price.currency || 'VND';

    // Get traveler prices breakdown
    const travelerPrices = [];
    const travelerTypes = {};

    (offer.travelerPricings || []).forEach(tp => {
        const type = tp.travelerType;
        if (!travelerTypes[type]) {
            travelerTypes[type] = {
                travelerType: type,
                pricePerTraveler: parseFloat(tp.price?.total || 0),
                count: 0,
                subtotal: 0
            };
        }
        travelerTypes[type].count++;
        travelerTypes[type].subtotal += parseFloat(tp.price?.total || 0);
    });

    Object.values(travelerTypes).forEach(t => travelerPrices.push(t));

    return {
        currency,
        basePrice: parseFloat(price.base || 0),
        totalPrice: parseFloat(price.total || 0),
        grandTotal: parseFloat(price.grandTotal || price.total || 0),
        fees: (price.fees || []).map(f => ({
            type: f.type,
            amount: parseFloat(f.amount || 0)
        })),
        travelerPrices
    };
}

async function sendBookingConfirmationEmail(email, booking) {
    const subject = `✈️ Xác nhận đặt vé máy bay - ${booking.bookingReference}`;

    const outboundSegment = booking.outboundFlight?.itineraries?.[0]?.segments?.[0];
    const lastOutboundSegment = booking.outboundFlight?.itineraries?.[0]?.segments?.slice(-1)[0];

    const departureDate = outboundSegment?.departure?.at
        ? new Date(outboundSegment.departure.at).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
        : 'N/A';
    const departureTime = outboundSegment?.departure?.at
        ? new Date(outboundSegment.departure.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : 'N/A';

    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a56db 0%, #3b82f6 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✈️ LuTrip</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Xác nhận đặt vé máy bay</p>
        </div>
        
        <!-- Booking Reference -->
        <div style="background: white; margin: 0; padding: 25px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 12px; text-align: center; border: 2px dashed #3b82f6;">
                <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px;">Mã đặt vé của bạn</p>
                <h2 style="margin: 0; color: #1e40af; font-size: 32px; letter-spacing: 3px; font-family: 'Courier New', monospace;">${booking.bookingReference}</h2>
                <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;">Ngày đặt: ${new Date(booking.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
        </div>

        <!-- Flight Info -->
        <div style="background: white; padding: 25px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">🛫 Thông tin chuyến bay</h3>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; vertical-align: top; width: 40%;">
                            <p style="margin: 0; color: #64748b; font-size: 12px;">KHỞI HÀNH</p>
                            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1e293b;">${outboundSegment?.departure?.iataCode || 'N/A'}</p>
                            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">${departureTime}</p>
                        </td>
                        <td style="padding: 10px 0; vertical-align: middle; text-align: center; width: 20%;">
                            <div style="position: relative;">
                                <div style="border-top: 2px dashed #cbd5e1; margin: 0 10px;"></div>
                                <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #f8fafc; padding: 0 5px;">✈️</span>
                            </div>
                            <p style="margin: 10px 0 0 0; color: #64748b; font-size: 11px;">${outboundSegment?.flightNumber || 'N/A'}</p>
                        </td>
                        <td style="padding: 10px 0; vertical-align: top; text-align: right; width: 40%;">
                            <p style="margin: 0; color: #64748b; font-size: 12px;">ĐIỂM ĐẾN</p>
                            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1e293b;">${lastOutboundSegment?.arrival?.iataCode || 'N/A'}</p>
                        </td>
                    </tr>
                </table>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #64748b; font-size: 14px;">📅 ${departureDate}</p>
                </div>
            </div>
        </div>

        <!-- Passengers -->
        <div style="background: white; padding: 25px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px;">👥 Hành khách (${booking.passengers.length})</h3>
            ${booking.passengers.map((p, i) => `
                <div style="background: #f8fafc; padding: 12px 15px; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center;">
                    <span style="background: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-block; text-align: center; line-height: 24px; font-size: 12px; margin-right: 12px;">${i + 1}</span>
                    <span style="color: #1e293b; font-weight: 500;">${p.lastName} ${p.firstName}</span>
                    <span style="color: #64748b; margin-left: auto; font-size: 13px;">${p.type === 'ADULT' ? 'Người lớn' : p.type === 'CHILD' ? 'Trẻ em' : 'Em bé'}</span>
                </div>
            `).join('')}
        </div>

        <!-- Price -->
        <div style="background: white; padding: 25px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 20px; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 5px 0; color: #166534; font-size: 14px;">Tổng thanh toán</p>
                <h2 style="margin: 0; color: #15803d; font-size: 28px;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalAmount)}</h2>
                <p style="margin: 10px 0 0 0; color: #166534; font-size: 13px;">
                    ${booking.paymentStatus === 'paid' ? '✅ Đã thanh toán' : '⏳ Chờ thanh toán'}
                </p>
            </div>
        </div>

        <!-- QR Code & Barcode -->
        <div style="background: white; padding: 25px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; text-align: center;">📱 Mã check-in</h3>
            <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
                ${booking.qrCode ? `
                <div style="text-align: center;">
                    <img src="${booking.qrCode}" alt="QR Code" style="width: 130px; height: 130px; border: 1px solid #e5e7eb; border-radius: 8px;" />
                    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 11px;">Quét mã QR</p>
                </div>
                ` : ''}
                ${booking.barcode ? `
                <div style="text-align: center;">
                    <img src="${booking.barcode}" alt="Barcode" style="height: 80px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; background: white;" />
                    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 11px;">Mã vạch đặt vé</p>
                </div>
                ` : ''}
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 15px;">
                Xuất trình mã này khi làm thủ tục check-in tại sân bay
            </p>
        </div>

        <!-- Footer -->
        <div style="background: #1e293b; padding: 25px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 10px 0;">
                Cảm ơn bạn đã sử dụng dịch vụ của LuTrip!
            </p>
            <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0;">
                Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ hotline: 1900-xxxx
            </p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin: 0;">
                    © 2024 LuTrip. All rights reserved.
                </p>
            </div>
        </div>
    </div>
    `;

    await sendEmail(email, subject, html);
}

// ==================== PAYMENT ROUTES ====================

/**
 * @swagger
 * /api/amadeus-bookings/{id}/payment/zalopay:
 *   post:
 *     summary: Tạo thanh toán ZaloPay cho booking
 *     tags: [Amadeus Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: ZaloPay order created
 */
router.post('/:id/payment/zalopay', auth, async (req, res) => {
    try {
        const booking = await AmadeusBooking.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking'
            });
        }

        if (booking.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Booking này đã được thanh toán'
            });
        }

        // Create ZaloPay order
        const outboundSegment = booking.outboundFlight?.itineraries?.[0]?.segments?.[0];
        const description = `Thanh toán vé máy bay ${booking.bookingReference} - ${outboundSegment?.departure?.iataCode || ''} → ${outboundSegment?.arrival?.iataCode || ''}`;

        const orderData = {
            amount: Math.round(booking.totalAmount),
            description: description,
            userId: req.user._id.toString(),
            extraData: JSON.stringify({
                bookingId: booking._id.toString(),
                bookingType: 'amadeus_flight',
                bookingReference: booking.bookingReference
            })
        };

        const result = await createZaloPayOrder(orderData);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message || 'Lỗi tạo đơn hàng ZaloPay'
            });
        }

        // Update booking with ZaloPay transaction ID
        booking.zalopayTransId = result.data.app_trans_id;
        booking.zalopayOrderUrl = result.data.order_url;
        booking.paymentMethod = 'zalopay';
        await booking.save();

        res.json({
            success: true,
            data: {
                order_url: result.data.order_url,
                app_trans_id: result.data.app_trans_id,
                bookingId: booking._id,
                bookingReference: booking.bookingReference
            },
            message: 'Tạo đơn hàng ZaloPay thành công'
        });
    } catch (error) {
        console.error('Create ZaloPay order error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo đơn hàng ZaloPay: ' + error.message
        });
    }
});

/**
 * @swagger
 * /api/amadeus-bookings/{id}/payment/momo:
 *   post:
 *     summary: Tạo thanh toán MoMo cho booking
 *     tags: [Amadeus Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: MoMo order created
 */
router.post('/:id/payment/momo', auth, async (req, res) => {
    try {
        const booking = await AmadeusBooking.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking'
            });
        }

        if (booking.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Booking này đã được thanh toán'
            });
        }

        // Create MoMo payment
        const axios = require('axios');
        const crypto = require('crypto');
        const momoConfig = require('../config/momo');

        const {
            accessKey,
            secretKey,
            partnerCode,
            redirectUrl,
            ipnUrl,
            requestType,
            lang,
            autoCapture,
            endpoint
        } = momoConfig;

        const amount = Math.round(booking.totalAmount).toString();
        const outboundSegment = booking.outboundFlight?.itineraries?.[0]?.segments?.[0];
        const orderInfo = `Thanh toán vé máy bay ${booking.bookingReference} - ${outboundSegment?.departure?.iataCode || ''} → ${outboundSegment?.arrival?.iataCode || ''}`;

        const orderId = partnerCode + new Date().getTime();
        const requestId = orderId;
        const extraData = JSON.stringify({
            bookingId: booking._id.toString(),
            bookingType: 'amadeus_flight',
            bookingReference: booking.bookingReference
        });

        // Create raw signature string
        const rawSignature =
            'accessKey=' + accessKey +
            '&amount=' + amount +
            '&extraData=' + extraData +
            '&ipnUrl=' + ipnUrl +
            '&orderId=' + orderId +
            '&orderInfo=' + orderInfo +
            '&partnerCode=' + partnerCode +
            '&redirectUrl=' + redirectUrl +
            '&requestId=' + requestId +
            '&requestType=' + requestType;

        // Generate signature
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        // Create request body for MoMo API
        const requestBody = JSON.stringify({
            partnerCode: partnerCode,
            partnerName: 'LuTrip',
            storeId: 'LuTripStore',
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            lang: lang,
            requestType: requestType,
            autoCapture: autoCapture,
            extraData: extraData,
            orderGroupId: '',
            signature: signature,
        });

        // Send request to MoMo
        const momoResponse = await axios({
            method: 'POST',
            url: endpoint,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
            },
            data: requestBody,
        });

        if (momoResponse.data.resultCode === 0) {
            // Update booking with MoMo transaction ID
            booking.momoOrderId = orderId;
            booking.momoTransId = momoResponse.data.transId;
            booking.paymentMethod = 'momo';
            await booking.save();

            res.json({
                success: true,
                data: {
                    payUrl: momoResponse.data.payUrl,
                    orderId: orderId,
                    bookingId: booking._id,
                    bookingReference: booking.bookingReference
                },
                message: 'Tạo đơn hàng MoMo thành công'
            });
        } else {
            res.status(400).json({
                success: false,
                message: momoResponse.data.message || 'Lỗi tạo đơn hàng MoMo'
            });
        }
    } catch (error) {
        console.error('Create MoMo order error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo đơn hàng MoMo: ' + error.message
        });
    }
});

/**
 * @swagger
 * /api/amadeus-bookings/{id}/payment/status:
 *   get:
 *     summary: Kiểm tra trạng thái thanh toán
 *     tags: [Amadeus Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id/payment/status', auth, async (req, res) => {
    try {
        const booking = await AmadeusBooking.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking'
            });
        }

        // If already paid, return immediately
        if (booking.paymentStatus === 'paid') {
            return res.json({
                success: true,
                data: {
                    bookingId: booking._id,
                    bookingReference: booking.bookingReference,
                    paymentStatus: booking.paymentStatus,
                    paymentMethod: booking.paymentMethod,
                    paidAt: booking.paidAt
                }
            });
        }

        // Query MoMo if we have MoMo order ID
        if (booking.momoOrderId) {
            const axios = require('axios');
            const crypto = require('crypto');
            const momoConfig = require('../config/momo');

            const {
                accessKey,
                secretKey,
                partnerCode,
                queryEndpoint
            } = momoConfig;

            const requestId = booking.momoOrderId;
            const orderId = booking.momoOrderId;
            const lang = 'vi';

            // Create signature for query
            const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}`;
            const signature = crypto
                .createHmac('sha256', secretKey)
                .update(rawSignature)
                .digest('hex');

            try {
                const momoResponse = await axios.post(queryEndpoint, {
                    partnerCode,
                    requestId,
                    orderId,
                    lang,
                    signature
                });

                if (momoResponse.data.resultCode === 0) {
                    // Payment successful - update booking
                    booking.paymentStatus = 'paid';
                    booking.status = 'confirmed';
                    booking.paidAt = new Date();
                    booking.momoResponse = momoResponse.data;
                    await booking.save();

                    // Send confirmation email
                    try {
                        const user = await User.findById(req.user._id);
                        if (user && user.email) {
                            await sendBookingConfirmationEmail(user.email, booking);
                        }
                    } catch (emailError) {
                        console.warn('Email sending error:', emailError.message);
                    }
                }

                return res.json({
                    success: true,
                    data: {
                        bookingId: booking._id,
                        bookingReference: booking.bookingReference,
                        paymentStatus: booking.paymentStatus,
                        paymentMethod: booking.paymentMethod,
                        paidAt: booking.paidAt,
                        momoStatus: momoResponse.data
                    }
                });
            } catch (momoError) {
                console.error('MoMo query error:', momoError);
            }
        }

        // Query ZaloPay if we have transaction ID
        if (booking.zalopayTransId) {
            const result = await queryZaloPayOrderStatus(booking.zalopayTransId);

            if (result.success && result.data?.return_code === 1) {
                // Payment successful - update booking
                booking.paymentStatus = 'paid';
                booking.status = 'confirmed';
                booking.paidAt = new Date();
                booking.zalopayResponse = result.data;
                await booking.save();

                // Send confirmation email
                try {
                    const user = await User.findById(req.user._id);
                    if (user && user.email) {
                        await sendBookingConfirmationEmail(user.email, booking);
                    }
                } catch (emailError) {
                    console.warn('Email sending error:', emailError.message);
                }
            }

            return res.json({
                success: true,
                data: {
                    bookingId: booking._id,
                    bookingReference: booking.bookingReference,
                    paymentStatus: booking.paymentStatus,
                    paymentMethod: booking.paymentMethod,
                    paidAt: booking.paidAt,
                    zalopayStatus: result.data ? {
                        return_code: result.data.return_code,
                        return_message: result.data.return_message,
                        statusText: getPaymentStatusText(result.data.return_code)
                    } : null
                }
            });
        }

        res.json({
            success: true,
            data: {
                bookingId: booking._id,
                bookingReference: booking.bookingReference,
                paymentStatus: booking.paymentStatus,
                paymentMethod: booking.paymentMethod
            }
        });
    } catch (error) {
        console.error('Check payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra trạng thái thanh toán'
        });
    }
});

/**
 * @swagger
 * /api/amadeus-bookings/payment/callback:
 *   post:
 *     summary: ZaloPay callback cho Amadeus booking
 *     tags: [Amadeus Bookings]
 */
router.post('/payment/callback', async (req, res) => {
    try {
        console.log('📞 ZaloPay callback for Amadeus booking:', req.body);

        const verification = verifyZaloPayCallback(req.body);

        if (!verification.isValid) {
            console.error('❌ Invalid ZaloPay callback signature');
            return res.json({
                return_code: -1,
                return_message: 'Invalid signature'
            });
        }

        const callbackData = verification.data;
        console.log('✅ ZaloPay callback verified:', callbackData);

        // Parse extra data to get booking info
        let extraData = {};
        try {
            if (callbackData.embed_data) {
                extraData = JSON.parse(callbackData.embed_data);
            }
        } catch (e) {
            console.warn('Could not parse embed_data:', e.message);
        }

        // Find booking by app_trans_id
        const booking = await AmadeusBooking.findOne({
            zalopayTransId: callbackData.app_trans_id
        });

        if (booking) {
            booking.paymentStatus = 'paid';
            booking.status = 'confirmed';
            booking.paidAt = new Date();
            booking.zalopayResponse = {
                zp_trans_id: callbackData.zp_trans_id,
                server_time: callbackData.server_time,
                amount: callbackData.amount
            };
            await booking.save();

            console.log(`✅ Booking ${booking.bookingReference} payment confirmed`);

            // Send confirmation email
            try {
                const user = await User.findById(booking.userId);
                if (user && user.email) {
                    await sendBookingConfirmationEmail(user.email, booking);
                }
            } catch (emailError) {
                console.warn('Email sending error:', emailError.message);
            }
        } else {
            console.warn('⚠️ Booking not found for app_trans_id:', callbackData.app_trans_id);
        }

        res.json({
            return_code: 1,
            return_message: 'success'
        });
    } catch (error) {
        console.error('❌ ZaloPay callback error:', error);
        res.json({
            return_code: 0,
            return_message: error.message
        });
    }
});

module.exports = router;
