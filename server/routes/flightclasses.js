const express = require('express');
const router = express.Router();
const FlightClass = require('../models/FlightClass');
const admin = require('../middleware/admin');

/**
 * @swagger
 * tags:
 *   name: FlightClasses
 *   description: API quản lý hạng ghế chuyến bay
 */

/**
 * @swagger
 * /api/flight-classes:
 *   get:
 *     summary: Lấy danh sách hạng ghế
 *     tags: [FlightClasses]
 *     parameters:
 *       - in: query
 *         name: flightCode
 *         schema:
 *           type: string
 *         description: Lọc theo mã chuyến bay
 *     responses:
 *       200:
 *         description: Danh sách hạng ghế
 */
router.get('/', async (req, res) => {
    try {
        const { flightCode } = req.query;
        const query = flightCode ? { flightCode: flightCode.toUpperCase() } : {};

        const classes = await FlightClass.find(query).sort({ price: 1 });

        res.json({
            success: true,
            data: classes
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

/**
 * @swagger
 * /api/flight-classes/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết hạng ghế
 *     tags: [FlightClasses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin hạng ghế
 */
router.get('/:id', async (req, res) => {
    try {
        const flightClass = await FlightClass.findById(req.params.id);

        if (!flightClass) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hạng ghế'
            });
        }

        res.json({
            success: true,
            data: flightClass
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

/**
 * @swagger
 * /api/flight-classes:
 *   post:
 *     summary: Tạo hạng ghế mới (Admin)
 *     tags: [FlightClasses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FlightClass'
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', admin, async (req, res) => {
    try {
        const {
            flightCode,
            className,
            price,
            baggageAllowance,
            cabinBaggage,
            availableSeats,
            amenities
        } = req.body;

        const flightClass = new FlightClass({
            flightCode: flightCode.toUpperCase(),
            className,
            price,
            baggageAllowance,
            cabinBaggage,
            availableSeats,
            amenities
        });

        await flightClass.save();

        res.status(201).json({
            success: true,
            data: flightClass,
            message: 'Tạo hạng ghế thành công'
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

/**
 * @swagger
 * /api/flight-classes/{id}:
 *   put:
 *     summary: Cập nhật hạng ghế (Admin)
 *     tags: [FlightClasses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FlightClass'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', admin, async (req, res) => {
    try {
        const flightClass = await FlightClass.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!flightClass) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hạng ghế'
            });
        }

        res.json({
            success: true,
            data: flightClass,
            message: 'Cập nhật hạng ghế thành công'
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

/**
 * @swagger
 * /api/flight-classes/{id}:
 *   delete:
 *     summary: Xóa hạng ghế (Admin)
 *     tags: [FlightClasses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:id', admin, async (req, res) => {
    try {
        const flightClass = await FlightClass.findByIdAndDelete(req.params.id);

        if (!flightClass) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hạng ghế'
            });
        }

        res.json({
            success: true,
            message: 'Xóa hạng ghế thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;
