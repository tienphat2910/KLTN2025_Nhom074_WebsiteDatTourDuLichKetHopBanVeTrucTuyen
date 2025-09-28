const mongoose = require('mongoose');

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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BookingTour', bookingTourSchema);
