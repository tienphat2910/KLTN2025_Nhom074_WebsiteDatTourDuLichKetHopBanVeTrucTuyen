const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

/**
 * @swagger
 * tags:
 *   name: Activities
 *   description: Các hoạt động giải trí, tham quan, vui chơi
 */

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Lấy danh sách hoạt động (activities) với phân trang và lọc
 *     tags: [Activities]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng hoạt động mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc địa điểm
 *       - in: query
 *         name: destinationId
 *         schema:
 *           type: string
 *         description: Lọc theo ID địa điểm
 *       - in: query
 *         name: popular
 *         schema:
 *           type: boolean
 *         description: Lọc hoạt động nổi bật
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Giá tối thiểu
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Giá tối đa
 *     responses:
 *       200:
 *         description: Danh sách hoạt động với phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     activities:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Activity'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalActivities:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 */
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};

        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { 'location.name': { $regex: req.query.search, $options: 'i' } },
                { 'location.address': { $regex: req.query.search, $options: 'i' } }
            ];
        }

        if (req.query.destinationId) {
            filter.destinationId = req.query.destinationId;
        }

        if (req.query.popular !== undefined) {
            filter.popular = req.query.popular === 'true';
        }

        if (req.query.minPrice || req.query.maxPrice) {
            filter['price.retail.adult'] = {};
            if (req.query.minPrice) {
                filter['price.retail.adult'].$gte = parseInt(req.query.minPrice);
            }
            if (req.query.maxPrice) {
                filter['price.retail.adult'].$lte = parseInt(req.query.maxPrice);
            }
        }

        // Get total count for pagination
        const totalActivities = await Activity.countDocuments(filter);
        const totalPages = Math.ceil(totalActivities / limit);

        // Get activities with pagination
        const activities = await Activity.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            data: {
                activities,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalActivities,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: Tạo hoạt động mới (Admin only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Activity'
 *     responses:
 *       201:
 *         description: Hoạt động đã được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Chỉ admin mới có quyền thực hiện
 */
router.post('/', admin, async (req, res, next) => {
    try {
        const activity = new Activity(req.body);
        await activity.save();

        res.status(201).json({
            success: true,
            data: activity,
            message: 'Hoạt động đã được tạo thành công'
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Slug đã tồn tại, vui lòng chọn tên khác'
            });
        }
        next(err);
    }
});

/**
 * @swagger
 * /api/activities/{id}:
 *   put:
 *     summary: Cập nhật hoạt động (Admin only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của hoạt động
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Activity'
 *     responses:
 *       200:
 *         description: Hoạt động đã được cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       404:
 *         description: Không tìm thấy hoạt động
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Chỉ admin mới có quyền thực hiện
 */
router.put('/:id', admin, async (req, res, next) => {
    try {
        const activity = await Activity.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy hoạt động"
            });
        }

        res.json({
            success: true,
            data: activity,
            message: 'Hoạt động đã được cập nhật thành công'
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Slug đã tồn tại, vui lòng chọn tên khác'
            });
        }
        next(err);
    }
});

/**
 * @swagger
 * /api/activities/{id}:
 *   delete:
 *     summary: Xóa hoạt động (Admin only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của hoạt động
 *     responses:
 *       200:
 *         description: Hoạt động đã được xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Hoạt động đã được xóa thành công"
 *       404:
 *         description: Không tìm thấy hoạt động
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Chỉ admin mới có quyền thực hiện
 */
router.delete('/:id', admin, async (req, res, next) => {
    try {
        const activity = await Activity.findByIdAndDelete(req.params.id);

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy hoạt động"
            });
        }

        res.json({
            success: true,
            message: "Hoạt động đã được xóa thành công"
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/activities/{id}:
 *   get:
 *     summary: Lấy thông tin hoạt động theo ID
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của hoạt động
 *     responses:
 *       200:
 *         description: Thông tin hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       404:
 *         description: Không tìm thấy hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy hoạt động"
 */
router.get('/:id', async (req, res, next) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity) {
            return res.status(404).json({ success: false, message: "Không tìm thấy hoạt động" });
        }
        res.json({ success: true, data: activity });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/activities/slug/{slug}:
 *   get:
 *     summary: Lấy thông tin hoạt động theo slug
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug của hoạt động
 *     responses:
 *       200:
 *         description: Thông tin hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       404:
 *         description: Không tìm thấy hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy hoạt động"
 */
router.get('/slug/:slug', async (req, res, next) => {
    try {
        const activity = await Activity.findOne({ slug: req.params.slug });
        if (!activity) {
            return res.status(404).json({ success: false, message: "Không tìm thấy hoạt động" });
        }
        res.json({ success: true, data: activity });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
