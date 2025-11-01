const express = require('express');
const path = require('path');
const Booking = require(path.resolve(__dirname, '../../models/Booking'));
const User = require(path.resolve(__dirname, '../../models/User'));
const admin = require(path.resolve(__dirname, '../../middleware/admin'));
const { notifyBookingCreated, notifyPaymentCompleted, notifyBookingUpdated, notifyBookingCancelled } = require(path.resolve(__dirname, '../../utils/socketHandler'));
const router = express.Router();

// Get all bookings for admin with user info
router.get('/', admin, async (req, res) => {
    try {
        const { page = 1, limit = 50, status, bookingType, search } = req.query;

        // Build query
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (bookingType && bookingType !== 'all') {
            query.bookingType = bookingType;
        }

        // Search by booking ID or user info
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { _id: searchRegex },
                // We'll handle user search in aggregation
            ];
        }

        const bookings = await Booking.find(query)
            .populate('userId', 'fullName email phone')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Booking.countDocuments(query);

        // If searching by user info, we need to do it differently
        let filteredBookings = bookings;
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filteredBookings = bookings.filter(booking => {
                const user = booking.userId;
                return (
                    booking._id.toString().includes(search) ||
                    (user && (
                        user.fullName?.match(searchRegex) ||
                        user.email?.match(searchRegex) ||
                        user.phone?.match(searchRegex)
                    ))
                );
            });
        }

        // Transform data to have 'user' field for frontend compatibility
        // For flight bookings, enrich with round trip status and actual total
        const BookingFlight = require(path.resolve(__dirname, '../../models/BookingFlight'));

        const transformedBookings = await Promise.all(filteredBookings.map(async (booking) => {
            const bookingObj = booking.toObject();
            const transformed = {
                ...bookingObj,
                user: bookingObj.userId // Add 'user' field as alias for populated userId
            };

            // If it's a flight booking, check if it's round trip and get total with discounts
            if (booking.bookingType === 'flight') {
                const flightBookings = await BookingFlight.find({ bookingId: booking._id });

                if (flightBookings.length > 0) {
                    // Check if round trip (2 flights)
                    transformed.isRoundTrip = flightBookings.length > 1;

                    // Calculate actual total (sum of all flight prices)
                    const totalFlightPrice = flightBookings.reduce((sum, fb) => sum + fb.totalFlightPrice, 0);
                    const totalDiscount = flightBookings.reduce((sum, fb) => sum + (fb.discountAmount || 0), 0);

                    // Override totalPrice with actual amount after discount
                    transformed.actualTotal = totalFlightPrice - totalDiscount;
                }
            }

            return transformed;
        }));

        res.json({
            success: true,
            data: transformedBookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin get bookings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get booking statistics for admin (MUST BE BEFORE dynamic routes)
router.get('/stats/overview', admin, async (req, res) => {
    try {
        const stats = await Booking.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'completed'] },
                                '$totalPrice',
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const result = {
            totalBookings: 0,
            pendingBookings: 0,
            confirmedBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            totalRevenue: 0
        };

        stats.forEach(stat => {
            result.totalBookings += stat.count;
            result[`${stat._id}Bookings`] = stat.count;
            if (stat._id === 'completed') {
                result.totalRevenue = stat.totalRevenue;
            }
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Admin get booking stats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update booking status (admin only)
router.put('/:id/status', admin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                status,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('userId', 'fullName email phone');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Notify admins about booking status update
        notifyBookingUpdated(booking);

        res.json({ success: true, data: booking });
    } catch (error) {
        console.error('Admin update booking status error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete booking (admin only)
router.delete('/:id', admin, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Notify admins about booking cancellation
        notifyBookingCancelled(booking);

        res.json({ success: true, message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Admin delete booking error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create test bookings for development (admin only)
router.post('/create-test-data', admin, async (req, res) => {
    try {
        // Check if we already have bookings
        const existingCount = await Booking.countDocuments();
        if (existingCount > 0) {
            return res.json({
                success: true,
                message: `Already have ${existingCount} bookings, skipping test data creation`
            });
        }

        // Get some users
        const users = await User.find({}).limit(3);
        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No users found. Please create some users first.'
            });
        }

        // Create test bookings
        const testBookings = [
            {
                userId: users[0]._id,
                bookingType: 'tour',
                totalPrice: 5000000,
                status: 'pending',
                bookingDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                userId: users[0]._id,
                bookingType: 'activity',
                totalPrice: 2000000,
                status: 'confirmed',
                bookingDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                userId: users[1]._id,
                bookingType: 'flight',
                totalPrice: 3000000,
                status: 'completed',
                bookingDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                userId: users[1]._id,
                bookingType: 'tour',
                totalPrice: 4000000,
                status: 'cancelled',
                bookingDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                userId: users[2]._id,
                bookingType: 'activity',
                totalPrice: 1500000,
                status: 'pending',
                bookingDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        const createdBookings = await Booking.insertMany(testBookings);

        res.json({
            success: true,
            message: `Created ${createdBookings.length} test bookings`,
            data: createdBookings.length
        });
    } catch (error) {
        console.error('Create test data error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;