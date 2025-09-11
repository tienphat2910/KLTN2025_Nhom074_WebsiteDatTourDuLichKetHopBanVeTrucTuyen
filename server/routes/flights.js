const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');

/**
 * @swagger
 * tags:
 *   name: Flights
 *   description: API for managing flights
 */

/**
 * @swagger
 * /api/flights:
 *   get:
 *     summary: Get all flights
 *     tags: [Flights]
 *     responses:
 *       200:
 *         description: A list of flights
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Flight'
 */
router.get('/', async (req, res) => {
    try {
        const flights = await Flight.find();
        res.json(flights);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id);
        if (!flight) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến bay' });
        }
        res.json({ success: true, data: flight });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedFlight = await Flight.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedFlight) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến bay để cập nhật' });
        }
        res.status(200).json({ success: true, message: 'Cập nhật chuyến bay thành công', data: updatedFlight });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;
