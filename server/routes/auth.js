const express = require('express');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { uploadAvatar } = require('../utils/firebaseStorage');
const { createFirebaseUser, signInFirebaseUser } = require('../utils/firebaseAuth');
const { generateOTP, sendOTPEmail, sendFirebaseVerificationEmail } = require('../utils/emailService');
const { uploadSingle } = require('../middleware/upload');
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
 *     summary: Register a new user with OTP verification
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
 *         description: Registration initiated, OTP sent to email
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
 *                         message:
 *                           type: string
 *                           description: OTP sent message
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

        // Generate OTP for internal tracking
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create or update user in MongoDB
        let user;
        if (existingUser) {
            user = existingUser;
            user.password = password;
            user.fullName = fullName;
            user.firebaseUid = firebaseResult.uid;
        } else {
            user = new User({
                email,
                password,
                fullName,
                firebaseUid: firebaseResult.uid
            });
        }

        user.verificationCode = otp;
        user.verificationCodeExpires = otpExpires;
        await user.save();

        // Send Firebase verification email
        const emailSent = await sendFirebaseVerificationEmail(firebaseResult.user);

        // Also log OTP for development
        await sendOTPEmail(email, otp, 'verification');

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi gửi email xác thực'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư của bạn.',
            data: {
                message: 'Vui lòng kiểm tra email để xác thực tài khoản',
                firebaseUid: firebaseResult.uid
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
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and complete registration
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
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email và mã OTP là bắt buộc'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (!user.isOTPValid(otp, 'verification')) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không hợp lệ hoặc đã hết hạn'
            });
        }

        // Verify user
        user.isVerified = true;
        user.clearOTP('verification');
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Xác thực thành công',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
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
 *     summary: Resend OTP verification code
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
                message: 'Tài khoản đã được xác thực'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.verificationCode = otp;
        user.verificationCodeExpires = otpExpires;
        await user.save();

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp, 'verification');
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi gửi email xác thực'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Mã xác thực mới đã được gửi đến email của bạn'
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

        // Find user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email.'
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

        // Sign in with Firebase
        const firebaseResult = await signInFirebaseUser(email, password);
        if (!firebaseResult.success) {
            return res.status(401).json({
                success: false,
                message: 'Lỗi đăng nhập Firebase: ' + firebaseResult.error
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
 * /api/auth/upload-avatar:
 *   post:
 *     summary: Upload user avatar
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
 *                 description: Avatar image file
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
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
 *                         avatarUrl:
 *                           type: string
 *                           description: Avatar URL
 *       400:
 *         description: No file uploaded or invalid file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/upload-avatar', auth, uploadSingle, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn file ảnh'
            });
        }

        // Upload to Firebase
        const uploadResult = await uploadAvatar(req.file, req.user._id);

        // Update user avatar in database
        await User.findByIdAndUpdate(req.user._id, {
            avatar: uploadResult.url
        });

        res.status(200).json({
            success: true,
            message: 'Upload avatar thành công',
            data: {
                avatarUrl: uploadResult.url
            }
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server, vui lòng thử lại sau'
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
                message: 'Tài khoản đã được xác thực'
            });
        }

        // Sign in to Firebase to get user object for sending verification
        const firebaseResult = await signInFirebaseUser(email, password);
        if (!firebaseResult.success) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Send Firebase verification email
        const emailSent = await sendFirebaseVerificationEmail(firebaseResult.user);

        if (!emailSent) {
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

