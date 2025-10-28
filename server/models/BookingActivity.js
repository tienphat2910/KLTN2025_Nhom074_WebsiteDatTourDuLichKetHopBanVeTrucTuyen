const mongoose = require('mongoose');

const bookingActivitySchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    activityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
        required: true
    },
    numAdults: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    numChildren: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    numBabies: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    numSeniors: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    price: {
        retail: {
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
            baby: {
                type: Number,
                required: [true, 'Giá em bé là bắt buộc'],
                min: [0, 'Giá không được âm']
            },
            senior: {
                type: Number,
                required: [true, 'Giá người cao tuổi là bắt buộc'],
                min: [0, 'Giá không được âm']
            }
        },
        note: {
            type: String,
            trim: true
        }
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed']
    },
    scheduledDate: {
        type: Date,
        required: [true, 'Ngày tham gia hoạt động là bắt buộc']
    },
    note: {
        type: String,
        trim: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cash', 'momo', 'zalopay', 'bank_transfer'],
        default: 'cash'
    },
    qrCode: {
        type: String, // URL to QR code image
        trim: true
    },
    qrCodePublicId: {
        type: String, // Cloudinary public ID for QR code
        trim: true
    }
}, {
    timestamps: true
});

// Pre-save hook to calculate subtotal if not provided
bookingActivitySchema.pre('save', function (next) {
    if (!this.subtotal && this.price && this.price.retail) {
        this.subtotal =
            (this.numAdults * this.price.retail.adult) +
            (this.numChildren * this.price.retail.child) +
            (this.numBabies * this.price.retail.baby) +
            (this.numSeniors * this.price.retail.senior);
    }
    next();
});

module.exports = mongoose.model('BookingActivity', bookingActivitySchema);
