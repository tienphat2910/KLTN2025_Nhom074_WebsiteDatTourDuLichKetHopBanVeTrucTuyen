const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
    flightCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    airlineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airline',
        required: true
    },
    departureAirportId: {
        type: mongoose.Schema.Types.String,
        ref: 'Airport',
        required: true
    },
    arrivalAirportId: {
        type: mongoose.Schema.Types.String,
        ref: 'Airport',
        required: true
    },
    departureTime: {
        type: Date,
        required: true,
        description: 'Thời gian khởi hành đầy đủ'
    },
    arrivalTime: {
        type: Date,
        required: true,
        description: 'Thời gian đến đầy đủ'
    },
    durationMinutes: {
        type: Number,
        required: true
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    availableSeats: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'cancelled'],
        default: 'active'
    },
    aircraft: {
        model: String,
        registration: String
    }
}, {
    timestamps: true
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Flight:
 *       type: object
 *       required:
 *         - flightCode
 *         - airlineId
 *         - departureAirportId
 *         - arrivalAirportId
 *         - departureTime
 *         - arrivalTime
 *         - durationMinutes
 *         - basePrice
 *         - availableSeats
 *       properties:
 *         _id:
 *           type: string
 *         flightCode:
 *           type: string
 *           description: Mã chuyến bay
 *           example: VN123
 *         airlineId:
 *           type: string
 *           description: ID hãng hàng không
 *         departureAirportId:
 *           type: string
 *           description: ID sân bay khởi hành
 *         arrivalAirportId:
 *           type: string
 *           description: ID sân bay đến
 *         departureTime:
 *           type: string
 *           format: date-time
 *           description: Thời gian khởi hành đầy đủ
 *           example: "2025-10-20T08:30:00Z"
 *         arrivalTime:
 *           type: string
 *           format: date-time
 *           description: Thời gian đến đầy đủ
 *           example: "2025-10-20T10:45:00Z"
 *         durationMinutes:
 *           type: number
 *           description: Thời gian bay (phút)
 *           example: 135
 *         basePrice:
 *           type: number
 *           description: Giá cơ bản
 *           example: 1500000
 *         availableSeats:
 *           type: number
 *           description: Số ghế khả dụng
 *         status:
 *           type: string
 *           enum: [active, inactive, cancelled]
 *         aircraft:
 *           type: object
 *           properties:
 *             model:
 *               type: string
 *             registration:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = mongoose.model('Flight', flightSchema);
