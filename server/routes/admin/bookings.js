const express = require('express');
const path = require('path');
const Booking = require(path.resolve(__dirname, '../../models/Booking'));
const AmadeusBooking = require(path.resolve(__dirname, '../../models/AmadeusBooking'));
const User = require(path.resolve(__dirname, '../../models/User'));
const admin = require(path.resolve(__dirname, '../../middleware/admin'));
const { notifyBookingCreated, notifyPaymentCompleted, notifyBookingUpdated, notifyBookingCancelled } = require(path.resolve(__dirname, '../../utils/socketHandler'));
const { autoCompleteBookings } = require(path.resolve(__dirname, '../../utils/autoCompleteBookings'));
const router = express.Router();

// Get all bookings for admin with user info (including Amadeus bookings)
router.get('/', admin, async (req, res) => {
    try {
        const { page = 1, limit = 50, status, bookingType, search } = req.query;

        // Build query for regular bookings (exclude 'flight' type - only use Amadeus)
        let query = {};

        // Exclude old flight booking type, only show tour and activity from Booking model
        if (bookingType && bookingType !== 'all') {
            if (bookingType === 'amadeus_flight') {
                // Will be handled separately
                query.bookingType = { $in: [] }; // Empty - skip regular bookings
            } else if (bookingType === 'flight') {
                // Old flight type - skip
                query.bookingType = { $in: [] };
            } else {
                query.bookingType = bookingType;
            }
        } else {
            // Default: exclude old flight bookings
            query.bookingType = { $in: ['tour', 'activity'] };
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        // Get regular bookings (tour, activity only)
        const regularBookings = await Booking.find(query)
            .populate('userId', 'fullName email phone')
            .sort({ createdAt: -1 });

        // Build query for Amadeus bookings
        let amadeusQuery = {};
        if (status && status !== 'all') {
            amadeusQuery.status = status;
        }

        // Get Amadeus bookings
        const amadeusBookings = await AmadeusBooking.find(amadeusQuery)
            .populate('userId', 'fullName email phone')
            .sort({ createdAt: -1 });

        // Transform regular bookings
        const transformedRegularBookings = regularBookings.map(booking => {
            const bookingObj = booking.toObject();
            return {
                ...bookingObj,
                user: bookingObj.userId
            };
        });

        // Transform Amadeus bookings to match Booking format
        const transformedAmadeusBookings = amadeusBookings.map(ab => {
            const abObj = ab.toObject();
            const outboundSegment = abObj.outboundFlight?.itineraries?.[0]?.segments?.[0];
            const lastOutboundSegment = abObj.outboundFlight?.itineraries?.[0]?.segments?.slice(-1)[0];

            return {
                _id: abObj._id,
                userId: abObj.userId,
                user: abObj.userId, // For frontend compatibility
                bookingDate: abObj.createdAt,
                bookingType: 'amadeus_flight',
                status: abObj.status,
                totalPrice: abObj.totalAmount,
                actualTotal: abObj.totalAmount - (abObj.discountAmount || 0),
                isRoundTrip: abObj.isRoundTrip,
                paymentStatus: abObj.paymentStatus,
                createdAt: abObj.createdAt,
                updatedAt: abObj.updatedAt,
                // Amadeus-specific fields
                bookingReference: abObj.bookingReference,
                outboundFlight: abObj.outboundFlight,
                returnFlight: abObj.returnFlight,
                passengers: abObj.passengers,
                departureCode: outboundSegment?.departure?.iataCode,
                arrivalCode: lastOutboundSegment?.arrival?.iataCode,
                flightNumber: outboundSegment?.carrierCode + outboundSegment?.number,
                contactInfo: abObj.contactInfo,
                seatSelections: abObj.seatSelections
            };
        });

        // Combine and filter by bookingType if specified
        let allBookings = [];
        if (bookingType === 'amadeus_flight') {
            allBookings = transformedAmadeusBookings;
        } else if (bookingType && bookingType !== 'all' && bookingType !== 'flight') {
            allBookings = transformedRegularBookings;
        } else {
            allBookings = [...transformedRegularBookings, ...transformedAmadeusBookings];
        }

        // Sort by creation date
        allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            allBookings = allBookings.filter(booking => {
                const user = booking.user;
                return (
                    booking._id.toString().toLowerCase().includes(searchLower) ||
                    booking.bookingReference?.toLowerCase().includes(searchLower) ||
                    (user && (
                        user.fullName?.toLowerCase().includes(searchLower) ||
                        user.email?.toLowerCase().includes(searchLower) ||
                        user.phone?.includes(search)
                    ))
                );
            });
        }

        // Pagination
        const total = allBookings.length;
        const startIndex = (page - 1) * limit;
        const paginatedBookings = allBookings.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            success: true,
            data: paginatedBookings,
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

// Get booking statistics for admin (including Amadeus bookings)
router.get('/stats/overview', admin, async (req, res) => {
    try {
        // Stats for regular bookings (exclude old flight type)
        const regularStats = await Booking.aggregate([
            { $match: { bookingType: { $in: ['tour', 'activity'] } } },
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

        // Stats for Amadeus bookings
        const amadeusStats = await AmadeusBooking.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'completed'] },
                                '$totalAmount',
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

        // Combine stats
        [...regularStats, ...amadeusStats].forEach(stat => {
            result.totalBookings += stat.count;
            result[`${stat._id}Bookings`] = (result[`${stat._id}Bookings`] || 0) + stat.count;
            if (stat._id === 'completed') {
                result.totalRevenue += stat.totalRevenue;
            }
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Admin get booking stats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update booking status (admin only) - supports both regular and Amadeus bookings
router.put('/:id/status', admin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Try to find in regular Booking first
        let booking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                status,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('userId', 'fullName email phone');

        // If not found in Booking, try AmadeusBooking
        if (!booking) {
            booking = await AmadeusBooking.findByIdAndUpdate(
                req.params.id,
                {
                    status,
                    updatedAt: new Date()
                },
                { new: true }
            ).populate('userId', 'fullName email phone');

            if (booking) {
                // Transform Amadeus booking for notification
                const abObj = booking.toObject();
                const outboundSegment = abObj.outboundFlight?.itineraries?.[0]?.segments?.[0];
                booking = {
                    ...abObj,
                    user: abObj.userId,
                    bookingType: 'amadeus_flight',
                    totalPrice: abObj.totalAmount,
                    flightNumber: outboundSegment?.carrierCode + outboundSegment?.number
                };
            }
        }

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

// Delete booking (admin only) - supports both regular and Amadeus bookings
router.delete('/:id', admin, async (req, res) => {
    try {
        // Try to find in regular Booking first
        let booking = await Booking.findByIdAndDelete(req.params.id);

        // If not found in Booking, try AmadeusBooking
        if (!booking) {
            booking = await AmadeusBooking.findByIdAndDelete(req.params.id);
        }

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

// Manually trigger auto-complete bookings (admin only)
router.post('/auto-complete', admin, async (req, res) => {
    try {
        console.log('📞 Manual trigger: Auto-complete bookings requested by admin');
        const result = await autoCompleteBookings();

        res.json({
            success: result.success,
            message: result.success
                ? `Đã kiểm tra ${result.totalChecked} bookings, hoàn thành ${result.completedCount} bookings`
                : 'Có lỗi xảy ra khi auto-complete bookings',
            data: result
        });
    } catch (error) {
        console.error('Manual auto-complete error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;