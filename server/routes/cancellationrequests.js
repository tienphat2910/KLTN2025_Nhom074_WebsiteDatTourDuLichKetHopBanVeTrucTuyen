const express = require('express');
const CancellationRequest = require('../models/CancellationRequest');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
    notifyCancellationRequestCreated,
    notifyCancellationRequestProcessed
} = require('../utils/socketHandler');
const {
    sendCancellationRequestSubmittedEmail,
    sendCancellationRequestApprovedEmail,
    sendCancellationRequestRejectedEmail
} = require('../utils/emailService');
const router = express.Router();

/**
 * @swagger
 * /api/cancellationrequests:
 *   post:
 *     summary: Create a new cancellation request
 *     tags: [CancellationRequests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - reason
 *             properties:
 *               bookingId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cancellation request created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth, async (req, res) => {
    try {
        const { bookingId, reason } = req.body;

        // Validate input
        if (!bookingId || !reason?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin'
            });
        }

        // Check if booking exists and belongs to user
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking'
            });
        }

        console.log('Booking userId:', booking.userId.toString());
        console.log('Request user _id:', req.user._id.toString());

        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền hủy booking này'
            });
        }

        // Check if booking can be cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking đã được hủy'
            });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy booking đã hoàn thành'
            });
        }

        // Check if there's already a pending request
        const existingRequest = await CancellationRequest.findOne({
            bookingId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Đã có yêu cầu hủy đang chờ xử lý'
            });
        }

        // Create cancellation request
        const cancellationRequest = new CancellationRequest({
            bookingId,
            userId: req.user._id,
            bookingType: booking.bookingType,
            reason: reason.trim()
        });

        await cancellationRequest.save();

        // Populate booking and user info
        await cancellationRequest.populate('bookingId');
        await cancellationRequest.populate('userId', 'fullName email');

        // Emit socket event to admin using helper function
        notifyCancellationRequestCreated(cancellationRequest);

        // Send email notification to user
        try {
            const userEmail = typeof cancellationRequest.userId === 'object'
                ? cancellationRequest.userId.email
                : req.user.email;
            await sendCancellationRequestSubmittedEmail(userEmail, cancellationRequest);
        } catch (emailError) {
            console.error('Failed to send cancellation request email:', emailError);
            // Continue even if email fails
        }

        res.status(201).json({
            success: true,
            data: cancellationRequest,
            message: 'Đã gửi yêu cầu hủy thành công'
        });
    } catch (error) {
        console.error('Create cancellation request error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cancellationrequests:
 *   get:
 *     summary: Get all cancellation requests (Admin only)
 *     tags: [CancellationRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: bookingType
 *         schema:
 *           type: string
 *           enum: [tour, activity, flight]
 *     responses:
 *       200:
 *         description: List of cancellation requests
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/', auth, admin, async (req, res) => {
    try {
        const { status, bookingType } = req.query;
        const query = {};

        if (status) query.status = status;
        if (bookingType) query.bookingType = bookingType;

        const requests = await CancellationRequest.find(query)
            .populate('bookingId')
            .populate('userId', 'fullName email phone avatar')
            .populate('processedBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Get cancellation requests error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cancellationrequests/user:
 *   get:
 *     summary: Get user's cancellation requests
 *     tags: [CancellationRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's cancellation requests
 *       401:
 *         description: Unauthorized
 */
