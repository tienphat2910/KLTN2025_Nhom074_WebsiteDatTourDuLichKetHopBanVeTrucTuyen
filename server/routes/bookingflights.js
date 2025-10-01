const express = require('express');
const BookingFlight = require('../models/BookingFlight');
const router = express.Router();

// Create a new booking flight
router.post('/', async (req, res) => {
    try {
        const bookingFlight = new BookingFlight(req.body);
        await bookingFlight.save();
        res.status(201).json({ success: true, data: bookingFlight });
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

// Get a booking flight by ID
router.get('/:id', async (req, res) => {
    try {
        const bookingFlight = await BookingFlight.findById(req.params.id);
        if (!bookingFlight) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        res.json({ success: true, data: bookingFlight });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update a booking flight
router.put('/:id', async (req, res) => {
    try {
        const bookingFlight = await BookingFlight.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!bookingFlight) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        res.json({ success: true, data: bookingFlight });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete a booking flight
router.delete('/:id', async (req, res) => {
    try {
        const bookingFlight = await BookingFlight.findByIdAndDelete(req.params.id);
        if (!bookingFlight) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
