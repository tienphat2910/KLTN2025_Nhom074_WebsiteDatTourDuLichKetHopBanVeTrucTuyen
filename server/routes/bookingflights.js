const express = require('express');
const BookingFlight = require('../models/BookingFlight');
const FlightPassenger = require('../models/FlightPassenger');
const FlightClass = require('../models/FlightClass');
const Booking = require('../models/Booking');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendFlightBookingEmail } = require('../utils/emailService');
const { generateQRCode } = require('../utils/qrCodeGenerator');
const router = express.Router();

/**
 * Calculate number of seats occupied by passengers
 * Infants (under 2 years old) don't occupy seats
 * @param {Array} passengers - Array of passenger objects with dateOfBirth
 * @returns {number} Number of seats to deduct
 */
const calculateSeatsOccupied = (passengers) => {
    if (!passengers || passengers.length === 0) return 0;

    const today = new Date();
    let seatsCount = 0;

    passengers.forEach(passenger => {
        if (passenger.dateOfBirth) {
            const birthDate = new Date(passenger.dateOfBirth);
            const ageInYears = (today - birthDate) / (365.25 * 24 * 60 * 60 * 1000);

            // Only count passengers 2 years or older (adults and children, NOT infants)
            if (ageInYears >= 2) {
                seatsCount++;
            }
        }
    });

    return seatsCount;
};

