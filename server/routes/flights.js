const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const FlightClass = require('../models/FlightClass');
const FlightSchedule = require('../models/FlightSchedule');
const Airline = require('../models/Airline');
const Airport = require('../models/Airport');
const admin = require('../middleware/admin');
const {
    searchFlightOffers,
    getFlightOfferPricing,
    getSeatMap,
    searchAirports,
    getVietnamAirports,
    getNearestAirports,
    searchAirlines,
    getVietnamAirlines,
    getFlightSchedules,
    getFlightInspiration,
    getCheapestFlightDates,
    VIETNAM_AIRLINES,
    VIETNAM_AIRPORTS
} = require('../config/amadeus');

/**
 * @swagger
 * tags:
 *   name: Flights
 *   description: API quản lý chuyến bay
 */

// ========================================
// AMADEUS API ENDPOINTS
// ========================================

/**
 * @swagger
 * /api/flights/amadeus/search:
 *   get:
 *     summary: Tìm kiếm chuyến bay từ Amadeus API
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: originLocationCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã IATA sân bay đi (VD SGN, HAN)
 *       - in: query
 *         name: destinationLocationCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã IATA sân bay đến
 *       - in: query
 *         name: departureDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày đi (YYYY-MM-DD)
 *       - in: query
 *         name: returnDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày về (khứ hồi)
 *       - in: query
 *         name: adults
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: children
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: infants
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: travelClass
 *         schema:
 *           type: string
 *           enum: [ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST]
 *       - in: query
 *         name: nonStop
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: currencyCode
 *         schema:
 *           type: string
 *           default: VND
 *       - in: query
 *         name: max
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Danh sách chuyến bay từ Amadeus
 */
router.get('/amadeus/search', async (req, res) => {
    try {
        const {
            originLocationCode,
            destinationLocationCode,
            departureDate,
            returnDate,
            adults = '1',
            children = '0',
            infants = '0',
            travelClass,
            includedAirlineCodes,
            excludedAirlineCodes,
            nonStop,
            currencyCode = 'VND',
            maxPrice,
            max = '10'
        } = req.query;

        if (!originLocationCode || !destinationLocationCode || !departureDate) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: originLocationCode, destinationLocationCode, departureDate'
            });
        }

        const amadeusResponse = await searchFlightOffers({
            originLocationCode: originLocationCode.toUpperCase(),
            destinationLocationCode: destinationLocationCode.toUpperCase(),
            departureDate,
            returnDate,
            adults,
            children,
            infants,
            travelClass,
            includedAirlineCodes,
            excludedAirlineCodes,
            nonStop,
            currencyCode,
            maxPrice,
            max
        });

        res.json({
            success: true,
            data: amadeusResponse.data || [],
            dictionaries: amadeusResponse.dictionaries || {},
            meta: amadeusResponse.meta || {},
            count: amadeusResponse.data?.length || 0
        });
    } catch (err) {
        console.error('Amadeus search error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi tìm kiếm chuyến bay từ Amadeus'
        });
    }
});

/**
 * @swagger
 * /api/flights/amadeus/pricing:
 *   post:
 *     summary: Xác nhận giá vé từ Amadeus
 *     tags: [Flights]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flightOffer:
 *                 type: object
 *                 description: Flight offer object từ kết quả tìm kiếm
 *     responses:
 *       200:
 *         description: Thông tin giá đã xác nhận
 */
router.post('/amadeus/pricing', async (req, res) => {
    try {
        const { flightOffer } = req.body;

        if (!flightOffer) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin flightOffer'
            });
        }

        const pricingResponse = await getFlightOfferPricing(flightOffer);

        res.json({
            success: true,
            data: pricingResponse.data || {},
            dictionaries: pricingResponse.dictionaries || {}
        });
    } catch (err) {
        console.error('Amadeus pricing error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi xác nhận giá vé'
        });
    }
});

/**
 * @swagger
 * /api/flights/amadeus/seatmap:
 *   post:
 *     summary: Lấy sơ đồ ghế ngồi từ Amadeus
 *     tags: [Flights]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flightOffer:
 *                 type: object
 *                 description: Flight offer object từ kết quả tìm kiếm
 *     responses:
 *       200:
 *         description: Sơ đồ ghế ngồi
 */
router.post('/amadeus/seatmap', async (req, res) => {
    try {
        const { flightOffer } = req.body;

        if (!flightOffer) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin flightOffer'
            });
        }

        const seatmapResponse = await getSeatMap(flightOffer);

        res.json({
            success: true,
            data: seatmapResponse.data || [],
            dictionaries: seatmapResponse.dictionaries || {}
        });
    } catch (err) {
        console.error('Amadeus seatmap error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi lấy sơ đồ ghế ngồi'
        });
    }
});

