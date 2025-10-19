const mongoose = require('mongoose');

const flightScheduleSchema = new mongoose.Schema({
    flightCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    departureDate: {
        type: Date,
        required: true
    },
    arrivalDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'boarding', 'departed', 'arrived', 'delayed', 'cancelled'],
        default: 'scheduled'
    },
    remainingSeats: {
        type: Number,
        required: true,
        min: 0
    },
    currentPrice: {
        type: Number,
        required: true,
        min: 0,
        description: 'Giá động theo ngày và số ghế còn'
    },
    delay: {
        minutes: {
            type: Number,
            default: 0
        },
        reason: {
            type: String,
            default: ''
        }
    },
    gate: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index để tìm kiếm nhanh
flightScheduleSchema.index({ flightCode: 1, departureDate: 1 });
flightScheduleSchema.index({ status: 1 });

/**
 * @swagger
 * components:
 *   schemas:
 *     FlightSchedule:
 *       type: object
 *       required:
 *         - flightCode
 *         - departureDate
 *         - arrivalDate
 *         - remainingSeats
 *         - currentPrice
 *       properties:
 *         _id:
 *           type: string
 *         flightCode:
 *           type: string
 *           description: Mã chuyến bay
 *           example: VN123
 *         departureDate:
 *           type: string
 *           format: date-time
 *           description: Ngày giờ khởi hành
 *         arrivalDate:
 *           type: string
 *           format: date-time
 *           description: Ngày giờ đến
 *         status:
 *           type: string
 *           enum: [scheduled, boarding, departed, arrived, delayed, cancelled]
 *           description: Trạng thái chuyến bay
 *         remainingSeats:
 *           type: number
 *           description: Số ghế còn lại
 *           example: 120
 *         currentPrice:
 *           type: number
 *           description: Giá hiện tại (thay đổi theo ngày)
 *           example: 1800000
 *         delay:
 *           type: object
 *           properties:
 *             minutes:
 *               type: number
 *               description: Số phút delay
 *             reason:
 *               type: string
 *               description: Lý do delay
 *         gate:
 *           type: string
 *           description: Cổng lên máy bay
 *           example: A12
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = mongoose.model('FlightSchedule', flightScheduleSchema);
