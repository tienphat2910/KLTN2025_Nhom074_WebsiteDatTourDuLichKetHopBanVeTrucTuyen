const express = require('express');
const Tour = require('../../models/Tour');
const Activity = require('../../models/Activity');
const BookingTour = require('../../models/BookingTour');
const BookingActivity = require('../../models/BookingActivity');
const Booking = require('../../models/Booking');
const admin = require('../../middleware/admin');
const router = express.Router();

/**
 * Get all tours with booking statistics
 */
router.get('/tours', admin, async (req, res) => {
    try {
        // Get all tours with destination info
        const tours = await Tour.find().populate('destinationId', 'name').lean();

        // Calculate statistics for each tour
        const tourInvoices = await Promise.all(
            tours.map(async (tour) => {
                // Get all bookings for this tour
                const bookingTours = await BookingTour.find({ tourId: tour._id })
                    .populate({
                        path: 'bookingId',
                        select: 'status totalPrice'
                    })
                    .lean();

                const totalBookings = bookingTours.length;
                const activeBookings = bookingTours.filter(bt => 
                    bt.bookingId && ['pending', 'confirmed'].includes(bt.bookingId.status)
                ).length;
                const completedBookings = bookingTours.filter(bt => 
                    bt.bookingId && bt.bookingId.status === 'completed'
                ).length;
                const cancelledBookings = bookingTours.filter(bt => 
                    bt.bookingId && bt.bookingId.status === 'cancelled'
                ).length;

                // Calculate total revenue (excluding cancelled bookings)
                const totalRevenue = bookingTours.reduce((sum, bt) => {
                    if (bt.bookingId && bt.bookingId.status !== 'cancelled') {
                        return sum + (bt.subtotal || 0);
                    }
                    return sum;
                }, 0);

                return {
                    _id: tour._id,
                    title: tour.title,
                    image: tour.image,
                    price: tour.price,
                    duration: tour.duration,
                    destinationId: tour.destinationId,
                    totalBookings,
                    totalRevenue,
                    activeBookings,
                    completedBookings,
                    cancelledBookings
                };
            })
        );

        // Sort by total revenue descending
        tourInvoices.sort((a, b) => b.totalRevenue - a.totalRevenue);

        res.json({
            success: true,
            data: tourInvoices
        });
    } catch (error) {
        console.error('❌ Get tour invoices error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu hóa đơn tour'
        });
    }
});

/**
 * Get all activities with booking statistics
 */
router.get('/activities', admin, async (req, res) => {
    try {
        // Get all activities
        const activities = await Activity.find().lean();

        // Calculate statistics for each activity
        const activityInvoices = await Promise.all(
            activities.map(async (activity) => {
                // Get all bookings for this activity
                const bookingActivities = await BookingActivity.find({ activityId: activity._id })
                    .populate({
                        path: 'bookingId',
                        select: 'status totalPrice'
                    })
                    .lean();

                const totalBookings = bookingActivities.length;
                const activeBookings = bookingActivities.filter(ba => 
                    ba.bookingId && ['pending', 'confirmed'].includes(ba.bookingId.status)
                ).length;
                const completedBookings = bookingActivities.filter(ba => 
                    ba.bookingId && ba.bookingId.status === 'completed'
                ).length;
                const cancelledBookings = bookingActivities.filter(ba => 
                    ba.bookingId && ba.bookingId.status === 'cancelled'
                ).length;

                // Calculate total revenue (excluding cancelled bookings)
                const totalRevenue = bookingActivities.reduce((sum, ba) => {
                    if (ba.bookingId && ba.bookingId.status !== 'cancelled') {
                        return sum + (ba.subtotal || 0);
                    }
                    return sum;
                }, 0);

                return {
                    _id: activity._id,
                    name: activity.name,
                    image: activity.image,
                    price: activity.price,
                    location: activity.location,
                    totalBookings,
                    totalRevenue,
                    activeBookings,
                    completedBookings,
                    cancelledBookings
                };
            })
        );

        // Sort by total revenue descending
        activityInvoices.sort((a, b) => b.totalRevenue - a.totalRevenue);

        res.json({
            success: true,
            data: activityInvoices
        });
    } catch (error) {
        console.error('❌ Get activity invoices error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu hóa đơn hoạt động'
        });
    }
});

/**
 * Get booking details for a specific tour
 */
router.get('/tours/:tourId', admin, async (req, res) => {
    try {
        const { tourId } = req.params;

        // Get tour info
        const tour = await Tour.findById(tourId).populate('destinationId', 'name').lean();
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tour'
            });
        }

        // Get all booking tours with user info
        const bookingTours = await BookingTour.find({ tourId })
            .populate({
                path: 'bookingId',
                populate: {
                    path: 'userId',
                    select: 'fullName email phone avatar'
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        // Format booking details
        const bookings = bookingTours
            .filter(bt => bt.bookingId && bt.bookingId.userId)
            .map(bt => ({
                _id: bt._id,
                bookingId: bt.bookingId._id,
                user: bt.bookingId.userId,
                bookingDate: bt.bookingId.bookingDate,
                status: bt.bookingId.status,
                paymentStatus: bt.bookingId.paymentStatus,
                totalPrice: bt.subtotal || bt.bookingId.totalPrice,
                numAdults: bt.numAdults,
                numChildren: bt.numChildren,
                numInfants: bt.numInfants,
                passengers: bt.passengers,
                note: bt.note,
                createdAt: bt.createdAt
            }));

        res.json({
            success: true,
            data: {
                tour: {
                    _id: tour._id,
                    title: tour.title,
                    image: tour.image,
                    price: tour.price,
                    duration: tour.duration,
                    destinationId: tour.destinationId
                },
                bookings
            }
        });
    } catch (error) {
        console.error('❌ Get tour bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu đặt tour'
        });
    }
});

/**
 * Get booking details for a specific activity
 */
router.get('/activities/:activityId', admin, async (req, res) => {
    try {
        const { activityId } = req.params;

        // Get activity info
        const activity = await Activity.findById(activityId).lean();
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hoạt động'
            });
        }

        // Get all booking activities with user info
        const bookingActivities = await BookingActivity.find({ activityId })
            .populate({
                path: 'bookingId',
                populate: {
                    path: 'userId',
                    select: 'fullName email phone avatar'
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        // Format booking details
        const bookings = bookingActivities
            .filter(ba => ba.bookingId && ba.bookingId.userId)
            .map(ba => ({
                _id: ba._id,
                bookingId: ba.bookingId._id,
                user: ba.bookingId.userId,
                bookingDate: ba.bookingId.bookingDate,
                status: ba.bookingId.status,
                paymentStatus: ba.bookingId.paymentStatus,
                totalPrice: ba.subtotal || ba.bookingId.totalPrice,
                quantity: ba.quantity,
                participants: ba.participants,
                note: ba.note,
                createdAt: ba.createdAt
            }));

        res.json({
            success: true,
            data: {
                activity: {
                    _id: activity._id,
                    name: activity.name,
                    image: activity.image,
                    price: activity.price,
                    location: activity.location
                },
                bookings
            }
        });
    } catch (error) {
        console.error('❌ Get activity bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu đặt hoạt động'
        });
    }
});

module.exports = router;
