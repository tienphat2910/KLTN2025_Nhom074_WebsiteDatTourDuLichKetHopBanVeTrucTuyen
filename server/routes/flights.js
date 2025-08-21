const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');

/**
 * @swagger
 * tags:
 *   name: Flights
 *   description: Flight management endpoints
 */

/**
 * @swagger
 * /api/flights:
 *   get:
 *     summary: Get all flights
 *     tags: [Flights]
 *     responses:
 *       200:
 *         description: Flights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Flight'
 */
router.get('/', async (req, res) => {
    try {
        const flights = await Flight.find().sort({ departureTime: 1 });
        res.json({
            success: true,
            data: flights
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách chuyến bay',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/flights/{id}:
 *   get:
 *     summary: Get flight by ID
 *     tags: [Flights]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Flight ID
 *     responses:
 *       200:
 *         description: Flight retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Flight'
 *       404:
 *         description: Flight not found
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const flight = await Flight.findById(id);
        if (!flight) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy chuyến bay'
            });
            return;
        }
        res.json({
            success: true,
            data: flight
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy chuyến bay',
            error: error.message
        });
    }
});

module.exports = router;
