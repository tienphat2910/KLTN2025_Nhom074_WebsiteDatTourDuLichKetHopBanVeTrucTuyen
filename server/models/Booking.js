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
    },
    paymentStatus: {
        type: String,
        default: 'pending',
        enum: ['pending', 'paid', 'refunded', 'failed']
    },
    paymentMethod: {
        type: String,
        enum: ['momo', 'zalopay', 'bank_transfer', 'cash']
    },
    // ZaloPay payment fields
    zalopayTransId: {
        type: String // app_trans_id from ZaloPay
    },
    zalopayZpTransId: {
        type: String // zp_trans_id from ZaloPay callback
    },
    zalopayOrderUrl: {
        type: String // Payment URL
    },
    paidAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
