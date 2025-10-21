const express = require('express');
const BookingActivity = require('../models/BookingActivity');
const Activity = require('../models/Activity');
const Booking = require('../models/Booking');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendActivityBookingEmail } = require('../utils/emailService');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: BookingActivities
 *   description: Quản lý đặt chỗ hoạt động giải trí
 */

/**
 * @swagger
 * /api/bookingactivities:
 *   post:
 *     summary: Tạo booking activity mới
 *     tags: [BookingActivities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - activityId
 *               - scheduledDate
 *             properties:
 *               bookingId:
 *                 type: string
 *               activityId:
 *                 type: string
 *               numAdults:
 *                 type: number
 *                 default: 0
 *               numChildren:
 *                 type: number
 *                 default: 0
 *               numBabies:
 *                 type: number
 *                 default: 0
 *               numSeniors:
 *                 type: number
 *                 default: 0
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *               note:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, momo, bank_transfer]
 *     responses:
 *       201:
 *         description: Booking activity đã được tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy activity
 */
router.post('/', auth, async (req, res) => {
    try {
        const { activityId, numAdults, numChildren, numBabies, numSeniors, bookingId } = req.body;

        // Calculate total participants
        const totalParticipants = (numAdults || 0) + (numChildren || 0) + (numBabies || 0) + (numSeniors || 0);

        if (totalParticipants <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng người tham gia phải lớn hơn 0'
            });
        }

        // Find the activity to get pricing information
        const activity = await Activity.findById(activityId).populate('destinationId');
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hoạt động'
            });
        }

        // Get pricing from activity
        const pricing = {
            retail: {
                adult: activity.price?.retail?.adult || 0,
                child: activity.price?.retail?.child || 0,
                baby: activity.price?.retail?.baby || 0,
                senior: activity.price?.retail?.senior || 0
            },
            note: activity.price?.note || ''
        };

        // Calculate subtotal
        const subtotal =
            (numAdults || 0) * pricing.retail.adult +
            (numChildren || 0) * pricing.retail.child +
            (numBabies || 0) * pricing.retail.baby +
            (numSeniors || 0) * pricing.retail.senior;

        // Create the booking activity with pricing
        const bookingActivityData = {
            ...req.body,
            price: pricing,
            subtotal: subtotal
        };

        const bookingActivity = new BookingActivity(bookingActivityData);
        await bookingActivity.save();

        console.log(`✅ Activity booking created for ${totalParticipants} people. Activity: ${activityId}`);

        // Send confirmation email
        try {
            const booking = await Booking.findById(bookingId).populate('userId', 'fullName email phone');
            if (booking && booking.userId) {
                const user = booking.userId;

                // Prepare activity data with proper field mapping
                const activityData = {
                    ...activity.toObject(),
                    destinationId: activity.destinationId,
                    destination: activity.destinationId, // Alias for email template
                };

                await sendActivityBookingEmail(user.email, {
                    booking: booking,
                    activityBooking: {
                        ...bookingActivity.toObject(),
                        activityId: activityData
                    },
                    user: {
                        fullName: user.fullName,
                        email: user.email,
                        phone: user.phone
                    }
                });
                console.log('✅ Activity booking confirmation email sent');
            }
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
            // Don't fail the booking if email fails
        }

        res.status(201).json({
            success: true,
            data: bookingActivity
        });
    } catch (error) {
        console.error('❌ Booking activity creation error:', error);
        res.status(400).json({
            success: false,
            message: error.message,
            details: error.errors ? Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            })) : undefined
        });
    }
});

/**
 * @swagger
 * /api/bookingactivities:
 *   get:
 *     summary: Lấy danh sách tất cả booking activities
 *     tags: [BookingActivities]
 *     responses:
 *       200:
 *         description: Danh sách booking activities
 */
