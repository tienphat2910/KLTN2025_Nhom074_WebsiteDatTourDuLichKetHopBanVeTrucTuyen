const mongoose = require('mongoose');

const bookingFlightSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    flightId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight',
        required: true
    },
    flightCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    flightClassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlightClass',
        required: true
    },
    numTickets: {
        type: Number,
        required: true,
        min: 1
    },
    pricePerTicket: {
        type: Number,
        required: true,
        min: 0
    },
    totalFlightPrice: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'confirmed', 'cancelled', 'completed']
    },
    note: {
        type: String,
        trim: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['momo', 'bank_transfer']
    },
    discountCode: {
        type: String,
        trim: true,
        uppercase: true
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// Index for faster queries
bookingFlightSchema.index({ bookingId: 1 });
bookingFlightSchema.index({ flightId: 1 });
bookingFlightSchema.index({ flightClassId: 1 });
bookingFlightSchema.index({ flightCode: 1 });

/**
 * @swagger
 * components:
 *   schemas:
 *     BookingFlight:
 *       type: object
 *       required:
 *         - bookingId
 *         - flightId
 *         - flightCode
 *         - flightClassId
 *         - numTickets
 *         - pricePerTicket
 *         - totalFlightPrice
 *       properties:
 *         _id:
 *           type: string
 *         bookingId:
 *           type: string
 *           description: ID của booking
 *         flightId:
 *           type: string
 *           description: ID của chuyến bay
 *         flightCode:
 *           type: string
 *           description: Mã chuyến bay
 *         flightClassId:
 *           type: string
 *           description: ID của hạng vé
 *         numTickets:
 *           type: number
 *           description: Số lượng vé
 *         pricePerTicket:
 *           type: number
 *           description: Giá mỗi vé
 *         totalFlightPrice:
 *           type: number
 *           description: Tổng giá vé
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *           description: Trạng thái
 *         note:
 *           type: string
 *           description: Ghi chú
 *         paymentMethod:
 *           type: string
 *           enum: [momo, bank_transfer]
 *           description: Phương thức thanh toán
 *         discountCode:
 *           type: string
 *           description: Mã giảm giá
 *         discountAmount:
 *           type: number
 *           description: Số tiền giảm giá
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = mongoose.model('BookingFlight', bookingFlightSchema);
