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

        // Transform data to have 'user' field for frontend compatibility
        const transformedBookings = bookings.map(booking => {
            const bookingObj = booking.toObject();
            return {
                ...bookingObj,
                user: bookingObj.userId // Add 'user' field as alias for populated userId
            };
        });

        res.json({ success: true, data: transformedBookings });
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
