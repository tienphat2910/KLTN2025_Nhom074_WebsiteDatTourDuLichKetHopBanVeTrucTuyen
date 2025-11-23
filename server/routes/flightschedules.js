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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Số item mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách lịch bay
 */
router.get('/', async (req, res) => {
    try {
        const { flightCode, status, fromDate, toDate, page = 1, limit = 10, excludeArrived } = req.query;

        const query = {};

        if (flightCode) {
            query.flightCode = flightCode.toUpperCase();
        }

        if (status) {
            query.status = status;
        }

        // Exclude 'arrived' status by default unless specifically requested
        if (excludeArrived === 'true' && !status) {
            query.status = { $ne: 'arrived' };
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

        // Get total count for pagination
        const totalCount = await FlightSchedule.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);
        const skip = (page - 1) * limit;

        // Get paginated schedules
        const schedules = await FlightSchedule.find(query)
            .sort({ departureDate: 1 })
            .skip(skip)
            .limit(parseInt(limit));

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
            data: schedulesWithFlight,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCount,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                limit: parseInt(limit)
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

/**
 * @swagger
 * /api/flight-schedules/auto-update:
 *   post:
 *     summary: Manually trigger auto-update of flight schedule statuses
 *     tags: [FlightSchedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Flight schedules updated successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/auto-update', admin, async (req, res) => {
    try {
        const { updateFlightScheduleStatuses } = require('../utils/flightScheduleAutoUpdate');
        const updatedCount = await updateFlightScheduleStatuses();

        res.json({
            success: true,
            message: `Đã cập nhật ${updatedCount} lịch bay`,
            updatedCount
        });
    } catch (err) {
        console.error('Manual auto-update error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật tự động',
            error: err.message
        });
    }
});

/**
 * @swagger
 * /api/flight-schedules/status-check:
 *   get:
 *     summary: Check current status of all active flight schedules
 *     tags: [FlightSchedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status check results
 */
router.get('/status-check', admin, async (req, res) => {
    try {
        const now = new Date();
        const schedules = await FlightSchedule.find({
            status: { $in: ['scheduled', 'boarding', 'departed'] }
        }).sort({ departureDate: 1 });

        const statusInfo = schedules.map(schedule => {
            const departureTime = new Date(schedule.departureDate);
            const arrivalTime = new Date(schedule.arrivalDate);
            const minutesToDeparture = (departureTime - now) / (1000 * 60);
            const minutesSinceDeparture = (now - departureTime) / (1000 * 60);

            return {
                flightCode: schedule.flightCode,
                currentStatus: schedule.status,
                departureDate: schedule.departureDate,
                arrivalDate: schedule.arrivalDate,
                minutesToDeparture: Math.round(minutesToDeparture),
                minutesSinceDeparture: Math.round(minutesSinceDeparture),
                shouldBeBoarding: schedule.status === 'scheduled' && minutesToDeparture <= 120 && minutesToDeparture > 0,
                shouldBeDeparted: (schedule.status === 'boarding' || schedule.status === 'scheduled') && minutesSinceDeparture >= 0,
                shouldBeArrived: schedule.status === 'departed' && (now >= arrivalTime)
            };
        });

        res.json({
            success: true,
            currentTime: now,
            totalSchedules: statusInfo.length,
            schedules: statusInfo
        });
    } catch (err) {
        console.error('Status check error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra trạng thái',
            error: err.message
        });
    }
});

module.exports = router;