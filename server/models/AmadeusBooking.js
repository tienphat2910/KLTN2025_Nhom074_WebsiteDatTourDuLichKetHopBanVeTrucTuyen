const mongoose = require('mongoose');

/**
 * Schema lưu thông tin hành khách
 */
const passengerSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['ADULT', 'CHILD', 'INFANT'],
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE'],
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    nationality: {
        type: String,
        default: 'VN'
    },
    identityNumber: {
        type: String, // CCCD/Passport
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    // Selected seat for this passenger
    selectedSeat: {
        segmentId: String,
        seatNumber: String,
        seatPrice: Number,
        seatCurrency: String
    }
}, { _id: true });

/**
 * Schema lưu thông tin segment (chặng bay)
 */
const segmentSchema = new mongoose.Schema({
    segmentId: String,
    carrierCode: String,
    carrierName: String,
    flightNumber: String,
    aircraft: String,
    departure: {
        iataCode: String,
        terminal: String,
        at: Date
    },
    arrival: {
        iataCode: String,
        terminal: String,
        at: Date
    },
    duration: String,
    cabin: String,
    class: String,
    fareBasis: String
}, { _id: false });

/**
 * Schema lưu thông tin itinerary (hành trình)
 */
const itinerarySchema = new mongoose.Schema({
    duration: String,
    segments: [segmentSchema]
}, { _id: false });

/**
 * Schema lưu thông tin giá
 */
const priceSchema = new mongoose.Schema({
    currency: {
        type: String,
        default: 'VND'
    },
    basePrice: Number,
    totalPrice: Number,
    grandTotal: Number,
    fees: [{
        type: { type: String },
        amount: Number
    }],
    // Price breakdown per traveler type
    travelerPrices: [{
        travelerType: String,
        pricePerTraveler: Number,
        count: Number,
        subtotal: Number
    }]
}, { _id: false });

/**
 * Main Amadeus Booking Schema
 */
const amadeusBookingSchema = new mongoose.Schema({
    // Link to user
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Booking reference
    bookingReference: {
        type: String,
        unique: true,
        required: true
    },

    // Flight information
    isRoundTrip: {
        type: Boolean,
        default: false
    },

    // Outbound flight
    outboundFlight: {
        amadeusOfferId: String, // ID from Amadeus
        validatingAirlineCode: String,
        validatingAirlineName: String,
        itineraries: [itinerarySchema],
        lastTicketingDate: Date,
        numberOfBookableSeats: Number
    },

    // Return flight (if round trip)
    returnFlight: {
        amadeusOfferId: String,
        validatingAirlineCode: String,
        validatingAirlineName: String,
        itineraries: [itinerarySchema],
        lastTicketingDate: Date,
        numberOfBookableSeats: Number
    },

    // Passengers
    passengers: [passengerSchema],

    // Pricing
    pricing: priceSchema,

    // Seat selections (summary)
    seatSelections: [{
        passengerId: mongoose.Schema.Types.ObjectId,
        passengerName: String,
        segmentId: String,
        flightNumber: String,
        seatNumber: String,
        seatPrice: Number,
        seatCurrency: String
    }],

    // Add-ons
    addOns: {
        extraBaggage: {
            type: Number,
            default: 0
        },
        extraBaggagePrice: {
            type: Number,
            default: 0
        },
        insurance: {
            type: Boolean,
            default: false
        },
        insurancePrice: {
            type: Number,
            default: 0
        },
        priorityBoarding: {
            type: Boolean,
            default: false
        },
        priorityBoardingPrice: {
            type: Number,
            default: 0
        },
        meal: {
            selected: { type: Boolean, default: false },
            type: String,
            price: { type: Number, default: 0 }
        }
    },

    // Discount
    discountCode: {
        type: String,
        trim: true,
        uppercase: true
    },
    discountAmount: {
        type: Number,
        default: 0
    },

    // Total amount
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    // Payment
    paymentMethod: {
        type: String,
        enum: ['momo', 'zalopay', 'bank_transfer', 'cash'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed'],
        default: 'pending'
    },
    paidAt: Date,

    // ZaloPay fields
    zalopayTransId: String,
    zalopayZpTransId: String,
    zalopayOrderUrl: String,
    zalopayResponse: {
        zp_trans_id: String,
        server_time: Number,
        amount: Number,
        return_code: Number,
        return_message: String
    },

    // MoMo fields
    momoOrderId: String,
    momoTransId: String,
    momoResponse: {
        resultCode: Number,
        message: String,
        transId: String,
        amount: Number,
        responseTime: Number
    },

    // Booking status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'expired'],
        default: 'pending'
    },

    // Contact info
    contactInfo: {
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        fullName: String
    },

    // Special requests
    specialRequests: {
        type: String,
        trim: true
    },

    // QR Code
    qrCode: String,
    qrCodePublicId: String,

    // Barcode
    barcode: String,
    barcodePublicId: String,

    // Raw Amadeus data (for reference)
    rawAmadeusOffer: {
        type: mongoose.Schema.Types.Mixed
    },
    rawPricingResponse: {
        type: mongoose.Schema.Types.Mixed
    },

    // Notes
    note: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes
amadeusBookingSchema.index({ userId: 1, createdAt: -1 });
amadeusBookingSchema.index({ bookingReference: 1 });
amadeusBookingSchema.index({ status: 1 });
amadeusBookingSchema.index({ paymentStatus: 1 });
amadeusBookingSchema.index({ 'outboundFlight.amadeusOfferId': 1 });

// Generate booking reference
amadeusBookingSchema.statics.generateBookingReference = function () {
    const prefix = 'LT'; // LuTrip
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
};

// Virtual for formatted total
amadeusBookingSchema.virtual('formattedTotal').get(function () {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.totalAmount);
});

/**
 * @swagger
 * components:
 *   schemas:
 *     AmadeusBooking:
 *       type: object
 *       required:
 *         - userId
 *         - bookingReference
 *         - outboundFlight
 *         - passengers
 *         - pricing
 *         - totalAmount
 *         - paymentMethod
 *         - contactInfo
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *           description: ID người dùng
 *         bookingReference:
 *           type: string
 *           description: Mã đặt vé
 *         isRoundTrip:
 *           type: boolean
 *           description: Chuyến khứ hồi
 *         outboundFlight:
 *           type: object
 *           description: Thông tin chuyến đi
 *         returnFlight:
 *           type: object
 *           description: Thông tin chuyến về
 *         passengers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Passenger'
 *         pricing:
 *           type: object
 *           description: Thông tin giá
 *         seatSelections:
 *           type: array
 *           description: Ghế đã chọn
 *         totalAmount:
 *           type: number
 *           description: Tổng tiền
 *         paymentMethod:
 *           type: string
 *           enum: [momo, zalopay, bank_transfer, cash]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, refunded, failed]
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed, expired]
 *         contactInfo:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Passenger:
 *       type: object
 *       required:
 *         - type
 *         - firstName
 *         - lastName
 *         - gender
 *         - dateOfBirth
 *       properties:
 *         type:
 *           type: string
 *           enum: [ADULT, CHILD, INFANT]
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE]
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         nationality:
 *           type: string
 *         identityNumber:
 *           type: string
 *         selectedSeat:
 *           type: object
 */

module.exports = mongoose.model('AmadeusBooking', amadeusBookingSchema);