/**
 * @swagger
 * /api/flights/amadeus/airports:
 *   get:
 *     summary: Tìm kiếm sân bay từ Amadeus
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm (tên thành phố, sân bay, mã IATA)
 *       - in: query
 *         name: countryCode
 *         schema:
 *           type: string
 *         description: Mã quốc gia (VN cho Việt Nam)
 *     responses:
 *       200:
 *         description: Danh sách sân bay
 */
router.get('/amadeus/airports', async (req, res) => {
    try {
        const { keyword, countryCode } = req.query;

        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu từ khóa tìm kiếm'
            });
        }

        const response = await searchAirports({
            keyword,
            subType: 'AIRPORT,CITY',
            countryCode,
            page: { limit: 20 }
        });

        res.json({
            success: true,
            data: response.data || [],
            count: response.data?.length || 0
        });
    } catch (err) {
        console.error('Amadeus airports error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi tìm kiếm sân bay'
        });
    }
});

/**
 * @swagger
 * /api/flights/amadeus/airports/vietnam:
 *   get:
 *     summary: Lấy danh sách sân bay Việt Nam
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm (tùy chọn)
 *     responses:
 *       200:
 *         description: Danh sách sân bay Việt Nam
 */
router.get('/amadeus/airports/vietnam', async (req, res) => {
    try {
        const { keyword } = req.query;
        const response = await getVietnamAirports(keyword);

        res.json({
            success: true,
            data: response.data || [],
            vietnamAirportCodes: VIETNAM_AIRPORTS,
            count: response.data?.length || 0
        });
    } catch (err) {
        console.error('Amadeus Vietnam airports error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi lấy danh sách sân bay Việt Nam'
        });
    }
});

/**
 * @swagger
 * /api/flights/amadeus/airports/nearest:
 *   get:
 *     summary: Lấy sân bay gần nhất theo tọa độ
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 500
 *         description: Bán kính tìm kiếm (km)
 *     responses:
 *       200:
 *         description: Danh sách sân bay gần nhất
 */
router.get('/amadeus/airports/nearest', async (req, res) => {
    try {
        const { latitude, longitude, radius = 500 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu tọa độ (latitude, longitude)'
            });
        }

        const response = await getNearestAirports(
            parseFloat(latitude),
            parseFloat(longitude),
            parseInt(radius)
        );

        res.json({
            success: true,
            data: response.data || [],
            count: response.data?.length || 0
        });
    } catch (err) {
        console.error('Amadeus nearest airports error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi tìm sân bay gần nhất'
        });
    }
});

/**
 * @swagger
 * /api/flights/amadeus/airlines:
 *   get:
 *     summary: Tìm kiếm hãng hàng không
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: airlineCodes
 *         schema:
 *           type: string
 *         description: Mã IATA hãng bay (VD VN,VJ,QH)
 *     responses:
 *       200:
 *         description: Thông tin hãng hàng không
 */
router.get('/amadeus/airlines', async (req, res) => {
    try {
        const { airlineCodes } = req.query;

        if (!airlineCodes) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mã hãng bay'
            });
        }

        const response = await searchAirlines(airlineCodes);

        res.json({
            success: true,
            data: response.data || [],
            count: response.data?.length || 0
        });
    } catch (err) {
        console.error('Amadeus airlines error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi tìm hãng hàng không'
        });
    }
});

/**
 * @swagger
 * /api/flights/amadeus/airlines/vietnam:
 *   get:
 *     summary: Lấy danh sách hãng hàng không Việt Nam
 *     tags: [Flights]
 *     responses:
 *       200:
 *         description: Danh sách hãng hàng không Việt Nam
 */
router.get('/amadeus/airlines/vietnam', async (req, res) => {
    try {
        const response = await getVietnamAirlines();

        res.json({
            success: true,
            data: response.data || [],
            vietnamAirlines: VIETNAM_AIRLINES,
            count: response.data?.length || 0
        });
    } catch (err) {
        console.error('Amadeus Vietnam airlines error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi lấy danh sách hãng bay Việt Nam'
        });
    }
});

/**
 * @swagger
 * /api/flights/amadeus/schedules:
 *   get:
 *     summary: Lấy lịch trình chuyến bay cụ thể
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: carrierCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã hãng bay (VN, VJ, QH)
 *       - in: query
 *         name: flightNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Số hiệu chuyến bay
 *       - in: query
 *         name: scheduledDepartureDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bay (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lịch trình chuyến bay
 */
router.get('/amadeus/schedules', async (req, res) => {
    try {
        const { carrierCode, flightNumber, scheduledDepartureDate } = req.query;

        if (!carrierCode || !flightNumber || !scheduledDepartureDate) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin: carrierCode, flightNumber, scheduledDepartureDate'
            });
        }

        const response = await getFlightSchedules({
            carrierCode: carrierCode.toUpperCase(),
            flightNumber,
            scheduledDepartureDate
        });

        res.json({
            success: true,
            data: response.data || [],
            count: response.data?.length || 0
        });
    } catch (err) {
        console.error('Amadeus schedules error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi lấy lịch trình chuyến bay'
        });
    }
});

