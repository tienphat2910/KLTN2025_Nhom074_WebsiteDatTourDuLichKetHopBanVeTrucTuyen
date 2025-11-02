const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const admin = require('../../middleware/admin');
const Booking = require('../../models/Booking');
const BookingFlight = require('../../models/BookingFlight');
const BookingTour = require('../../models/BookingTour');
const BookingActivity = require('../../models/BookingActivity');
const User = require('../../models/User');

// Apply admin middleware to all routes
router.use(auth, admin);

/**
 * @swagger
 * /api/admin/analytics/overview:
 *   get:
 *     summary: Get analytics overview
 *     tags: [Admin Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/overview', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        // Get completed bookings for revenue calculation (matching BookingStats logic)
        const completedBookings = await Booking.find({
            ...dateFilter,
            status: 'completed'
        });

        console.log('Analytics - Completed bookings found:', completedBookings.length);
        console.log('Analytics - Sample completed booking:', completedBookings[0]);

        // Calculate total revenue (only from completed bookings)
        const totalRevenue = completedBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

        console.log('Analytics - Total revenue from completed:', totalRevenue);

        // Get ALL bookings for total count (matching BookingStats)
        const allBookings = await Booking.find(dateFilter);

        // Total bookings (ALL statuses - matching BookingStats)
        const totalBookings = allBookings.length;

        // Get unique customers (from ALL bookings)
        const uniqueCustomers = new Set(allBookings.map(b => b.userId.toString()));
        const totalCustomers = uniqueCustomers.size;

        // Average order value (total revenue / completed bookings)
        // Giá trị trung bình của các đơn hàng đã hoàn thành
        const averageOrderValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

        // Revenue by type - only from completed bookings
        const flightRevenue = completedBookings
            .filter(b => b.bookingType === 'flight')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        const tourRevenue = completedBookings
            .filter(b => b.bookingType === 'tour')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        const activityRevenue = completedBookings
            .filter(b => b.bookingType === 'activity')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        // Monthly revenue (last 12 months)
        const monthlyRevenue = await getMonthlyRevenue();

        // Top customers
        const topCustomers = await getTopCustomers(5);

        // Booking status distribution (already have allBookings from above)
        const statusDistribution = {
            pending: allBookings.filter(b => b.status === 'pending').length,
            confirmed: allBookings.filter(b => b.status === 'confirmed').length,
            completed: allBookings.filter(b => b.status === 'completed').length,
            cancelled: allBookings.filter(b => b.status === 'cancelled').length
        };

        res.json({
            success: true,
            data: {
                overview: {
                    totalRevenue,
                    totalBookings,
                    totalCustomers,
                    averageOrderValue
                },
                revenueByType: {
                    flights: flightRevenue,
                    tours: tourRevenue,
                    activities: activityRevenue
                },
                monthlyRevenue,
                topCustomers,
                statusDistribution
            }
        });
    } catch (error) {
        console.error('Analytics overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê'
        });
    }
});

/**
 * Get monthly revenue for last 12 months
 */
async function getMonthlyRevenue() {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        // Only count completed bookings for revenue
        const completedBookings = await Booking.find({
            createdAt: { $gte: date, $lt: nextMonth },
            status: 'completed'
        });

        // Get ALL bookings for count (matching BookingStats logic)
        const allBookings = await Booking.find({
            createdAt: { $gte: date, $lt: nextMonth }
        });

        const revenue = completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        months.push({
            month: date.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }),
            revenue,
            bookings: allBookings.length // Total bookings (all statuses)
        });
    }

    return months;
}

/**
 * Get top customers by total spending
 */
async function getTopCustomers(limit = 5) {
    const customers = await Booking.aggregate([
        {
            $match: {
                status: 'completed' // Only completed bookings for revenue
            }
        },
        {
            $group: {
                _id: '$userId',
                totalSpent: { $sum: '$totalPrice' },
                bookingCount: { $sum: 1 }
            }
        },
        {
            $sort: { totalSpent: -1 }
        },
        {
            $limit: limit
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $unwind: '$user'
        },
        {
            $project: {
                name: '$user.name',
                email: '$user.email',
                totalSpent: 1,
                bookingCount: 1
            }
        }
    ]);

    return customers;
}

/**
 * @swagger
 * /api/admin/analytics/revenue-trends:
 *   get:
 *     summary: Get revenue trends
 */