router.get('/', async (req, res) => {
    try {
        const bookingActivities = await BookingActivity.find()
            .populate('activityId', 'name slug location price operating_hours')
            .populate('bookingId', 'userId totalPrice status bookingDate');

        res.json({
            success: true,
            data: bookingActivities
        });
    } catch (error) {
        console.error('❌ Get booking activities error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/bookingactivities/{id}:
 *   get:
 *     summary: Lấy thông tin booking activity theo ID
 *     tags: [BookingActivities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin booking activity
 *       404:
 *         description: Không tìm thấy booking activity
 */
router.get('/:id', async (req, res) => {
    try {
        const bookingActivity = await BookingActivity.findById(req.params.id)
            .populate('activityId', 'name slug location price operating_hours')
            .populate('bookingId', 'userId totalPrice status bookingDate');

        if (!bookingActivity) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking activity'
            });
        }

        res.json({
            success: true,
            data: bookingActivity
        });
    } catch (error) {
        console.error('❌ Get booking activity error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/bookingactivities/booking/{bookingId}:
 *   get:
 *     summary: Lấy booking activities theo booking ID
 *     tags: [BookingActivities]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách booking activities
 */
router.get('/booking/:bookingId', async (req, res) => {
    try {
        const bookingActivities = await BookingActivity.find({
            bookingId: req.params.bookingId
        })
            .populate('activityId', 'name slug location price operating_hours')
            .populate('bookingId', 'userId totalPrice status bookingDate');

        res.json({
            success: true,
            data: bookingActivities
        });
    } catch (error) {
        console.error('❌ Get booking activities by bookingId error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/bookingactivities/activity/{activityId}:
 *   get:
 *     summary: Lấy booking activities theo activity ID
 *     tags: [BookingActivities]
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách booking activities
 */
router.get('/activity/:activityId', async (req, res) => {
    try {
        const bookingActivities = await BookingActivity.find({
            activityId: req.params.activityId
        })
            .populate('activityId', 'name slug location price operating_hours')
            .populate('bookingId', 'userId totalPrice status bookingDate');

        res.json({
            success: true,
            data: bookingActivities
        });
    } catch (error) {
        console.error('❌ Get booking activities by activityId error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/bookingactivities/{id}:
 *   put:
 *     summary: Cập nhật booking activity
 *     tags: [BookingActivities]
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
 *             type: object
 *     responses:
 *       200:
 *         description: Booking activity đã được cập nhật
 *       404:
 *         description: Không tìm thấy booking activity
 */
router.put('/:id', async (req, res) => {
    try {
        const { numAdults, numChildren, numBabies, numSeniors, status } = req.body;

        // Find the existing booking activity
        const existingBooking = await BookingActivity.findById(req.params.id);
        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking activity'
            });
        }

        // If participant numbers are updated, recalculate subtotal
        if (numAdults !== undefined || numChildren !== undefined ||
            numBabies !== undefined || numSeniors !== undefined) {

            const newNumAdults = numAdults !== undefined ? numAdults : existingBooking.numAdults;
            const newNumChildren = numChildren !== undefined ? numChildren : existingBooking.numChildren;
            const newNumBabies = numBabies !== undefined ? numBabies : existingBooking.numBabies;
            const newNumSeniors = numSeniors !== undefined ? numSeniors : existingBooking.numSeniors;

            const totalParticipants = newNumAdults + newNumChildren + newNumBabies + newNumSeniors;

            if (totalParticipants <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Số lượng người tham gia phải lớn hơn 0'
                });
            }

            // Recalculate subtotal
            const newSubtotal =
                newNumAdults * existingBooking.price.retail.adult +
                newNumChildren * existingBooking.price.retail.child +
                newNumBabies * existingBooking.price.retail.baby +
                newNumSeniors * existingBooking.price.retail.senior;

            req.body.subtotal = newSubtotal;
        }

        // Update the booking activity
        const bookingActivity = await BookingActivity.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('activityId', 'name slug location price operating_hours')
            .populate('bookingId', 'userId totalPrice status bookingDate');

        console.log(`✅ Booking activity updated: ${req.params.id}`);

        res.json({
            success: true,
            data: bookingActivity
        });
    } catch (error) {
        console.error('❌ Booking activity update error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/bookingactivities/{id}:
 *   delete:
 *     summary: Xóa booking activity
 *     tags: [BookingActivities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã xóa booking activity
 *       404:
 *         description: Không tìm thấy booking activity
 */
router.delete('/:id', async (req, res) => {
    try {
        const bookingActivity = await BookingActivity.findByIdAndDelete(req.params.id);

        if (!bookingActivity) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking activity'
            });
        }

        console.log(`✅ Booking activity deleted: ${req.params.id}`);

        res.json({
            success: true,
            message: 'Đã xóa booking activity thành công'
        });
    } catch (error) {
        console.error('❌ Booking activity deletion error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/bookingactivities/{id}/cancel:
 *   patch:
 *     summary: Hủy booking activity
 *     tags: [BookingActivities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã hủy booking activity
 *       404:
 *         description: Không tìm thấy booking activity
 */
router.patch('/:id/cancel', async (req, res) => {
    try {
        const bookingActivity = await BookingActivity.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled' },
            { new: true }
        )
            .populate('activityId', 'name slug location price operating_hours')
            .populate('bookingId', 'userId totalPrice status bookingDate');

        if (!bookingActivity) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking activity'
            });
        }

        console.log(`✅ Booking activity cancelled: ${req.params.id}`);

        res.json({
            success: true,
            data: bookingActivity,
            message: 'Đã hủy booking activity thành công'
        });
    } catch (error) {
        console.error('❌ Cancel booking activity error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/bookingactivities/{id}/confirm:
 *   patch:
 *     summary: Xác nhận booking activity
 *     tags: [BookingActivities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã xác nhận booking activity
 *       404:
 *         description: Không tìm thấy booking activity
 */
router.patch('/:id/confirm', async (req, res) => {
    try {
        const bookingActivity = await BookingActivity.findByIdAndUpdate(
            req.params.id,
            { status: 'confirmed' },
            { new: true }
        )
            .populate('activityId', 'name slug location price operating_hours')
            .populate('bookingId', 'userId totalPrice status bookingDate');

        if (!bookingActivity) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking activity'
            });
        }

        console.log(`✅ Booking activity confirmed: ${req.params.id}`);

        res.json({
            success: true,
            data: bookingActivity,
            message: 'Đã xác nhận booking activity thành công'
        });
    } catch (error) {
        console.error('❌ Confirm booking activity error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get activity booking details by booking ID (for frontend modal)
router.get('/booking/:bookingId/details', async (req, res) => {
    try {
        // Find all booking activities for this booking
        const bookingActivities = await BookingActivity.find({ bookingId: req.params.bookingId })
            .populate({
                path: 'activityId',
                populate: {
                    path: 'destinationId',
                    model: 'Destination'
                }
            })
            .populate('bookingId');

        if (!bookingActivities || bookingActivities.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin hoạt động' });
        }

        // For now, return the first activity booking (assuming single activity per booking)
        // In the future, this could return multiple activities
        const bookingActivity = bookingActivities[0];

        // Transform the data to match frontend expectations
        const activityBookingDetail = {
            _id: bookingActivity._id,
            bookingId: bookingActivity.bookingId,
            activityId: {
                _id: bookingActivity.activityId._id,
                name: bookingActivity.activityId.name,
                slug: bookingActivity.activityId.slug,
                description: bookingActivity.activityId.description,
                destination: bookingActivity.activityId.destinationId ? {
                    _id: bookingActivity.activityId.destinationId._id,
                    name: bookingActivity.activityId.destinationId.name,
                    region: bookingActivity.activityId.destinationId.region,
                    image: bookingActivity.activityId.destinationId.image
                } : null,
                location: bookingActivity.activityId.location,
                operating_hours: bookingActivity.activityId.operating_hours,
                features: bookingActivity.activityId.features || [],
                gallery: bookingActivity.activityId.gallery || []
            },
            numAdults: bookingActivity.numAdults,
            numChildren: bookingActivity.numChildren,
            numBabies: bookingActivity.numBabies,
            numSeniors: bookingActivity.numSeniors,
            price: bookingActivity.price,
            subtotal: bookingActivity.subtotal,
            status: bookingActivity.status,
            scheduledDate: bookingActivity.scheduledDate,
            note: bookingActivity.note,
            paymentMethod: bookingActivity.paymentMethod,
            createdAt: bookingActivity.createdAt,
            updatedAt: bookingActivity.updatedAt
        };

        res.json({
            success: true,
            data: activityBookingDetail
        });
    } catch (error) {
        console.error('Get activity booking details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
