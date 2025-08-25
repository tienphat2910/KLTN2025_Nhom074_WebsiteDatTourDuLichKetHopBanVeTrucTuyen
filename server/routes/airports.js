const express = require('express');
const router = express.Router();
const Airport = require('../models/Airport');

/**
 * @swagger
 * /api/airports:
 *   get:
 *     tags:
 *       - Airports
 *     summary: Lấy danh sách sân bay
 *     responses:
 *       200:
 *         description: Danh sách sân bay
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Airport'
 */
/**
 * @swagger
 * /api/airports/{id}:
 *   get:
 *     tags:
 *       - Airports
 *     summary: Lấy thông tin chi tiết sân bay
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sân bay
 *     responses:
 *       200:
 *         description: Thông tin sân bay
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Airport'
 *       404:
 *         description: Không tìm thấy sân bay
 */

router.get('/', async (req, res) => {
    const airports = await Airport.find();
    res.json(airports);
});

router.get('/:id', async (req, res) => {
    const airport = await Airport.findById(req.params.id);
    if (!airport) return res.status(404).json({ message: 'Không tìm thấy sân bay' });
    res.json(airport);
});

module.exports = router;