router.get('/revenue-trends', async (req, res) => {
    try {
        const { period = 'month' } = req.query; // day, week, month, year

        let groupBy;
        let dateRange;

        switch (period) {
            case 'day':
                // Last 30 days
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
                dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'week':
                // Last 12 weeks
                groupBy = { $week: '$createdAt' };
                dateRange = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                // Last 5 years
                groupBy = { $year: '$createdAt' };
                dateRange = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
                break;
            default: // month
                // Last 12 months
                groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
                dateRange = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);
        }

        const trends = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: dateRange },
                    status: 'completed' // Only completed bookings for revenue
                }
            },
            {
                $group: {
                    _id: groupBy,
                    revenue: { $sum: '$totalPrice' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        console.error('Revenue trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy xu hướng doanh thu'
        });
    }
});

/**
 * @swagger
 * /api/admin/analytics/flights:
 *   get:
 *     summary: Get flight analytics
 */
router.get('/flights', async (req, res) => {
    try {
        const Flight = require('../../models/Flight');
        const FlightSchedule = require('../../models/FlightSchedule');
        const Airline = require('../../models/Airline');
        const Airport = require('../../models/Airport');

        // Get all flight bookings
        const flightBookings = await BookingFlight.find()
            .populate({
                path: 'flightId',
                populate: [
                    { path: 'airlineId' },
                    { path: 'arrivalAirportId' }
                ]
            })
            .populate('bookingId');

        // Completed flight bookings
        const completedFlightBookings = flightBookings.filter(
            fb => fb.bookingId && fb.bookingId.status === 'completed'
        );

        // Revenue by airline
        const revenueByAirline = {};
        const bookingsByAirline = {};

        for (const fb of completedFlightBookings) {
            if (fb.flightId && fb.flightId.airlineId) {
                const airlineId = fb.flightId.airlineId._id
                    ? fb.flightId.airlineId._id.toString()
                    : fb.flightId.airlineId.toString();
                revenueByAirline[airlineId] = (revenueByAirline[airlineId] || 0) + (fb.totalFlightPrice || 0);
                bookingsByAirline[airlineId] = (bookingsByAirline[airlineId] || 0) + 1;
            }
        }

        // Get airline details
        const airlines = await Airline.find();
        const airlineStats = airlines.map(airline => ({
            _id: airline._id,
            name: airline.name,
            code: airline.code,
            revenue: revenueByAirline[airline._id.toString()] || 0,
            bookings: bookingsByAirline[airline._id.toString()] || 0
        })).filter(a => a.bookings > 0);

        // Top destinations (based on arrival airport)
        const destinationStats = {};
        for (const fb of completedFlightBookings) {
            if (fb.flightId && fb.flightId.arrivalAirportId) {
                const airportId = fb.flightId.arrivalAirportId._id
                    ? fb.flightId.arrivalAirportId._id.toString()
                    : fb.flightId.arrivalAirportId.toString();
                destinationStats[airportId] = (destinationStats[airportId] || 0) + 1;
            }
        }

        const airports = await Airport.find();
        const topDestinations = airports.map(airport => ({
            _id: airport._id,
            name: airport.name,
            city: airport.city,
            code: airport.iata || airport.icao || 'N/A',
            bookings: destinationStats[airport._id.toString()] || 0
        }))
            .filter(d => d.bookings > 0)
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 10);

        // Cancellation rate
        const cancelledFlights = flightBookings.filter(
            fb => fb.bookingId && fb.bookingId.status === 'cancelled'
        ).length;
        const cancellationRate = flightBookings.length > 0
            ? (cancelledFlights / flightBookings.length) * 100
            : 0;

        console.log('Flight analytics:');
        console.log('- Total bookings:', flightBookings.length);
        console.log('- Completed:', completedFlightBookings.length);
        console.log('- Cancelled:', cancelledFlights);
        console.log('- Cancellation rate:', cancellationRate.toFixed(2) + '%');

        res.json({
            success: true,
            data: {
                totalFlightBookings: flightBookings.length,
                completedFlightBookings: completedFlightBookings.length,
                revenueByAirline: airlineStats.sort((a, b) => b.revenue - a.revenue),
                topDestinations,
                cancellationRate: cancellationRate.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Flight analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê chuyến bay'
        });
    }
});

/**
 * @swagger
 * /api/admin/analytics/tours:
 *   get:
 *     summary: Get tour analytics
 */
