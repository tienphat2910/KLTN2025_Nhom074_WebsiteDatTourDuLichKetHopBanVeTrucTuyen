const express = require('express');
const BookingTour = require('../models/BookingTour');
const router = express.Router();

// Create a new booking tour
router.post('/', async (req, res) => {
    try {
        const bookingTour = new BookingTour(req.body);
        await bookingTour.save();
        res.status(201).json({ success: true, data: bookingTour });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get all booking tours
router.get('/', async (req, res) => {
    try {
        const bookingTours = await BookingTour.find();
        res.json({ success: true, data: bookingTours });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get a booking tour by ID
router.get('/:id', async (req, res) => {
    try {
        const bookingTour = await BookingTour.findById(req.params.id);
        if (!bookingTour) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        res.json({ success: true, data: bookingTour });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update a booking tour
router.put('/:id', async (req, res) => {
    try {
        const bookingTour = await BookingTour.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!bookingTour) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        res.json({ success: true, data: bookingTour });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete a booking tour
router.delete('/:id', async (req, res) => {
    try {
        const bookingTour = await BookingTour.findByIdAndDelete(req.params.id);
        if (!bookingTour) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
