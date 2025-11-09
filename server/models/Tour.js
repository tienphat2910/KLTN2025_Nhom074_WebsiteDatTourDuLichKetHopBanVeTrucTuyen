const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề tour là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tiêu đề tour không được quá 200 ký tự']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        required: [true, 'Slug là bắt buộc']
    },
    description: {
        type: String,
        required: [true, 'Mô tả tour là bắt buộc'],
        trim: true
    },
    destinationIds: [{
        type: String,
        required: [true, 'ID địa điểm là bắt buộc'],
        ref: 'Destination',
        validate: {
            validator: function (v) {
                return Array.isArray(v) && v.length > 0;
            },
            message: 'Phải có ít nhất 1 điểm đến'
        }
    }],
    destinationId: {
        type: String,
        ref: 'Destination' // Keep for backward compatibility
    },
    departureLocation: {
        name: {
            type: String,
            required: [true, 'Địa điểm khởi hành là bắt buộc'],
            trim: true
        },
        region: {
            type: String,
            enum: ['Miền Bắc', 'Miền Trung', 'Miền Nam'],
            default: 'Miền Nam'
        },
        code: {
            type: String,
            trim: true
        }
    },
    itinerary: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        validate: {
            validator: function (v) {
                // Accept array format (legacy)
                if (Array.isArray(v)) {
                    return v.length > 0 && v.every(item => typeof item === 'string');
                }
                // Accept object format (new)
                if (typeof v === 'object' && v !== null) {
                    const keys = Object.keys(v);
                    return keys.length > 0 && keys.some(key => key.match(/^day\d+$/i));
                }
                return false;
            },
            message: 'Itinerary phải là array hoặc object với day keys (day1, day2, ...)'

        }
    },
    startDate: {
        type: Date,
        required: [true, 'Ngày bắt đầu là bắt buộc']
    },
    endDate: {
        type: Date,
        required: [true, 'Ngày kết thúc là bắt buộc']
    },
    price: {
        type: Number,
        required: [true, 'Giá tour là bắt buộc'],
        min: [0, 'Giá tour không được âm']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Giảm giá không được âm'],
        max: [100, 'Giảm giá không được quá 100%']
    },
    pricingByAge: {
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
        infant: {
            type: Number,
            required: [true, 'Giá em bé là bắt buộc'],
            min: [0, 'Giá không được âm']
        }
    },
    seats: {
        type: Number,
        required: [true, 'Số chỗ tối đa là bắt buộc'],
        min: [1, 'Số chỗ phải ít nhất là 1']
    },
    availableSeats: {
        type: Number,
        required: [true, 'Số chỗ còn lại là bắt buộc'],
        min: [0, 'Số chỗ còn lại không được âm']
    },
    images: [{
        type: String,
        validate: {
            validator: function (v) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
            },
            message: 'URL hình ảnh không hợp lệ'
        }
    }],
    isFeatured: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, 'Rating không được âm'],
        max: [5, 'Rating không được quá 5']
    },
    reviewCount: {
        type: Number,
        default: 0,
        min: [0, 'Số đánh giá không được âm']
    },
    category: {
        type: String,
        enum: ['adventure', 'cultural', 'relaxation', 'family', 'luxury', 'budget'],
        default: 'family'
    },
    duration: {
        type: String,
        required: [true, 'Thời gian tour là bắt buộc']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Generate slug from title before saving if not provided
tourSchema.pre('save', function (next) {
    if (this.isModified('title') && (!this.slug || this.slug === '')) {
        // Create a more unique slug with departure location
        const baseSlug = this.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');

        // Add departure location and timestamp to make it unique
        const departureSlug = this.departureLocation?.name
            ? this.departureLocation.name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D')
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim('-')
            : '';

        const timestamp = Date.now().toString().slice(-6);
        this.slug = departureSlug
            ? `${baseSlug}-tu-${departureSlug}-${timestamp}`
            : `${baseSlug}-${timestamp}`;

        console.log(`📝 Generated unique slug for "${this.title}": ${this.slug}`);
    }

    // Calculate duration from start and end date if not provided
    if (this.startDate && this.endDate && !this.duration) {
        const diffTime = Math.abs(this.endDate - this.startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const nights = diffDays - 1;
        this.duration = `${diffDays}N${nights}Đ`;
    }

    next();
});

// Index for better query performance
tourSchema.index({ destinationIds: 1, startDate: 1 });
tourSchema.index({ isFeatured: -1, createdAt: -1 });
tourSchema.index({ price: 1 });
tourSchema.index({ slug: 1 });

module.exports = mongoose.model('Tour', tourSchema);
