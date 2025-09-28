const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Changed back to required since we'll enforce auth
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    discountCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discount'
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'confirmed', 'cancelled', 'completed']
    },
    bookingType: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