router.get('/tours', async (req, res) => {
    try {
        const Tour = require('../../models/Tour');
        const Destination = require('../../models/Destination');

        // Get all tour bookings
        const tourBookings = await BookingTour.find()
            .populate({
                path: 'tourId',
                populate: {
                    path: 'destinationId'
                }
            })
            .populate('bookingId');

        // Completed tour bookings
        const completedTourBookings = tourBookings.filter(
            tb => tb.bookingId && tb.bookingId.status === 'completed'
        );

        // Top tours by revenue
        const tourRevenue = {};
        const tourBookingCount = {};

        for (const tb of completedTourBookings) {
            if (tb.tourId) {
                const tourId = tb.tourId._id.toString();
                tourRevenue[tourId] = (tourRevenue[tourId] || 0) + (tb.subtotal || 0);
                tourBookingCount[tourId] = (tourBookingCount[tourId] || 0) + 1;
            }
        }

        const tours = await Tour.find().populate('destinationId');

        // Debug: check tour titles
        console.log('All tours:', tours.map(t => ({ id: t._id, title: t.title, dest: t.destinationId?.name })));

        const topTours = tours.map(tour => ({
            _id: tour._id,
            name: tour.title || `Tour tại ${tour.destinationId?.name || 'N/A'}`,
            destination: tour.destinationId ? tour.destinationId.name : 'N/A',
            revenue: tourRevenue[tour._id.toString()] || 0,
            bookings: tourBookingCount[tour._id.toString()] || 0
        }))
            .filter(t => t.bookings > 0)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        console.log('Tour analytics - Top tours:');
        topTours.forEach((t, i) => {
            console.log(`${i + 1}. ${t.name} (${t.destination}) - ${t.revenue} VND - ${t.bookings} bookings`);
        });

        // Revenue by destination
        const destinationRevenue = {};
        for (const tb of completedTourBookings) {
            if (tb.tourId && tb.tourId.destinationId) {
                const destId = tb.tourId.destinationId._id
                    ? tb.tourId.destinationId._id.toString()
                    : tb.tourId.destinationId.toString();
                destinationRevenue[destId] = (destinationRevenue[destId] || 0) + (tb.subtotal || 0);
            }
        }

        const destinations = await Destination.find();
        const revenueByDestination = destinations.map(dest => ({
            _id: dest._id,
            name: dest.name,
            revenue: destinationRevenue[dest._id.toString()] || 0
        }))
            .filter(d => d.revenue > 0)
            .sort((a, b) => b.revenue - a.revenue);

        res.json({
            success: true,
            data: {
                totalTourBookings: tourBookings.length,
                completedTourBookings: completedTourBookings.length,
                topTours,
                revenueByDestination
            }
        });
    } catch (error) {
        console.error('Tour analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê tour'
        });
    }
});

/**
 * @swagger
 * /api/admin/analytics/activities:
 *   get:
 *     summary: Get activity analytics
 */
router.get('/activities', async (req, res) => {
    try {
        const Activity = require('../../models/Activity');
        const Destination = require('../../models/Destination');

        // Get all activity bookings
        const activityBookings = await BookingActivity.find()
            .populate({
                path: 'activityId',
                populate: {
                    path: 'destinationId'
                }
            })
            .populate('bookingId');

        // Completed activity bookings
        const completedActivityBookings = activityBookings.filter(
            ab => ab.bookingId && ab.bookingId.status === 'completed'
        );

        // Top activities by revenue
        const activityRevenue = {};
        const activityBookingCount = {};

        for (const ab of completedActivityBookings) {
            if (ab.activityId) {
                const activityId = ab.activityId._id.toString();
                activityRevenue[activityId] = (activityRevenue[activityId] || 0) + (ab.subtotal || 0);
                activityBookingCount[activityId] = (activityBookingCount[activityId] || 0) + 1;
            }
        }

        const activities = await Activity.find().populate('destinationId');
        const topActivities = activities.map(activity => ({
            _id: activity._id,
            name: activity.name,
            destination: activity.destinationId ? activity.destinationId.name : 'N/A',
            revenue: activityRevenue[activity._id.toString()] || 0,
            bookings: activityBookingCount[activity._id.toString()] || 0
        }))
            .filter(a => a.bookings > 0)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Ticket type distribution (adult/child/baby/senior)
        let totalAdults = 0, totalChildren = 0, totalBabies = 0, totalSeniors = 0;

        for (const ab of completedActivityBookings) {
            totalAdults += ab.numAdults || 0;
            totalChildren += ab.numChildren || 0;
            totalBabies += ab.numBabies || 0;
            totalSeniors += ab.numSeniors || 0;
        }

        const ticketDistribution = {
            adults: totalAdults,
            children: totalChildren,
            babies: totalBabies,
            seniors: totalSeniors,
            total: totalAdults + totalChildren + totalBabies + totalSeniors
        };

        res.json({
            success: true,
            data: {
                totalActivityBookings: activityBookings.length,
                completedActivityBookings: completedActivityBookings.length,
                topActivities,
                ticketDistribution
            }
        });
    } catch (error) {
        console.error('Activity analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê hoạt động'
        });
    }
});

module.exports = router;