// Create a new booking flight with passengers
router.post('/', auth, async (req, res) => {
    try {
        const { passengers, bookingId, ...bookingFlightData } = req.body;

        // Calculate seats to deduct (adults + children, NOT infants)
        const seatsToDeduct = calculateSeatsOccupied(passengers);

        // Update available seats in FlightClass
        if (bookingFlightData.flightClassId && seatsToDeduct > 0) {
            const flightClass = await FlightClass.findById(bookingFlightData.flightClassId);

            if (!flightClass) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy hạng vé'
                });
            }

            if (flightClass.availableSeats < seatsToDeduct) {
                return res.status(400).json({
                    success: false,
                    message: `Không đủ ghế trống. Còn ${flightClass.availableSeats} ghế, cần ${seatsToDeduct} ghế`
                });
            }

            // Deduct seats
            flightClass.availableSeats -= seatsToDeduct;
            await flightClass.save();
        }

        // Create the booking flight
        const bookingFlight = new BookingFlight({ ...bookingFlightData, bookingId });
        await bookingFlight.save();

        // Generate QR code for the flight booking
        try {
            const qrResult = await generateQRCode({
                bookingId: bookingFlight._id.toString(),
                bookingType: 'flight',
                code: bookingFlight.flightCode
            });

            if (qrResult.success) {
                bookingFlight.qrCode = qrResult.qrCodeUrl;
                bookingFlight.qrCodePublicId = qrResult.qrCodePublicId;
                await bookingFlight.save();
                console.log('✅ QR code generated for flight booking');
            }
        } catch (qrError) {
            console.error('❌ QR code generation failed:', qrError);
            // Continue even if QR generation fails
        }

        // Update booking totalPrice with the flight price
        const booking = await Booking.findById(bookingId);
        if (booking) {
            booking.totalPrice = bookingFlight.totalFlightPrice || 0;
            await booking.save();
            console.log(`✅ Booking totalPrice updated to ${bookingFlight.totalFlightPrice}`);
        }

        // Create passenger records if provided
        let createdPassengers = [];
        if (passengers && passengers.length > 0) {
            const passengerDocs = passengers.map(passenger => ({
                ...passenger,
                bookingFlightId: bookingFlight._id
            }));
            createdPassengers = await FlightPassenger.insertMany(passengerDocs);
        }

        // Send confirmation email
        try {
            console.log('🔍 Starting to send flight booking email...');
            const booking = await Booking.findById(bookingId).populate('userId', 'fullName email phone');
            console.log('📋 Booking found:', booking ? 'Yes' : 'No');
            console.log('👤 User found:', booking?.userId ? 'Yes' : 'No');

            if (booking && booking.userId) {
                const user = booking.userId;
                const populatedBookingFlight = await BookingFlight.findById(bookingFlight._id)
                    .populate({
                        path: 'flightId',
                        populate: [
                            { path: 'airlineId', model: 'Airline' },
                            { path: 'departureAirportId', model: 'Airport' },
                            { path: 'arrivalAirportId', model: 'Airport' }
                        ]
                    })
                    .populate('flightClassId');

                console.log('✈️ Populated flight booking:', populatedBookingFlight ? 'Yes' : 'No');
                console.log('📧 Sending email to:', user.email);

                // Map the populated fields to match email template expectations
                const flightData = populatedBookingFlight.toObject();
                if (flightData.flightId) {
                    flightData.flightId.airline = flightData.flightId.airlineId;
                    flightData.flightId.departureAirport = flightData.flightId.departureAirportId;
                    flightData.flightId.arrivalAirport = flightData.flightId.arrivalAirportId;

                    // Convert durationMinutes to duration string
                    const hours = Math.floor(flightData.flightId.durationMinutes / 60);
                    const minutes = flightData.flightId.durationMinutes % 60;
                    flightData.flightId.duration = hours > 0
                        ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
                        : `${minutes}m`;

                    // Handle aircraft field (it's an object)
                    if (flightData.flightId.aircraft?.model) {
                        flightData.flightId.aircraft = flightData.flightId.aircraft.model;
                    }
                }

                await sendFlightBookingEmail(user.email, {
                    booking: booking,
                    flightBooking: {
                        ...flightData,
                        passengers: createdPassengers
                    },
                    user: {
                        fullName: user.fullName,
                        email: user.email,
                        phone: user.phone
                    }
                });
                console.log('✅ Flight booking confirmation email sent');
            } else {
                console.log('⚠️ Cannot send email - booking or user not found');
            }
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
            console.error('❌ Email error stack:', emailError.stack);
            // Don't fail the booking if email fails
        }

        res.status(201).json({
            success: true,
            data: {
                bookingFlight,
                passengers: createdPassengers
            },
            message: `Đặt vé thành công. Đã trừ ${seatsToDeduct} ghế.`
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get all booking flights
router.get('/', async (req, res) => {
    try {
        const bookingFlights = await BookingFlight.find();
        res.json({ success: true, data: bookingFlights });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get a booking flight by ID with passengers
router.get('/:id', async (req, res) => {
    try {
        const bookingFlight = await BookingFlight.findById(req.params.id)
            .populate('flightId')
            .populate('flightClassId')
            .populate('bookingId');

        if (!bookingFlight) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        // Get associated passengers
        const passengers = await FlightPassenger.find({ bookingFlightId: req.params.id });

        res.json({
            success: true,
            data: {
                ...bookingFlight.toObject(),
                passengers
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update a booking flight
router.put('/:id', async (req, res) => {
    try {
        const oldBookingFlight = await BookingFlight.findById(req.params.id);
        if (!oldBookingFlight) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        // If status is being changed to cancelled, return seats
        if (req.body.status === 'cancelled' && oldBookingFlight.status !== 'cancelled') {
            const passengers = await FlightPassenger.find({ bookingFlightId: req.params.id });
            const seatsToReturn = calculateSeatsOccupied(passengers);

            // Return seats to FlightClass
            if (oldBookingFlight.flightClassId && seatsToReturn > 0) {
                const flightClass = await FlightClass.findById(oldBookingFlight.flightClassId);
                if (flightClass) {
                    flightClass.availableSeats += seatsToReturn;
                    await flightClass.save();
                }
            }
        }

        const bookingFlight = await BookingFlight.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: bookingFlight });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete a booking flight and its passengers
router.delete('/:id', async (req, res) => {
    try {
        const bookingFlight = await BookingFlight.findById(req.params.id);
        if (!bookingFlight) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        // Get passengers to calculate seats to return
        const passengers = await FlightPassenger.find({ bookingFlightId: req.params.id });
        const seatsToReturn = calculateSeatsOccupied(passengers);

        // Return seats to FlightClass
        if (bookingFlight.flightClassId && seatsToReturn > 0) {
            const flightClass = await FlightClass.findById(bookingFlight.flightClassId);
            if (flightClass) {
                flightClass.availableSeats += seatsToReturn;
                await flightClass.save();
            }
        }

        // Delete booking and passengers
        await BookingFlight.findByIdAndDelete(req.params.id);
        await FlightPassenger.deleteMany({ bookingFlightId: req.params.id });

        res.json({
            success: true,
            message: `Đã xóa booking và hoàn trả ${seatsToReturn} ghế`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all passengers for a booking flight
router.get('/:id/passengers', async (req, res) => {
    try {
        const passengers = await FlightPassenger.find({ bookingFlightId: req.params.id });
        res.json({ success: true, data: passengers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get flight booking details by booking ID (for frontend modal)
router.get('/booking/:bookingId/details', async (req, res) => {
    try {
        // Find all booking flights for this booking
        const bookingFlights = await BookingFlight.find({ bookingId: req.params.bookingId })
            .populate({
                path: 'flightId',
                populate: [
                    { path: 'airlineId', model: 'Airline' },
                    { path: 'departureAirportId', model: 'Airport' },
                    { path: 'arrivalAirportId', model: 'Airport' }
                ]
            })
            .populate('flightClassId')
            .populate('bookingId');

        if (!bookingFlights || bookingFlights.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin chuyến bay' });
        }

        // For now, return the first flight booking (assuming single flight per booking)
        // In the future, this could return multiple flights
        const bookingFlight = bookingFlights[0];

        // Get passengers for this booking flight
        const passengers = await FlightPassenger.find({ bookingFlightId: bookingFlight._id });

        // Transform the data to match frontend expectations
        const flightBookingDetail = {
            _id: bookingFlight._id,
            bookingId: bookingFlight.bookingId,
            flightId: {
                _id: bookingFlight.flightId._id,
                flightCode: bookingFlight.flightCode,
                airline: bookingFlight.flightId.airlineId ? {
                    _id: bookingFlight.flightId.airlineId._id,
                    name: bookingFlight.flightId.airlineId.name,
                    code: bookingFlight.flightId.airlineId.code,
                    logo: bookingFlight.flightId.airlineId.logo
                } : null,
                departureAirport: bookingFlight.flightId.departureAirportId ? {
                    _id: bookingFlight.flightId.departureAirportId._id,
                    name: bookingFlight.flightId.departureAirportId.name,
                    code: bookingFlight.flightId.departureAirportId.iata,
                    city: bookingFlight.flightId.departureAirportId.city,
                    country: "Việt Nam" // Default for now
                } : null,
                arrivalAirport: bookingFlight.flightId.arrivalAirportId ? {
                    _id: bookingFlight.flightId.arrivalAirportId._id,
                    name: bookingFlight.flightId.arrivalAirportId.name,
                    code: bookingFlight.flightId.arrivalAirportId.iata,
                    city: bookingFlight.flightId.arrivalAirportId.city,
                    country: "Việt Nam" // Default for now
                } : null,
                departureTime: bookingFlight.flightId.departureTime,
                arrivalTime: bookingFlight.flightId.arrivalTime,
                duration: `${Math.floor(bookingFlight.flightId.durationMinutes / 60)}h ${bookingFlight.flightId.durationMinutes % 60}m`,
                aircraft: bookingFlight.flightId.aircraft?.model || null
            },
            flightClassId: {
                _id: bookingFlight.flightClassId._id,
                name: bookingFlight.flightClassId.className,
                code: bookingFlight.flightClassId.className,
                description: `Hạng ${bookingFlight.flightClassId.className} - Hành lý: ${bookingFlight.flightClassId.cabinBaggage}kg xách tay, ${bookingFlight.flightClassId.baggageAllowance}kg ký gửi`,
                amenities: bookingFlight.flightClassId.amenities || []
            },
            numTickets: bookingFlight.numTickets,
            pricePerTicket: bookingFlight.pricePerTicket,
            totalFlightPrice: bookingFlight.totalFlightPrice,
            status: bookingFlight.status,
            note: bookingFlight.note,
            paymentMethod: bookingFlight.paymentMethod,
            discountCode: bookingFlight.discountCode,
            discountAmount: bookingFlight.discountAmount,
            qrCode: bookingFlight.qrCode,
            qrCodePublicId: bookingFlight.qrCodePublicId,
            flightCode: bookingFlight.flightCode,
            passengers: passengers.map(passenger => ({
                _id: passenger._id,
                fullName: passenger.fullName,
                dateOfBirth: passenger.dateOfBirth,
                gender: passenger.gender,
                passportNumber: passenger.passportNumber,
                seatNumber: passenger.seatNumber
            })),
            createdAt: bookingFlight.createdAt,
            updatedAt: bookingFlight.updatedAt
        };

        res.json({
            success: true,
            data: flightBookingDetail
        });
    } catch (error) {
        console.error('Get flight booking details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
