const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    password: {
        type: String,
        required: [true, 'Mật khẩu là bắt buộc'],
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
        select: false // Không trả về password khi query
    },
    fullName: {
        type: String,
        required: [true, 'Họ tên là bắt buộc'],
        trim: true,
        maxlength: [100, 'Họ tên không được quá 100 ký tự']
    },
    phone: {
        type: String,
        trim: true,
        default: null,
        validate: {
            validator: function (v) {
                return !v || /^[0-9]{10,11}$/.test(v);
            },
            message: 'Số điện thoại không hợp lệ'
        }
    },
    avatar: {
        type: String,
        default: null
    },
    dateOfBirth: {
        type: Date,
        default: null,
        validate: {
            validator: function (v) {
                return !v || v <= new Date();
            },
            message: 'Ngày sinh không thể là ngày trong tương lai'
        }
    },
    address: {
        type: String,
        trim: true,
        default: null,
        maxlength: [200, 'Địa chỉ không được quá 200 ký tự']
    },
    bio: {
        type: String,
        trim: true,
        default: null,
        maxlength: [500, 'Giới thiệu không được quá 500 ký tự']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'banned'],
        default: 'inactive'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        default: null
    },
    verificationCodeExpires: {
        type: Date,
        default: null
    },
    resetPasswordCode: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    firebaseUid: {
        type: String,
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

// Check if OTP is valid and not expired
userSchema.methods.isOTPValid = function (otp, type = 'verification') {
    const codeField = type === 'verification' ? 'verificationCode' : 'resetPasswordCode';
    const expiresField = type === 'verification' ? 'verificationCodeExpires' : 'resetPasswordExpires';

    return this[codeField] === otp && this[expiresField] > Date.now();
};

// Clear OTP fields
userSchema.methods.clearOTP = function (type = 'verification') {
    if (type === 'verification') {
        this.verificationCode = null;
        this.verificationCodeExpires = null;
    } else {
        this.resetPasswordCode = null;
        this.resetPasswordExpires = null;
    }
};

module.exports = mongoose.model('User', userSchema);
