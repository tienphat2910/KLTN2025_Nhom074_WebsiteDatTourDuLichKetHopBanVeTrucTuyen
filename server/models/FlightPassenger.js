const mongoose = require('mongoose');

const flightPassengerSchema = new mongoose.Schema({
    bookingFlightId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookingFlight',
        required: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    identityNumber: {
        type: String,
        required: false, // Not required for children and infants
        trim: true,
        validate: {
            validator: function (v) {
                // If provided, must be 9 or 12 digits
                // If empty/null/undefined, it's valid (for children and infants)
                if (!v) return true;
                return /^\d{9}$|^\d{12}$/.test(v);
            },
            message: 'CCCD/CMND phải có 9 hoặc 12 số'
        }
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    seatNumber: {
        type: String,
        trim: true,
        default: null
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['Nam', 'Nữ', 'Male', 'Female']
    },
    nationality: {
        type: String,
        trim: true,
        default: 'Vietnam'
    }
}, {
    timestamps: true
});

// Index for faster queries
flightPassengerSchema.index({ bookingFlightId: 1 });

/**
 * @swagger
 * components:
 *   schemas:
 *     FlightPassenger:
 *       type: object
 *       required:
 *         - bookingFlightId
 *         - fullName
 *         - dateOfBirth
 *         - gender
 *       properties:
 *         _id:
 *           type: string
 *         bookingFlightId:
 *           type: string
 *           description: ID của booking flight
 *         fullName:
 *           type: string
 *           description: Họ tên hành khách
 *         identityNumber:
 *           type: string
 *           description: Số CCCD/CMND (chỉ bắt buộc cho người lớn)
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Ngày sinh
 *         seatNumber:
 *           type: string
 *           description: Số ghế
 *         phoneNumber:
 *           type: string
 *           description: Số điện thoại
 *         email:
 *           type: string
 *           description: Email
 *         gender:
 *           type: string
 *           enum: [Nam, Nữ, Male, Female]
 *           description: Giới tính
 *         nationality:
 *           type: string
 *           description: Quốc tịch
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = mongoose.model('FlightPassenger', flightPassengerSchema);
