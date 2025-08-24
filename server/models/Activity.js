const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    location: {
        name: String,
        address: String,
    },
    price: {
        retail: {
            adult: Number,
            child: Number,
            locker: Number,
            baby: Number,
            senior: Number
        },
        note: String,
    },
    operating_hours: {
        mon_to_sat: String,
        sunday_holidays: String,
        ticket_cutoff: String,
        rides_end: String,
    },
    features: [String],
    detail: {
        d1: String,
        d2: String,
        d3: String,
        d4: String,
        d5: String,
        d6: String,
        d7: String,
    },
    gallery: [String],
    popular: Boolean
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
