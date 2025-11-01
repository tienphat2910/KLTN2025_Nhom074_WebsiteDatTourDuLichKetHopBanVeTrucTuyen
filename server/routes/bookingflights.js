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
        const { passengers, bookingId, scheduleId, isRoundTrip, returnFlightId, returnFlightCode,
            returnFlightClassId, returnScheduleId, returnPassengers, returnFlightPrice,
            outboundFlightPrice, selectedSeats, ...bookingFlightData } = req.body;

        console.log('📥 Received booking request:', {
            isRoundTrip,
            scheduleId,
            returnScheduleId,
            passengersCount: passengers?.length,
            returnPassengersCount: returnPassengers?.length,
            outboundSeats: passengers?.map(p => p.seatNumber).filter(Boolean),
            returnSeats: returnPassengers?.map(p => p.seatNumber).filter(Boolean),
            selectedSeats
        });

        // Calculate seats to deduct (adults + children, NOT infants)
        const seatsToDeduct = calculateSeatsOccupied(passengers);

        // Update available seats in FlightClass for outbound flight
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

        // Create the outbound booking flight
        const bookingFlight = new BookingFlight({
            ...bookingFlightData,
            bookingId,
            totalFlightPrice: outboundFlightPrice || bookingFlightData.totalFlightPrice,
            selectedSeats: passengers?.map(p => p.seatNumber).filter(Boolean) || []
        });
        await bookingFlight.save();
        console.log('✅ Created outbound BookingFlight:', bookingFlight._id);

        // If scheduleId provided and passengers have seat numbers, reserve seats in FlightSchedule
        if (scheduleId && passengers && passengers.length > 0) {
            const seatsToReserve = passengers
                .filter(p => p.seatNumber)
                .map(p => p.seatNumber);

            if (seatsToReserve.length > 0) {
                const FlightSchedule = require('../models/FlightSchedule');
                const schedule = await FlightSchedule.findById(scheduleId);

                if (schedule) {
                    // Initialize seat map if empty
                    if (!schedule.seatMap || schedule.seatMap.length === 0) {
                        const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
                        const map = [];
                        for (let r = 1; r <= 32; r++) {
                            cols.forEach(c => map.push({ seatNumber: `${r}${c}`, status: 'available' }));
                        }
                        schedule.seatMap = map;
                    }

                    // Mark seats as reserved
                    seatsToReserve.forEach(seatNum => {
                        const entry = schedule.seatMap.find(sm => sm.seatNumber === seatNum);
                        if (entry && entry.status === 'available') {
                            entry.status = 'reserved';
                            entry.bookingId = bookingId;
                            entry.bookingFlightId = bookingFlight._id;
                        }
                    });

                    // Decrement remainingSeats (only for seats that were available)
                    const actualReserved = seatsToReserve.filter(seatNum => {
                        const entry = schedule.seatMap.find(sm => sm.seatNumber === seatNum);
                        return entry && entry.status === 'reserved';
                    }).length;

                    schedule.remainingSeats = Math.max(0, schedule.remainingSeats - actualReserved);
                    await schedule.save();
                    console.log(`✅ Reserved ${actualReserved} seats: ${seatsToReserve.join(', ')}`);
                }
            }
        }

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
                console.log('✅ QR code generated for outbound flight booking');
            }
        } catch (qrError) {
            console.error('❌ QR code generation failed:', qrError);
            // Continue even if QR generation fails
        }

        // Handle return flight for round trip
        let returnBookingFlight = null;
        if (isRoundTrip && returnFlightId && returnScheduleId && returnPassengers) {
            console.log('🔄 Creating return flight booking...');

            // Update available seats for return flight class
            if (returnFlightClassId && seatsToDeduct > 0) {
                const returnFlightClass = await FlightClass.findById(returnFlightClassId);
                if (returnFlightClass) {
                    if (returnFlightClass.availableSeats >= seatsToDeduct) {
                        returnFlightClass.availableSeats -= seatsToDeduct;
                        await returnFlightClass.save();
                    }
                }
            }

            // Create return booking flight
            returnBookingFlight = new BookingFlight({
                bookingId,
                flightId: returnFlightId,
                flightCode: returnFlightCode,
                flightClassId: returnFlightClassId,
                numTickets: bookingFlightData.numTickets,
                pricePerTicket: bookingFlightData.pricePerTicket,
                totalFlightPrice: returnFlightPrice || 0,
                discountAmount: 0,
                finalTotal: returnFlightPrice || 0,
                status: bookingFlightData.status,
                paymentMethod: bookingFlightData.paymentMethod,
                selectedSeats: returnPassengers?.map(p => p.seatNumber).filter(Boolean) || []
            });
            await returnBookingFlight.save();
            console.log('✅ Created return BookingFlight:', returnBookingFlight._id);

            // Reserve seats for return flight
            const returnSeatsToReserve = returnPassengers
                .filter(p => p.seatNumber)
                .map(p => p.seatNumber);

            if (returnSeatsToReserve.length > 0) {
                const FlightSchedule = require('../models/FlightSchedule');
                const returnSchedule = await FlightSchedule.findById(returnScheduleId);

                if (returnSchedule) {
                    // Initialize seat map if empty
                    if (!returnSchedule.seatMap || returnSchedule.seatMap.length === 0) {
                        const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
                        const map = [];
                        for (let r = 1; r <= 32; r++) {
                            cols.forEach(c => map.push({ seatNumber: `${r}${c}`, status: 'available' }));
                        }
                        returnSchedule.seatMap = map;
                    }

                    // Mark seats as reserved
                    returnSeatsToReserve.forEach(seatNum => {
                        const entry = returnSchedule.seatMap.find(sm => sm.seatNumber === seatNum);
                        if (entry && entry.status === 'available') {
                            entry.status = 'reserved';
                            entry.bookingId = bookingId;
                            entry.bookingFlightId = returnBookingFlight._id;
                        }
                    });

                    const actualReserved = returnSeatsToReserve.filter(seatNum => {
                        const entry = returnSchedule.seatMap.find(sm => sm.seatNumber === seatNum);
                        return entry && entry.status === 'reserved';
                    }).length;

                    returnSchedule.remainingSeats = Math.max(0, returnSchedule.remainingSeats - actualReserved);
                    await returnSchedule.save();
                    console.log(`✅ Reserved ${actualReserved} return flight seats: ${returnSeatsToReserve.join(', ')}`);
                }
            }

            // Generate QR code for return flight
            try {
                const returnQrResult = await generateQRCode({
                    bookingId: returnBookingFlight._id.toString(),
                    bookingType: 'flight',
                    code: returnBookingFlight.flightCode
                });

                if (returnQrResult.success) {
                    returnBookingFlight.qrCode = returnQrResult.qrCodeUrl;
                    returnBookingFlight.qrCodePublicId = returnQrResult.qrCodePublicId;
                    await returnBookingFlight.save();
                    console.log('✅ QR code generated for return flight booking');
                }
            } catch (qrError) {
                console.error('❌ Return flight QR code generation failed:', qrError);
            }

            // Create passenger records for return flight
            if (returnPassengers && returnPassengers.length > 0) {
                const returnPassengerDocs = returnPassengers.map(passenger => ({
                    ...passenger,
                    bookingFlightId: returnBookingFlight._id
                }));
                await FlightPassenger.insertMany(returnPassengerDocs);
                console.log('✅ Created return flight passengers');
            }
        }

        // Update booking totalPrice with the flight price
        const booking = await Booking.findById(bookingId);
        if (booking) {
            // For round trip, sum both flights
            const totalPrice = isRoundTrip && returnBookingFlight
                ? (bookingFlight.totalFlightPrice || 0) + (returnBookingFlight.totalFlightPrice || 0)
                : (bookingFlight.totalFlightPrice || 0);
            booking.totalPrice = totalPrice;
            await booking.save();
            console.log(`✅ Booking totalPrice updated to ${totalPrice}`);
        }

        // Create passenger records for outbound flight
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

                // Prepare email data
                const emailData = {
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
                };

                // Add return flight data if round trip
                if (isRoundTrip && returnBookingFlight) {
                    const populatedReturnBookingFlight = await BookingFlight.findById(returnBookingFlight._id)
                        .populate({
                            path: 'flightId',
                            populate: [
                                { path: 'airlineId', model: 'Airline' },
                                { path: 'departureAirportId', model: 'Airport' },
                                { path: 'arrivalAirportId', model: 'Airport' }
                            ]
                        })
                        .populate('flightClassId');

                    const returnFlightData = populatedReturnBookingFlight.toObject();
                    if (returnFlightData.flightId) {
                        returnFlightData.flightId.airline = returnFlightData.flightId.airlineId;
                        returnFlightData.flightId.departureAirport = returnFlightData.flightId.departureAirportId;
                        returnFlightData.flightId.arrivalAirport = returnFlightData.flightId.arrivalAirportId;

                        const hours = Math.floor(returnFlightData.flightId.durationMinutes / 60);
                        const minutes = returnFlightData.flightId.durationMinutes % 60;
                        returnFlightData.flightId.duration = hours > 0
                            ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
                            : `${minutes}m`;

                        if (returnFlightData.flightId.aircraft?.model) {
                            returnFlightData.flightId.aircraft = returnFlightData.flightId.aircraft.model;
                        }
                    }

                    // Get return flight passengers
                    const returnFlightPassengers = await FlightPassenger.find({ bookingFlightId: returnBookingFlight._id });

                    emailData.returnFlightBooking = {
                        ...returnFlightData,
                        passengers: returnFlightPassengers
                    };
                    console.log('✅ Added return flight data to email');
                }

                await sendFlightBookingEmail(user.email, emailData);
                console.log('✅ Flight booking confirmation email sent');
            } else {
                console.log('⚠️ Cannot send email - booking or user not found');
            }
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
            console.error('❌ Email error stack:', emailError.stack);
            // Don't fail the booking if email fails
        }

        const responseData = {
            bookingFlight,
            passengers: createdPassengers
        };

        if (isRoundTrip && returnBookingFlight) {
            responseData.returnBookingFlight = returnBookingFlight;
            responseData.message = `Đặt vé khứ hồi thành công. Đã trừ ${seatsToDeduct} ghế cho mỗi chuyến.`;
        } else {
            responseData.message = `Đặt vé thành công. Đã trừ ${seatsToDeduct} ghế.`;
        }

        res.status(201).json({
            success: true,
            data: responseData
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

        // Check if this is a round trip (2 flights)
        const isRoundTrip = bookingFlights.length > 1;

        // Transform booking flights into detail format
        const flightBookingDetails = await Promise.all(bookingFlights.map(async (bookingFlight) => {
            // Get passengers for this booking flight
            const passengers = await FlightPassenger.find({ bookingFlightId: bookingFlight._id });

            return {
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
                        country: "Việt Nam"
                    } : null,
                    arrivalAirport: bookingFlight.flightId.arrivalAirportId ? {
                        _id: bookingFlight.flightId.arrivalAirportId._id,
                        name: bookingFlight.flightId.arrivalAirportId.name,
                        code: bookingFlight.flightId.arrivalAirportId.iata,
                        city: bookingFlight.flightId.arrivalAirportId.city,
                        country: "Việt Nam"
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
                selectedSeats: bookingFlight.selectedSeats || [],
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
        }));

        // Calculate total price across all flights
        const totalPrice = flightBookingDetails.reduce((sum, flight) => sum + flight.totalFlightPrice, 0);
        const totalDiscount = flightBookingDetails.reduce((sum, flight) => sum + (flight.discountAmount || 0), 0);

        res.json({
            success: true,
            data: {
                isRoundTrip,
                flights: flightBookingDetails,
                outboundFlight: flightBookingDetails[0],
                returnFlight: isRoundTrip ? flightBookingDetails[1] : null,
                totalPrice,
                totalDiscount,
                // Keep backward compatibility - return first flight
                ...flightBookingDetails[0]
            }
        });
    } catch (error) {
        console.error('Get flight booking details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