router.get('/user', auth, async (req, res) => {
    try {
        const requests = await CancellationRequest.find({ userId: req.user._id })
            .populate('bookingId')
            .populate('processedBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Get user cancellation requests error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cancellationrequests/count:
 *   get:
 *     summary: Get count of pending cancellation requests (Admin only)
 *     tags: [CancellationRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count of pending requests
 */
router.get('/count', auth, admin, async (req, res) => {
    try {
        const count = await CancellationRequest.countDocuments({ status: 'pending' });
        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('Get cancellation count error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cancellationrequests/booking/{bookingId}:
 *   get:
 *     summary: Get cancellation request by booking ID
 *     tags: [CancellationRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cancellation request details
 *       404:
 *         description: Not found
 */
router.get('/booking/:bookingId', auth, async (req, res) => {
    try {
        const request = await CancellationRequest.findOne({
            bookingId: req.params.bookingId,
            status: 'pending' // Only return pending requests
        })
            .populate('bookingId')
            .populate('userId', 'fullName email phone avatar')
            .populate('processedBy', 'fullName email');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu hủy đang chờ xử lý'
            });
        }

        // Check permission (user can view their own, admin can view all)
        if (request.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem yêu cầu này'
            });
        }

        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Get cancellation request by booking error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cancellationrequests/{id}:
 *   get:
 *     summary: Get a cancellation request by ID
 *     tags: [CancellationRequests]
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
 *         description: Cancellation request details
 *       404:
 *         description: Not found
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const request = await CancellationRequest.findById(req.params.id)
            .populate('bookingId')
            .populate('userId', 'fullName email phone avatar')
            .populate('processedBy', 'fullName email');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu hủy'
            });
        }

        // Check permission (user can view their own, admin can view all)
        if (request.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem yêu cầu này'
            });
        }

        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Get cancellation request error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cancellationrequests/{id}/approve:
 *   put:
 *     summary: Approve a cancellation request (Admin only)
 *     tags: [CancellationRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request approved
 *       404:
 *         description: Not found
 */
router.put('/:id/approve', auth, admin, async (req, res) => {
    try {
        const { adminNote } = req.body;

        const request = await CancellationRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu hủy'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu đã được xử lý'
            });
        }

        // Update booking status to cancelled
        const booking = await Booking.findById(request.bookingId);
        if (booking) {
            booking.status = 'cancelled';
            await booking.save();
        }

        // Update request
        request.status = 'approved';
        request.adminNote = adminNote || '';
        request.processedBy = req.user._id;
        request.processedAt = new Date();
        await request.save();

        await request.populate('bookingId');
        await request.populate('userId', 'fullName email');
        await request.populate('processedBy', 'fullName email');

        // Emit socket event using helper function
        notifyCancellationRequestProcessed(request, 'approved');

        // Send email notification to user
        try {
            const userEmail = typeof request.userId === 'object'
                ? request.userId.email
                : null;
            if (userEmail) {
                await sendCancellationRequestApprovedEmail(userEmail, request);
            }
        } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
            // Continue even if email fails
        }

        res.json({
            success: true,
            data: request,
            message: 'Đã chấp nhận yêu cầu hủy'
        });
    } catch (error) {
        console.error('Approve cancellation request error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cancellationrequests/{id}/reject:
 *   put:
 *     summary: Reject a cancellation request (Admin only)
 *     tags: [CancellationRequests]
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
 *             type: object
 *             required:
 *               - adminNote
 *             properties:
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request rejected
 *       404:
 *         description: Not found
 */
router.put('/:id/reject', auth, admin, async (req, res) => {
    try {
        const { adminNote } = req.body;

        if (!adminNote?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp lý do từ chối'
            });
        }

        const request = await CancellationRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu hủy'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu đã được xử lý'
            });
        }

        // Update request
        request.status = 'rejected';
        request.adminNote = adminNote.trim();
        request.processedBy = req.user._id;
        request.processedAt = new Date();
        await request.save();

        await request.populate('bookingId');
        await request.populate('userId', 'fullName email');
        await request.populate('processedBy', 'fullName email');

        // Emit socket event using helper function
        notifyCancellationRequestProcessed(request, 'rejected');

        // Send email notification to user
        try {
            const userEmail = typeof request.userId === 'object'
                ? request.userId.email
                : null;
            if (userEmail) {
                await sendCancellationRequestRejectedEmail(userEmail, request);
            }
        } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
            // Continue even if email fails
        }

        res.json({
            success: true,
            data: request,
            message: 'Đã từ chối yêu cầu hủy'
        });
    } catch (error) {
        console.error('Reject cancellation request error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
