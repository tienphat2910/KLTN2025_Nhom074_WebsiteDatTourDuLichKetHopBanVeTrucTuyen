const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const FlightClass = require('../models/FlightClass');
const FlightSchedule = require('../models/FlightSchedule');
const Airline = require('../models/Airline');
const Airport = require('../models/Airport');
const admin = require('../middleware/admin');

/**
 * @swagger
 * tags:
 *   name: Flights
 *   description: API quản lý chuyến bay
 */

/**
 * @swagger
 * /api/flights:
 *   get:
 *     summary: Lấy danh sách chuyến bay
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: departureAirportId
 *         schema:
 *           type: string
 *         description: Lọc theo sân bay khởi hành
 *       - in: query
 *         name: arrivalAirportId
 *         schema:
 *           type: string
 *         description: Lọc theo sân bay đến
 *       - in: query
 *         name: airlineId
 *         schema:
 *           type: string
 *         description: Lọc theo hãng hàng không
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách chuyến bay với thông tin đầy đủ
 */
router.get('/', async (req, res) => {
    try {
        const { departureAirportId, arrivalAirportId, airlineId, status } = req.query;

        const query = {};
        if (departureAirportId) query.departureAirportId = departureAirportId;
        if (arrivalAirportId) query.arrivalAirportId = arrivalAirportId;
        if (airlineId) query.airlineId = airlineId;
        if (status) query.status = status;

        const flights = await Flight.find(query)
            .populate('airlineId', 'name code logo')
            .populate('departureAirportId', 'name city iata icao')
            .populate('arrivalAirportId', 'name city iata icao')
            .sort({ createdAt: -1 });

        // Get flight classes for each flight
        const flightsWithClasses = await Promise.all(
            flights.map(async (flight) => {
                const classes = await FlightClass.find({
                    flightCode: flight.flightCode
                }).sort({ price: 1 });

                return {
                    ...flight.toObject(),
                    classes
                };
            })
        );

        res.json({
            success: true,
            data: flightsWithClasses
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
 * /api/flights/search:
 *   get:
 *     summary: Tìm kiếm chuyến bay theo lịch trình
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         description: Sân bay khởi hành (ID)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         description: Sân bay đến (ID)
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bay (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Danh sách chuyến bay có lịch trong ngày
 */
router.get('/search', async (req, res) => {
    try {
        const { from, to, date } = req.query;
        console.log('Search params:', { from, to, date });

        if (!from || !to || !date) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin tìm kiếm (from, to, date)'
            });
        }

        // Find airport ObjectIds by IATA codes
        console.log('Looking for airports:', from.toUpperCase(), to.toUpperCase());
        const departureAirport = await Airport.findOne({ iata: from.toUpperCase() });
        const arrivalAirport = await Airport.findOne({ iata: to.toUpperCase() });
        console.log('Found departure airport:', departureAirport);
        console.log('Found arrival airport:', arrivalAirport);

        if (!departureAirport || !arrivalAirport) {
            console.log('Airports not found, returning empty results');
            return res.json({
                success: true,
                data: [],
                count: 0,
                message: 'Không tìm thấy sân bay phù hợp'
            });
        }

        // Find flights using airport ObjectIds
        console.log('Looking for flights between airports');
        const flights = await Flight.find({
            departureAirportId: departureAirport._id,
            arrivalAirportId: arrivalAirport._id,
            status: 'active'
        })
            .populate('airlineId', 'name code logo')
            .populate('departureAirportId', 'name city iata')
            .populate('arrivalAirportId', 'name city iata');
        console.log('Found flights:', flights.length);

        // Get schedules for the specific date
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        console.log('Date range:', startDate, endDate);

        const results = await Promise.all(
            flights.map(async (flight) => {
                console.log('Processing flight:', flight.flightCode);
                const schedules = await FlightSchedule.find({
                    flightCode: flight.flightCode,
                    departureDate: {
                        $gte: startDate,
                        $lte: endDate
                    },
                    status: { $nin: ['cancelled'] },
                    remainingSeats: { $gt: 0 }
                });
                console.log('Found schedules for', flight.flightCode, ':', schedules.length);

                const classes = await FlightClass.find({
                    flightCode: flight.flightCode
                }).sort({ price: 1 });
                console.log('Found classes for', flight.flightCode, ':', classes.length);

                return schedules.map(schedule => ({
                    ...flight.toObject(),
                    schedule: schedule.toObject(),
                    classes
                }));
            })
        );

        const flatResults = results.flat();
        console.log('Final results:', flatResults.length);

        // Always return success with data (even if empty)
        res.json({
            success: true,
            data: flatResults,
            count: flatResults.length,
            message: flatResults.length === 0 ? 'Không tìm thấy chuyến bay' : undefined
        });
    } catch (err) {
        console.error('Search error:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({
            success: false,
            message: `Lỗi server: ${err.message}`
        });
    }
});

/**
 * @swagger
 * /api/flights/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết chuyến bay
 *     tags: [Flights]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin chi tiết chuyến bay
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id)
            .populate('airlineId', 'name code logo description')
            .populate('departureAirportId')
            .populate('arrivalAirportId');

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chuyến bay'
            });
        }

        // Get all classes for this flight
        const classes = await FlightClass.find({
            flightCode: flight.flightCode
        }).sort({ price: 1 });

        // Get upcoming schedules
        const schedules = await FlightSchedule.find({
            flightCode: flight.flightCode,
            departureDate: { $gte: new Date() },
            status: { $nin: ['cancelled'] }
        }).sort({ departureDate: 1 }).limit(10);

        res.json({
            success: true,
            data: {
                ...flight.toObject(),
                classes,
                upcomingSchedules: schedules
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
 * /api/flights:
 *   post:
 *     summary: Tạo chuyến bay mới (Admin)
 *     tags: [Flights]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Flight'
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', admin, async (req, res) => {
    try {
        const {
            flightCode,
            airlineId,
            departureAirportId,
            arrivalAirportId,
            departureTime,
            arrivalTime,
            durationMinutes,
            basePrice,
            availableSeats,
            aircraft
        } = req.body;

        // Check if flight code already exists
        const existing = await Flight.findOne({ flightCode: flightCode.toUpperCase() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Mã chuyến bay đã tồn tại'
            });
        }

        const flight = new Flight({
            flightCode: flightCode.toUpperCase(),
            airlineId,
            departureAirportId,
            arrivalAirportId,
            departureTime,
            arrivalTime,
            durationMinutes,
            basePrice,
            availableSeats,
            aircraft
        });

        await flight.save();

        const populatedFlight = await Flight.findById(flight._id)
            .populate('airlineId')
            .populate('departureAirportId')
            .populate('arrivalAirportId');

        res.status(201).json({
            success: true,
            data: populatedFlight,
            message: 'Tạo chuyến bay thành công'
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
 * /api/flights/{id}:
 *   put:
 *     summary: Cập nhật thông tin chuyến bay (Admin)
 *     tags: [Flights]
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
 *             $ref: '#/components/schemas/Flight'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', admin, async (req, res) => {
    try {
        const flight = await Flight.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('airlineId')
            .populate('departureAirportId')
            .populate('arrivalAirportId');

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chuyến bay'
            });
        }

        res.json({
            success: true,
            data: flight,
            message: 'Cập nhật chuyến bay thành công'
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
 * /api/flights/{id}:
 *   delete:
 *     summary: Xóa chuyến bay (Admin)
 *     tags: [Flights]
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
        const flight = await Flight.findByIdAndDelete(req.params.id);

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chuyến bay'
            });
        }

        // Also delete related classes and schedules
        await FlightClass.deleteMany({ flightCode: flight.flightCode });
        await FlightSchedule.deleteMany({ flightCode: flight.flightCode });

        res.json({
            success: true,
            message: 'Xóa chuyến bay thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// Get seat map for a specific flight schedule
router.get('/:id/seats', async (req, res) => {
    try {
        const { scheduleId } = req.query;
        if (!scheduleId) {
            return res.status(400).json({ success: false, message: 'scheduleId query parameter is required' });
        }

        const schedule = await FlightSchedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }

        // If seatMap doesn't exist yet, return an empty array (client may render default map)
        res.json({ success: true, data: schedule.seatMap || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Reserve seats for a schedule (mark as reserved and decrement remainingSeats)
router.post('/:id/reserve-seats', async (req, res) => {
    try {
        const { scheduleId, seats, bookingFlightId, bookingId } = req.body;
        if (!scheduleId || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ success: false, message: 'scheduleId and seats[] are required' });
        }

        const schedule = await FlightSchedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }

        // If seatMap is empty, initialize a default A321 map (32 rows, A-F)
        if (!schedule.seatMap || schedule.seatMap.length === 0) {
            const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
            const map = [];
            for (let r = 1; r <= 32; r++) {
                cols.forEach(c => map.push({ seatNumber: `${r}${c}`, status: 'available' }));
            }
            schedule.seatMap = map;
        }

        // Check availability
        const unavailable = seats.filter(s => {
            const entry = schedule.seatMap.find(sm => sm.seatNumber === s);
            return !entry || entry.status !== 'available';
        });

        if (unavailable.length > 0) {
            return res.status(400).json({ success: false, message: `Some seats are not available: ${unavailable.join(', ')}` });
        }

        // Mark seats as reserved
        seats.forEach(s => {
            const entry = schedule.seatMap.find(sm => sm.seatNumber === s);
            if (entry) {
                entry.status = 'reserved';
                if (bookingId) entry.bookingId = bookingId;
                if (bookingFlightId) entry.bookingFlightId = bookingFlightId;
            }
        });

        // Decrement remainingSeats
        schedule.remainingSeats = Math.max(0, schedule.remainingSeats - seats.length);
        await schedule.save();

        res.json({ success: true, data: schedule });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
