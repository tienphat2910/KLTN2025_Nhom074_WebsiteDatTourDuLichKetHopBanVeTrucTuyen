const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: [true, 'Tên địa điểm là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên địa điểm không được quá 100 ký tự']
    },
    country: {
        type: String,
        required: [true, 'Quốc gia là bắt buộc'],
        default: 'Việt Nam',
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Mô tả là bắt buộc'],
        trim: true
    },
    image: {
        type: String,
        required: [true, 'Hình ảnh là bắt buộc'],
        validate: {
            validator: function (v) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
            },
            message: 'URL hình ảnh không hợp lệ'
        }
    },
    popular: {
        type: Boolean,
        default: false
    },
    slug: {
        type: String,
        required: [true, 'Slug là bắt buộc'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[a-z0-9-]+$/.test(v);
            },
            message: 'Slug chỉ được chứa chữ cái thường, số và dấu gạch ngang'
        }
    },
    region: {
        type: String,
        enum: ['Miền Bắc', 'Miền Trung', 'Miền Nam'],
        required: [true, 'Vùng miền là bắt buộc']
    }
}, {
    timestamps: true,
    _id: false // Disable auto _id generation since we're using custom _id
});

// Generate slug from name before validation
destinationSchema.pre('validate', function (next) {
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }
    next();
});

// Ensure slug is unique before saving
destinationSchema.pre('save', async function (next) {
    if (this.isModified('slug') || this.isNew) {
        const existingDestination = await this.constructor.findOne({
            slug: this.slug,
            _id: { $ne: this._id }
        });

        if (existingDestination) {
            this.slug = `${this.slug}-${Date.now()}`;
        }
    }
    next();
});

// Index for better query performance
destinationSchema.index({ popular: -1, name: 1 });
destinationSchema.index({ slug: 1 });
destinationSchema.index({ region: 1 });

module.exports = mongoose.model('Destination', destinationSchema);
