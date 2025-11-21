const express = require('express');
const User = require('../../models/User.js');
const { validateEmail } = require('../../utils/emailValidation');
const admin = require('../../middleware/admin');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin - User Management
 *   description: Admin endpoints for managing users
 */

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - bearerAuth: []
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
 *               - role
 *               - status
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               fullName:
 *                 type: string
 *                 example: "Nguyen Van Admin"
 *               role:
 *                 type: string
 *                 enum: [admin, staff]
 *                 example: "admin"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Forbidden - Admin access required
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Server error
 */
router.post('/', admin, async (req, res) => {
    try {
        const { email, password, fullName, role, status } = req.body;

        // Validate required fields
        if (!email || !password || !fullName || !role || !status) {
            return res.status(400).json({
                success: false,
                message: 'Tất cả các trường đều là bắt buộc'
            });
        }

        // Validate role
        if (!['admin', 'staff'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Vai trò phải là "admin" hoặc "staff"'
            });
        }

        // Validate status
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái phải là "active" hoặc "inactive"'
            });
        }

        // Validate password length (only check > 6 characters)
        if (password.length <= 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Validate email format and domain
        const emailValidation = await validateEmail(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: emailValidation.message
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        // Create new user
        const user = new User({
            email,
            password,
            fullName,
            role,
            status,
            isVerified: true, // Admin-created users are automatically verified
            phone: null // No phone required
        });

        await user.save();

        // Return user data (without password)
        const userResponse = user.toJSON();

        res.status(201).json({
            success: true,
            message: 'Tạo người dùng thành công',
            data: {
                user: userResponse
            }
        });
    } catch (error) {
        console.error('Create user error:', error);

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
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin, staff]
 *         description: Filter by role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, banned]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email or full name
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/', admin, async (req, res) => {
    try {
        const { page = 1, limit = 10, role, status, search } = req.query;

        // Build filter object
        const filter = {};

        if (role) {
            filter.role = role;
        }

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get users with pagination
        const users = await User.find(filter)
            .select('-password') // Exclude password
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await User.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách người dùng thành công',
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalUsers: total,
                    hasNextPage: page * limit < total,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id', admin, async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin người dùng thành công',
            data: {
                user
            }
        });
    } catch (error) {
        console.error('Get user by ID error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID người dùng không hợp lệ'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Nguyen Van Admin"
 *               role:
 *                 type: string
 *                 enum: [admin, staff]
 *                 example: "admin"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:id', admin, async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, role, status } = req.body;

        // Validate role if provided
        if (role && !['user', 'admin', 'staff'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Vai trò không hợp lệ'
            });
        }

        // Validate status if provided
        if (status && !['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái phải là "active" hoặc "inactive"'
            });
        }

        // Build update object
        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (role !== undefined) updateData.role = role;
        if (status !== undefined) updateData.status = status;

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật người dùng thành công',
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('Update user error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID người dùng không hợp lệ'
            });
        }

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
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', admin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa tài khoản của chính mình'
            });
        }

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa người dùng thành công'
        });
    } catch (error) {
        console.error('Delete user error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID người dùng không hợp lệ'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/admin/users/search:
 *   get:
 *     summary: Search user by email
 *     tags: [Admin - User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email to search for
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get('/search', admin, async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email là bắt buộc'
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        }).select('_id fullName email phone role status');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Search user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

module.exports = router;