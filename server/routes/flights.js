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

module.exports = router;
