const mongoose = require('mongoose');

const flightClassSchema = new mongoose.Schema({
    flightCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    className: {
        type: String,
        required: true,
        enum: ['Economy', 'Premium Economy', 'Business', 'First Class'],
        default: 'Economy'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    baggageAllowance: {
        type: Number,
        required: true,
        description: 'Hành lý ký gửi (kg)'
    },
    cabinBaggage: {
        type: Number,
        required: true,
        description: 'Hành lý xách tay (kg)'
    },
    availableSeats: {
        type: Number,
        required: true,
        min: 0
    },
    amenities: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

// Index để tìm kiếm nhanh theo flightCode
flightClassSchema.index({ flightCode: 1 });

/**
 * @swagger
 * components:
 *   schemas:
 *     FlightClass:
 *       type: object
 *       required:
 *         - flightCode
 *         - className
 *         - price
 *         - baggageAllowance
 *         - cabinBaggage
 *         - availableSeats
 *       properties:
 *         _id:
 *           type: string
 *         flightCode:
 *           type: string
 *           description: Mã chuyến bay
 *           example: VN123
 *         className:
 *           type: string
 *           enum: [Economy, Premium Economy, Business, First Class]
 *           description: Tên hạng ghế
 *         price:
 *           type: number
 *           description: Giá vé
 *           example: 2500000
 *         baggageAllowance:
 *           type: number
 *           description: Hành lý ký gửi (kg)
 *           example: 23
 *         cabinBaggage:
 *           type: number
 *           description: Hành lý xách tay (kg)
 *           example: 7
 *         availableSeats:
 *           type: number
 *           description: Số ghế còn trống
 *           example: 50
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           description: Tiện ích
 *           example: ["Meals", "WiFi", "Entertainment"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = mongoose.model('FlightClass', flightClassSchema);
