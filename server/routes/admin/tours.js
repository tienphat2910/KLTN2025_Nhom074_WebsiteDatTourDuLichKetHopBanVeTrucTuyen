const express = require('express');
const Tour = require('../../models/Tour');
const Destination = require('../../models/Destination');
const auth = require('../../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Tours
 *   description: Admin tour management endpoints
 */

/**
 * @swagger
 * /api/admin/tours:
 *   post:
 *     summary: Create a new tour (Admin only)
 *     tags: [Admin Tours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tour'
 *     responses:
 *       201:
 *         description: Tour created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Truy cập bị từ chối - Chỉ admin mới có quyền này'
            });
        }

        const tourData = req.body;

        // Validate required fields
        const requiredFields = ['title', 'destinationId', 'departureLocation', 'startDate', 'endDate', 'price', 'seats'];
        const missingFields = requiredFields.filter(field => !tourData[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`
            });
        }

        // Generate slug if not provided
        if (!tourData.slug && tourData.title) {
            tourData.slug = tourData.title
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

        // Set default values
        tourData.availableSeats = tourData.seats;
        tourData.isActive = tourData.isActive !== undefined ? tourData.isActive : true;

        const newTour = new Tour(tourData);
        const savedTour = await newTour.save();

        // Populate destination info
        await savedTour.populate('destinationId', 'name slug region image');

        res.status(201).json({
            success: true,
            message: 'Tạo tour mới thành công',
            data: savedTour
        });
    } catch (error) {
        console.error('Create tour error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi tạo tour mới'
        });
    }
});

/**
 * @swagger
 * /api/admin/tours:
 *   get:
 *     summary: Get all tours for admin (Admin only)
 *     tags: [Admin Tours]
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
 *         description: Number of tours per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or description
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *     responses:
 *       200:
 *         description: Tours retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Truy cập bị từ chối - Chỉ admin mới có quyền này'
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};

        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        if (req.query.isActive !== undefined) {
            filter.isActive = req.query.isActive === 'true';
        }

        if (req.query.isFeatured !== undefined) {
            filter.isFeatured = req.query.isFeatured === 'true';
        }

        console.log('🔍 Admin tour filter:', filter);

        // Get tours with pagination
        const tours = await Tour.find(filter)
            .select('title slug description destinationId departureLocation startDate endDate price discount seats availableSeats isFeatured isActive createdAt updatedAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('destinationId', 'name slug region');

        // Get total count
        const totalTours = await Tour.countDocuments(filter);
        const totalPages = Math.ceil(totalTours / limit);

        console.log('📊 Admin total tours found:', totalTours);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách tour thành công',
            data: {
                tours,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalTours,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('❌ Admin get tours error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/admin/tours/{id}:
 *   put:
 *     summary: Update tour by ID (Admin only)
 *     tags: [Admin Tours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tour'
 *     responses:
 *       200:
 *         description: Tour updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Tour not found
 */
router.put('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Truy cập bị từ chối - Chỉ admin mới có quyền này'
            });
        }

        const tourData = req.body;

        // Generate slug if title changed and slug not provided
        if (tourData.title && !tourData.slug) {
            tourData.slug = tourData.title
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

        const updatedTour = await Tour.findByIdAndUpdate(
            req.params.id,
            tourData,
            { new: true, runValidators: true }
        ).populate('destinationId', 'name slug region');

        if (!updatedTour) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tour để cập nhật'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật tour thành công',
            data: updatedTour
        });
    } catch (error) {
        console.error('Update tour error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật tour'
        });
    }
});

/**
 * @swagger
 * /api/admin/tours/{id}:
 *   delete:
 *     summary: Delete tour by ID (Admin only)
 *     tags: [Admin Tours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: Tour deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Tour not found
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Truy cập bị từ chối - Chỉ admin mới có quyền này'
            });
        }

        const deletedTour = await Tour.findByIdAndDelete(req.params.id);

        if (!deletedTour) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tour để xóa'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa tour thành công'
        });
    } catch (error) {
        console.error('Delete tour error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa tour'
        });
    }
});

module.exports = router;