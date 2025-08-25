const mongoose = require('mongoose');

const airportSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // e.g. "A001"
    name: { type: String, required: true },
    city: { type: String, required: true },
    icao: { type: String, required: true },
    iata: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Airport', airportSchema);
