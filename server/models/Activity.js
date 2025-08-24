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
    popular: Boolean,
    destinationId: {
        type: String,
        required: [true, 'ID địa điểm là bắt buộc'],
        ref: 'Destination',
        index: true // Index for better query performance
    },
    slug: { type: String, unique: true, index: true },
}, { timestamps: true });

// Tạo slug từ name giống destination/tour (bỏ dấu, thay khoảng trắng bằng -, loại ký tự đặc biệt, viết thường)
function generateSlug(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // bỏ dấu tiếng Việt
        .replace(/[^a-z0-9\s-]/g, '') // loại ký tự đặc biệt
        .replace(/\s+/g, '-') // thay khoảng trắng bằng -
        .replace(/-+/g, '-') // loại bỏ nhiều dấu - liên tiếp
        .replace(/^-+|-+$/g, ''); // bỏ - ở đầu/cuối
}

activitySchema.pre('save', function (next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = generateSlug(this.name || '');
    }
    next();
});

module.exports = mongoose.model('Activity', activitySchema);
