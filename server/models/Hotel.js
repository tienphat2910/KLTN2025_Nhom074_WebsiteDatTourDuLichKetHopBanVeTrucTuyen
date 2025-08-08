const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    size: String,
    price: {
        type: Number,
        required: true
    },
    priceWithBreakfast: Number,
    quantity: {
        type: Number,
        required: true
    },
    amenities: [String],
    images: [String]
});

const contactInfoSchema = new mongoose.Schema({
    phone: String,
    email: String,
    address: String
});

const hotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    destinationId: {
        type: String,
        required: true
    },
    description: String,
    rating: {
        type: Number,
        min: 0,
        max: 5
    },
    rooms: [roomSchema],
    gallery: [String],
    contactInfo: contactInfoSchema
}, {
    timestamps: true
});

module.exports = mongoose.model('Hotel', hotelSchema);
