const express = require('express');
const router = express.Router();
const FlightSchedule = require('../models/FlightSchedule');
const Flight = require('../models/Flight');
const admin = require('../middleware/admin');

/**
 * @swagger
 * tags:
 *   name: FlightSchedules
 *   description: API quản lý lịch bay
 */

/**
 * @swagger
 * /api/flight-schedules:
 *   get:
 *     summary: Lấy danh sách lịch bay
 *     tags: [FlightSchedules]
 *     parameters:
 *       - in: query
 *         name: flightCode
 *         schema:
 *           type: string
 *         description: Lọc theo mã chuyến bay
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Từ ngày
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Đến ngày
 *     responses:
 *       200:
 *         description: Danh sách lịch bay
 */
router.get('/', async (req, res) => {
    try {
        const { flightCode, status, fromDate, toDate } = req.query;

        const query = {};

        if (flightCode) {
            query.flightCode = flightCode.toUpperCase();
        }

        if (status) {
            query.status = status;
        }

        if (fromDate || toDate) {
            query.departureDate = {};
            if (fromDate) {
                query.departureDate.$gte = new Date(fromDate);
            }
            if (toDate) {
                const endDate = new Date(toDate);
                endDate.setHours(23, 59, 59, 999);
                query.departureDate.$lte = endDate;
            }
        }

        const schedules = await FlightSchedule.find(query)
            .sort({ departureDate: 1 });

        // Populate flight info
        const schedulesWithFlight = await Promise.all(
            schedules.map(async (schedule) => {
                const flight = await Flight.findOne({
                    flightCode: schedule.flightCode
                })
                    .populate('airlineId', 'name code logo')
                    .populate('departureAirportId', 'name city iata')
                    .populate('arrivalAirportId', 'name city iata');

                return {
                    ...schedule.toObject(),
                    flight: flight ? flight.toObject() : null
                };
            })
        );

        res.json({
            success: true,
            data: schedulesWithFlight
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
 * /api/flight-schedules/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết lịch bay
 *     tags: [FlightSchedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin lịch bay
 */
router.get('/:id', async (req, res) => {
    try {
        const schedule = await FlightSchedule.findById(req.params.id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch bay'
            });
        }

        // Get flight info
        const flight = await Flight.findOne({ flightCode: schedule.flightCode })
            .populate('airlineId')
            .populate('departureAirportId')
            .populate('arrivalAirportId');

        res.json({
            success: true,
            data: {
                ...schedule.toObject(),
                flight: flight ? flight.toObject() : null
            }
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
 * /api/flight-schedules:
 *   post:
 *     summary: Tạo lịch bay mới (Admin)
 *     tags: [FlightSchedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FlightSchedule'
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', admin, async (req, res) => {
    try {
        const {
            flightCode,
            departureDate,
            arrivalDate,
            remainingSeats,
            currentPrice,
            gate
        } = req.body;

        // Verify flight exists
        const flight = await Flight.findOne({ flightCode: flightCode.toUpperCase() });
        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chuyến bay với mã này'
            });
        }

        const schedule = new FlightSchedule({
            flightCode: flightCode.toUpperCase(),
            departureDate,
            arrivalDate,
            remainingSeats,
            currentPrice,
            gate
        });

        await schedule.save();

        res.status(201).json({
            success: true,
            data: schedule,
            message: 'Tạo lịch bay thành công'
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
 * /api/flight-schedules/bulk:
 *   post:
 *     summary: Tạo nhiều lịch bay cùng lúc (Admin)
 *     tags: [FlightSchedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flightCode:
 *                 type: string
 *               dates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date
 *               currentPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/bulk', admin, async (req, res) => {
    try {
        const { flightCode, dates, currentPrice } = req.body;

        // Verify flight exists
        const flight = await Flight.findOne({ flightCode: flightCode.toUpperCase() });
        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chuyến bay'
            });
        }

        const schedules = [];
        for (const date of dates) {
            const departureDate = new Date(date);
            const [depHour, depMin] = flight.departureTime.split(':');
            departureDate.setHours(parseInt(depHour), parseInt(depMin), 0);

            const arrivalDate = new Date(departureDate);
            arrivalDate.setMinutes(arrivalDate.getMinutes() + flight.durationMinutes);

            const schedule = new FlightSchedule({
                flightCode: flight.flightCode,
                departureDate,
                arrivalDate,
                remainingSeats: flight.availableSeats,
                currentPrice: currentPrice || flight.basePrice
            });

            schedules.push(schedule);
        }

        await FlightSchedule.insertMany(schedules);

        res.status(201).json({
            success: true,
            data: schedules,
            message: `Tạo ${schedules.length} lịch bay thành công`
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
 * /api/flight-schedules/{id}:
 *   put:
 *     summary: Cập nhật lịch bay (Admin)
 *     tags: [FlightSchedules]
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
 *             $ref: '#/components/schemas/FlightSchedule'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', admin, async (req, res) => {
    try {
        const schedule = await FlightSchedule.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch bay'
            });
        }

        res.json({
            success: true,
            data: schedule,
            message: 'Cập nhật lịch bay thành công'
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
 * /api/flight-schedules/{id}:
 *   delete:
 *     summary: Xóa lịch bay (Admin)
 *     tags: [FlightSchedules]
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
        const schedule = await FlightSchedule.findByIdAndDelete(req.params.id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch bay'
            });
        }

        res.json({
            success: true,
            message: 'Xóa lịch bay thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;
