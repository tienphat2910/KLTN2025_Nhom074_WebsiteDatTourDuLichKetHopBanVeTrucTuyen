const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Add auth middleware import
const { notifyBookingCreated } = require('../utils/socketHandler');
const router = express.Router();

// Create booking - Require authentication
router.post('/', auth, async (req, res) => {
    try {
        console.log('Booking request body:', req.body);
        console.log('Authenticated user:', req.user._id);

        // Use userId from authenticated user
        const bookingData = {
            ...req.body,
            userId: req.user._id // Set userId from authenticated user
        };

        // Set paidAt if payment is already paid (online payment)
        if (bookingData.paymentStatus === 'paid') {
            bookingData.paidAt = new Date();
        }

        const booking = new Booking(bookingData);
        await booking.save();

        // Populate user info for notification
        const populatedBooking = await Booking.findById(booking._id)
            .populate('userId', 'fullName email phone');

        // Transform data to have 'user' field for frontend compatibility
        const bookingObj = populatedBooking.toObject();
        const transformedBooking = {
            ...bookingObj,
            user: bookingObj.userId // Add 'user' field as alias for populated userId
        };

        console.log('Booking created successfully:', booking);

        // Notify admins about new booking
        notifyBookingCreated(transformedBooking);

        res.status(201).json({ success: true, data: transformedBooking });
    } catch (error) {
        console.error('Booking creation error:', error);
        res.status(400).json({
            success: false,
            message: error.message,
            details: error.errors ? Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            })) : undefined
        });
    }
});

// Get all bookings - Require authentication, only return user's bookings
router.get('/', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id })
            .populate('userId', 'fullName email phone');

        // For flight bookings, get additional info about round trip status
        const BookingFlight = require('../models/BookingFlight');
        const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
            const bookingObj = booking.toObject();
            const transformed = {
                ...bookingObj,
                user: bookingObj.userId // Add 'user' field as alias for populated userId
            };

            // If it's a flight booking, check if it's round trip and get total with discounts
            if (booking.bookingType === 'flight') {
                const flightBookings = await BookingFlight.find({ bookingId: booking._id });

                if (flightBookings.length > 0) {
                    // Check if round trip (2 flights)
                    transformed.isRoundTrip = flightBookings.length > 1;

                    // Calculate actual total (sum of all flight prices)
                    const totalFlightPrice = flightBookings.reduce((sum, fb) => sum + fb.totalFlightPrice, 0);
                    const totalDiscount = flightBookings.reduce((sum, fb) => sum + (fb.discountAmount || 0), 0);

                    // Override totalPrice with actual amount after discount
                    transformed.actualTotal = totalFlightPrice - totalDiscount;
                }
            }

            return transformed;
        }));

        res.json({ success: true, data: enrichedBookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get booking by ID - Require authentication, only if user owns it
router.get('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate('userId', 'fullName email phone');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        // Transform data to have 'user' field for frontend compatibility
        const bookingObj = booking.toObject();
        const transformedBooking = {
            ...bookingObj,
            user: bookingObj.userId // Add 'user' field as alias for populated userId
        };

        res.json({ success: true, data: transformedBooking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update booking - Require authentication, only if user owns it
router.put('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true }
        );
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        res.json({ success: true, data: booking });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete booking - Require authentication, only if user owns it
router.delete('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
