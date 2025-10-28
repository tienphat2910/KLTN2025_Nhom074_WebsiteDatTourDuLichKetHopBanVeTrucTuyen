const mongoose = require('mongoose');

const cancellationRequestSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bookingType: {
        type: String,
        required: true,
        enum: ['tour', 'activity', 'flight']
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected']
    },
    adminNote: {
        type: String,
        trim: true
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index để tìm kiếm nhanh
cancellationRequestSchema.index({ bookingId: 1 });
cancellationRequestSchema.index({ userId: 1 });
cancellationRequestSchema.index({ status: 1 });
cancellationRequestSchema.index({ bookingType: 1 });

/**
 * @swagger
 * components:
 *   schemas:
 *     CancellationRequest:
 *       type: object
 *       required:
 *         - bookingId
 *         - userId
 *         - bookingType
 *         - reason
 *       properties:
 *         _id:
 *           type: string
 *         bookingId:
 *           type: string
 *           description: ID của booking cần hủy
 *         userId:
 *           type: string
 *           description: ID người dùng yêu cầu hủy
 *         bookingType:
 *           type: string
 *           enum: [tour, activity, flight]
 *           description: Loại booking
 *         reason:
 *           type: string
 *           description: Lý do hủy
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           description: Trạng thái yêu cầu
 *         adminNote:
 *           type: string
 *           description: Ghi chú từ admin
 *         processedBy:
 *           type: string
 *           description: ID admin xử lý
 *         processedAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian xử lý
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = mongoose.model('CancellationRequest', cancellationRequestSchema);
