const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    value: {
        type: Number,
        required: true,
        min: 0
    },
    validFrom: {
        type: Date,
        required: true
    },
    validUntil: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        required: true,
        min: 1,
        default: 100
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
discountSchema.index({ code: 1 });
discountSchema.index({ validFrom: 1, validUntil: 1 });
discountSchema.index({ isActive: 1 });

// Validation: validUntil must be after validFrom
discountSchema.pre('validate', function (next) {
    if (this.validUntil <= this.validFrom) {
        this.invalidate('validUntil', 'Ngày kết thúc phải sau ngày bắt đầu');
    }
    next();
});

// Validation: percentage value must be between 0 and 100
discountSchema.pre('validate', function (next) {
    if (this.discountType === 'percentage' && (this.value < 0 || this.value > 100)) {
        this.invalidate('value', 'Giá trị phần trăm phải từ 0 đến 100');
    }
    next();
});

// Virtual for remaining usage
discountSchema.virtual('remainingUsage').get(function () {
    return Math.max(0, this.usageLimit - this.usedCount);
});

// Method to check if discount is valid
discountSchema.methods.isValid = function () {
    const now = new Date();
    return this.isActive &&
        now >= this.validFrom &&
        now <= this.validUntil &&
        this.usedCount < this.usageLimit;
};

// Method to use discount (increment usedCount)
discountSchema.methods.useDiscount = function () {
    if (!this.isValid()) {
        throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
    }
    this.usedCount += 1;
    return this.save();
};

module.exports = mongoose.model('Discount', discountSchema);