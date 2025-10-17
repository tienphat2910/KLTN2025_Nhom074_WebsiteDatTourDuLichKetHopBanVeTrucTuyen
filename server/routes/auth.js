const express = require('express');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { uploadAvatar } = require('../utils/cloudinaryUpload'); // Updated import
const { createFirebaseUser, signInFirebaseUser, sendFirebaseEmailVerification } = require('../utils/firebaseAuth');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');
const { validateEmail } = require('../utils/emailValidation');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const auth = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user with OTP email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               fullName:
 *                 type: string
 *                 example: "Nguyen Van A"
 *     responses:
 *       201:
 *         description: Registration successful, OTP sent to email
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        // Validation
        if (!email || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Email, mật khẩu và họ tên là bắt buộc'
            });
        }

        // Validate email format and domain
        const emailValidation = await validateEmail(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: emailValidation.error || 'Email không hợp lệ'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isVerified) {
            return res.status(409).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        // Create Firebase user
        const firebaseResult = await createFirebaseUser(email, password);
        if (!firebaseResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Lỗi tạo tài khoản Firebase: ' + firebaseResult.error
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create or update user in MongoDB
        let user;
        if (existingUser) {
            user = existingUser;
            user.password = password;
            user.fullName = fullName;
            user.firebaseUid = firebaseResult.uid;
            user.verificationCode = otp;
            user.verificationCodeExpires = otpExpires;
            user.isVerified = false;
        } else {
            user = new User({
                email,
                password,
                fullName,
                firebaseUid: firebaseResult.uid,
                isVerified: false,
                verificationCode: otp,
                verificationCodeExpires: otpExpires
            });
        }

        await user.save();

        // Send OTP via email
        await sendOTPEmail(email, otp, 'verification');

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.',
            data: {
                email: email,
                message: 'Mã OTP đã được gửi đến email của bạn'
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email with OTP code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 example: "123456"
 */
router.post('/verify-email', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email và mã OTP là bắt buộc'
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được xác thực'
            });
        }

        // Check OTP
        if (!user.isOTPValid(otp, 'verification')) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không đúng hoặc đã hết hạn'
            });
        }

        // Update user
        user.isVerified = true;
        user.status = 'active';
        user.clearOTP('verification');
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Xác thực email thành công',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 */
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email là bắt buộc'
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được xác thực'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.verificationCode = otp;
        user.verificationCodeExpires = otpExpires;
        await user.save();

        // Send OTP via email
        await sendOTPEmail(email, otp, 'verification');

        res.status(200).json({
            success: true,
            message: 'Mã OTP mới đã được gửi đến email của bạn'
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *                           description: JWT token
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email và mật khẩu là bắt buộc'
            });
        }

        // Find user in MongoDB
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Check if email is verified in MongoDB
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Email chưa được xác thực. Vui lòng kiểm tra email để lấy mã OTP.',
                code: 'EMAIL_NOT_VERIFIED',
                data: {
                    email: user.email
                }
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', auth, async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Lấy thông tin người dùng thành công',
            data: req.user
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Nguyen Van A"
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               address:
 *                 type: string
 *                 example: "123 Nguyen Trai, District 1, Ho Chi Minh City"
 *               bio:
 *                 type: string
 *                 example: "Love traveling and exploring new places"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/profile', auth, async (req, res) => {
    try {
        console.log('PUT /profile called with body:', req.body);
        console.log('User from auth middleware:', req.user);

        const { fullName, phone, dateOfBirth, address, bio } = req.body;
        const userId = req.user._id;

        // Validate input data
        const updateData = {};

        if (fullName !== undefined) {
            if (!fullName || fullName.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Họ tên không được để trống'
                });
            }
            updateData.fullName = fullName.trim();
        }

        if (phone !== undefined) {
            if (phone && !/^[0-9]{10,11}$/.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Số điện thoại không hợp lệ (10-11 số)'
                });
            }
            updateData.phone = phone || null;
        }

        if (dateOfBirth !== undefined) {
            if (dateOfBirth) {
                const birthDate = new Date(dateOfBirth);
                if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ngày sinh không hợp lệ'
                    });
                }
                updateData.dateOfBirth = birthDate;
            } else {
                updateData.dateOfBirth = null;
            }
        }

        if (address !== undefined) {
            updateData.address = address || null;
        }

        if (bio !== undefined) {
            updateData.bio = bio || null;
        }

        console.log('Update data:', updateData);

        // Update user in database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            {
                new: true, // Return updated document
                runValidators: true // Run schema validators
            }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        console.log('Profile updated successfully:', updatedUser._id);

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: {
                user: updatedUser.toJSON()
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/auth/avatar:
 *   post:
 *     summary: Upload user avatar to Cloudinary
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: "Avatar image file (max 5MB, formats: JPG, PNG, WEBP)"
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/avatar', auth, (req, res, next) => {
    uploadSingle(req, res, (error) => {
        if (error) {
            return handleUploadError(error, req, res, next);
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log('POST /avatar called');
        console.log('File received:', req.file ? 'Yes' : 'No');
        console.log('User from auth:', req.user ? req.user._id : 'No user');

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn file ảnh'
            });
        }

        console.log('File details:', {
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });

        console.log('Starting upload to Cloudinary...');

        // Upload to Cloudinary
        const uploadResult = await uploadAvatar(req.file, req.user._id);

        console.log('Upload result:', uploadResult);

        // Update user avatar in database
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: uploadResult.url },
            { new: true }
        );

        console.log('User avatar updated in database');

        res.status(200).json({
            success: true,
            message: 'Cập nhật ảnh đại diện thành công',
            data: {
                user: updatedUser.toJSON()
            }
        });
    } catch (error) {
        console.error('Upload avatar error:', error);

        // Provide more specific error messages
        let errorMessage = 'Lỗi server, vui lòng thử lại sau';

        if (error.message.includes('Upload failed')) {
            errorMessage = 'Lỗi tải ảnh lên Cloudinary: ' + error.message;
        } else if (error.message.includes('Cloudinary')) {
            errorMessage = 'Lỗi dịch vụ Cloudinary';
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/auth/avatar:
 *   delete:
 *     summary: Delete user avatar
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 */
router.delete('/avatar', auth, async (req, res) => {
    try {
        // Update user avatar to null in database
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: null },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Xóa ảnh đại diện thành công',
            data: {
                user: updatedUser.toJSON()
            }
        });
    } catch (error) {
        console.error('Delete avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend Firebase verification email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 */
router.post('/resend-verification', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email và mật khẩu là bắt buộc'
            });
        }

        // Sign in to Firebase to get user object
        const firebaseResult = await signInFirebaseUser(email, password);
        if (!firebaseResult.success) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        if (firebaseResult.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được xác thực'
            });
        }

        // Send verification email
        const emailResult = await sendFirebaseEmailVerification(firebaseResult.user);
        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi gửi email xác thực'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Email xác thực đã được gửi lại'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

module.exports = router;
