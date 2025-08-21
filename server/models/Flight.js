const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
    flightNumber: { type: String, required: true },
    airline: { type: String, required: true },
    departureAirport: {
        code: String,
        name: String,
        city: String
    },
    arrivalAirport: {
        code: String,
        name: String,
        city: String
    },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    aircraft: {
        model: String,
        registration: String
    },
    seatInfo: {
        totalSeats: Number,
        availableSeats: Number,
        classes: {
            economy: {
                price: Number,
                available: Number
            },
            business: {
                price: Number,
                available: Number
            }
        }
    },
    status: { type: String, default: "Đang lên lịch" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Flight:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         flightNumber:
 *           type: string
 *         airline:
 *           type: string
 *         departureAirport:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *             name:
 *               type: string
 *             city:
 *               type: string
 *         arrivalAirport:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *             name:
 *               type: string
 *             city:
 *               type: string
 *         departureTime:
 *           type: string
 *           format: date-time
 *         arrivalTime:
 *           type: string
 *           format: date-time
 *         durationMinutes:
 *           type: number
 *         aircraft:
 *           type: object
 *           properties:
 *             model:
 *               type: string
 *             registration:
 *               type: string
 *         seatInfo:
 *           type: object
 *           properties:
 *             totalSeats:
 *               type: number
 *             availableSeats:
 *               type: number
 *             classes:
 *               type: object
 *               properties:
 *                 economy:
 *                   type: object
 *                   properties:
 *                     price:
 *                       type: number
 *                     available:
 *                       type: number
 *                 business:
 *                   type: object
 *                   properties:
 *                     price:
 *                       type: number
 *                     available:
 *                       type: number
 *         status:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = mongoose.model('Flight', flightSchema);
