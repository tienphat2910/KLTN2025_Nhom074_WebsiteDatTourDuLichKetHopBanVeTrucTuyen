const express = require('express');
const Discount = require('../models/Discount');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

/**
 * @swagger
 * tags:
 *   name: Discounts
 *   description: Discount code management endpoints
 */

/**
 * @swagger
 * /api/discounts:
 *   get:
 *     summary: Get all discounts
 *     tags: [Discounts]
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
 *           default: 20
 *         description: Number of discounts per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by code or description
 *       - in: query
 *         name: discountType
 *         schema:
 *           type: string
 *           enum: [percentage, fixed]
 *         description: Filter by discount type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Discounts retrieved successfully
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
 *                         discounts:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Discount'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             currentPage:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *                             totalDiscounts:
 *                               type: integer
 *                             hasNext:
 *                               type: boolean
 *                             hasPrev:
 *                               type: boolean
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};

        if (req.query.discountType) {
            filter.discountType = req.query.discountType;
        }

        if (req.query.isActive !== undefined) {
            filter.isActive = req.query.isActive === 'true';
        }

        if (req.query.search) {
            filter.$or = [
                { code: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Get discounts with pagination
        const discounts = await Discount.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count
        const totalDiscounts = await Discount.countDocuments(filter);
        const totalPages = Math.ceil(totalDiscounts / limit);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách mã giảm giá thành công',
            data: {
                discounts,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalDiscounts,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get discounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/discounts/{id}:
 *   get:
 *     summary: Get discount by ID
 *     tags: [Discounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount ID
 *     responses:
 *       200:
 *         description: Discount retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Discount'
 *       404:
 *         description: Discount not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req, res) => {
    try {
        const discount = await Discount.findById(req.params.id);

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mã giảm giá'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin mã giảm giá thành công',
            data: discount
        });
    } catch (error) {
        console.error('Get discount by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/discounts:
 *   post:
 *     summary: Create a new discount
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - description
 *               - discountType
 *               - value
 *               - validFrom
 *               - validUntil
 *               - usageLimit
 *             properties:
 *               code:
 *                 type: string
 *                 description: Discount code (uppercase)
 *               description:
 *                 type: string
 *                 description: Discount description
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 description: Type of discount
 *               value:
 *                 type: number
 *                 description: Discount value
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 description: Start date
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 description: End date
 *               usageLimit:
 *                 type: number
 *                 description: Maximum usage count
 *               isActive:
 *                 type: boolean
 *                 description: Whether discount is active
 *     responses:
 *       201:
 *         description: Discount created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Discount'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', admin, async (req, res) => {
    try {
        const { code, description, discountType, value, validFrom, validUntil, usageLimit, isActive } = req.body;

        const discount = new Discount({
            code,
            description,
            discountType,
            value,
            validFrom: new Date(validFrom),
            validUntil: new Date(validUntil),
            usageLimit,
            isActive: isActive !== undefined ? isActive : true
        });

        const savedDiscount = await discount.save();

        res.status(201).json({
            success: true,
            message: 'Tạo mã giảm giá mới thành công',
            data: savedDiscount
        });
    } catch (error) {
        console.error('Create discount error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã tồn tại'
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
 * /api/discounts/{id}:
 *   put:
 *     summary: Update discount
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Discount code (uppercase)
 *               description:
 *                 type: string
 *                 description: Discount description
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 description: Type of discount
 *               value:
 *                 type: number
 *                 description: Discount value
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 description: Start date
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 description: End date
 *               usageLimit:
 *                 type: number
 *                 description: Maximum usage count
 *               isActive:
 *                 type: boolean
 *                 description: Whether discount is active
 *     responses:
 *       200:
 *         description: Discount updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Discount'
 *       404:
 *         description: Discount not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', admin, async (req, res) => {
    try {
        const { code, description, discountType, value, validFrom, validUntil, usageLimit, isActive } = req.body;

        const updateData = {};
        if (code !== undefined) updateData.code = code;
        if (description !== undefined) updateData.description = description;
        if (discountType !== undefined) updateData.discountType = discountType;
        if (value !== undefined) updateData.value = value;
        if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
        if (validUntil !== undefined) updateData.validUntil = new Date(validUntil);
        if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
        if (isActive !== undefined) updateData.isActive = isActive;

        const discount = await Discount.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mã giảm giá'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật mã giảm giá thành công',
            data: discount
        });
    } catch (error) {
        console.error('Update discount error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã tồn tại'
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
 * /api/discounts/{id}:
 *   delete:
 *     summary: Delete discount
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount ID
 *     responses:
 *       200:
 *         description: Discount deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Discount not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', admin, async (req, res) => {
    try {
        const discount = await Discount.findByIdAndDelete(req.params.id);

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mã giảm giá'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa mã giảm giá thành công'
        });
    } catch (error) {
        console.error('Delete discount error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/discounts/validate/{code}:
 *   get:
 *     summary: Validate discount code
 *     tags: [Discounts]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount code to validate
 *     responses:
 *       200:
 *         description: Discount code is valid
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Discount'
 *       404:
 *         description: Discount code not found or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/validate/:code', async (req, res) => {
    try {
        const discount = await Discount.findOne({
            code: req.params.code.toUpperCase(),
            isActive: true
        });

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Mã giảm giá không tồn tại'
            });
        }

        if (!discount.isValid()) {
            return res.status(404).json({
                success: false,
                message: 'Mã giảm giá đã hết hạn hoặc hết lượt sử dụng'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Mã giảm giá hợp lệ',
            data: discount
        });
    } catch (error) {
        console.error('Validate discount error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

module.exports = router;