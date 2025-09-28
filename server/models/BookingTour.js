const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['Nam', 'Nữ']
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    cccd: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                // If provided, should be 9 or 12 digits
                return !v || /^\d{9}$|^\d{12}$/.test(v);
            },
            message: 'CCCD/CMND phải có 9 hoặc 12 số'
        }
    },
    type: {
        type: String,
        required: true,
        enum: ['adult', 'child', 'infant']
    }
});

const bookingTourSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    tourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
        required: true
    },
    numAdults: {
        type: Number,
        required: true,
        min: 0
    },
    numChildren: {
        type: Number,
        required: true,
        min: 0
    },
    numInfants: {
        type: Number,
        required: true,
        min: 0
    },
    priceByAge: {
        adult: {
            type: Number,
            required: [true, 'Giá người lớn là bắt buộc'],
            min: [0, 'Giá không được âm']
        },
        child: {
            type: Number,
            required: [true, 'Giá trẻ em là bắt buộc'],
            min: [0, 'Giá không được âm']
        },
        infant: {
            type: Number,
            required: [true, 'Giá em bé là bắt buộc'],
            min: [0, 'Giá không được âm']
        }
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'confirmed', 'cancelled', 'completed']
    },
    passengers: [passengerSchema],
    note: {
        type: String,
        trim: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cash', 'momo', 'bank_transfer'],
        default: 'cash'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BookingTour', bookingTourSchema);