/**
 * @swagger
 * /api/flights/amadeus/inspiration:
 *   get:
 *     summary: Gợi ý điểm đến với giá rẻ nhất (Flight Inspiration)
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *         description: Sân bay đi (VD SGN, HAN)
 *       - in: query
 *         name: departureDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày đi (tùy chọn)
 *       - in: query
 *         name: oneWay
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *         description: Số ngày đi (cho khứ hồi)
 *       - in: query
 *         name: nonStop
 *         schema:
 *           type: boolean
 *         description: Chỉ bay thẳng
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: integer
 *         description: Giá tối đa
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           default: VND
 *     responses:
 *       200:
 *         description: Gợi ý điểm đến với giá
 */
router.get('/amadeus/inspiration', async (req, res) => {
    try {
        const {
            origin,
            departureDate,
            oneWay,
            duration,
            nonStop,
            maxPrice,
            currency = 'VND'
        } = req.query;

        if (!origin) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu sân bay đi (origin)'
            });
        }

        const response = await getFlightInspiration({
            origin: origin.toUpperCase(),
            departureDate,
            oneWay: oneWay === 'true',
            duration: duration ? parseInt(duration) : undefined,
            nonStop: nonStop === 'true',
            maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
            currency
        });

        res.json({
            success: true,
            data: response.data || [],
            dictionaries: response.dictionaries || {},
            count: response.data?.length || 0
        });
    } catch (err) {
        console.error('Amadeus inspiration error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi lấy gợi ý điểm đến'
        });
    }
});

/**
 * @swagger
 * /api/flights/amadeus/cheapest-dates:
 *   get:
 *     summary: Tìm ngày bay giá rẻ nhất cho tuyến đường
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *         description: Sân bay đi
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *         description: Sân bay đến
 *       - in: query
 *         name: departureDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: oneWay
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *       - in: query
 *         name: nonStop
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: integer
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           default: VND
 *     responses:
 *       200:
 *         description: Các ngày bay giá rẻ nhất
 */
router.get('/amadeus/cheapest-dates', async (req, res) => {
    try {
        const {
            origin,
            destination,
            departureDate,
            oneWay,
            duration,
            nonStop,
            maxPrice,
            currency = 'VND'
        } = req.query;

        if (!origin || !destination) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu sân bay đi hoặc đến (origin, destination)'
            });
        }

        const response = await getCheapestFlightDates({
            origin: origin.toUpperCase(),
            destination: destination.toUpperCase(),
            departureDate,
            oneWay: oneWay === 'true',
            duration: duration ? parseInt(duration) : undefined,
            nonStop: nonStop === 'true',
            maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
            currency
        });

        res.json({
            success: true,
            data: response.data || [],
            dictionaries: response.dictionaries || {},
            count: response.data?.length || 0
        });
    } catch (err) {
        console.error('Amadeus cheapest dates error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Lỗi khi tìm ngày bay giá rẻ'
        });
    }
});

// ========================================
// LOCAL DATABASE ENDPOINTS
// ========================================

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
 *         description: Danh sách chuyến bay với thông tin đầy đủ
 */
router.get('/', async (req, res) => {
    try {
        const { departureAirportId, arrivalAirportId, airlineId, status, page = 1, limit = 10 } = req.query;

        const query = {};
        if (departureAirportId) query.departureAirportId = departureAirportId;
        if (arrivalAirportId) query.arrivalAirportId = arrivalAirportId;
        if (airlineId) query.airlineId = airlineId;
        if (status) query.status = status;

        // Get total count for pagination
        const totalCount = await Flight.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);
        const skip = (page - 1) * limit;

        // Get paginated flights
        const flights = await Flight.find(query)
            .populate('airlineId', 'name code logo')
            .populate('departureAirportId', 'name city iata icao')
            .populate('arrivalAirportId', 'name city iata icao')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

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
            data: flightsWithClasses,
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
        const flight = await Flight.findById(req.params.id);

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chuyến bay'
            });
        }

        // Count related data before deletion
        const classesCount = await FlightClass.countDocuments({ flightCode: flight.flightCode });
        const schedulesCount = await FlightSchedule.countDocuments({ flightCode: flight.flightCode });

        // Delete related classes and schedules first
        await FlightClass.deleteMany({ flightCode: flight.flightCode });
        await FlightSchedule.deleteMany({ flightCode: flight.flightCode });

        // Then delete the flight itself
        await Flight.findByIdAndDelete(req.params.id);

        console.log(`✅ Deleted flight ${flight.flightCode}: ${schedulesCount} schedules, ${classesCount} classes`);

        res.json({
            success: true,
            message: `Xóa chuyến bay thành công (bao gồm ${schedulesCount} lịch bay và ${classesCount} hạng ghế)`,
            deletedCount: {
                flight: 1,
                schedules: schedulesCount,
                classes: classesCount
            }
        });
    } catch (err) {
        console.error('❌ Error deleting flight:', err);
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
