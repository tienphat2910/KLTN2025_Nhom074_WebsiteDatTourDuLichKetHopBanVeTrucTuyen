const express = require('express');
const Tour = require('../models/Tour');
const Destination = require('../models/Destination');
const { uploadTourImage } = require('../utils/cloudinaryUpload');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tours
 *   description: Tour management endpoints
 */

/**
 * @swagger
 * /api/tours:
 *   get:
 *     summary: Get all tours
 *     tags: [Tours]
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
 *         name: destination
 *         schema:
 *           type: string
 *         description: Filter by destination ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [adventure, cultural, relaxation, family, luxury, budget]
 *         description: Filter by category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured tours
 *       - in: query
 *         name: departure
 *         schema:
 *           type: string
 *         description: Filter by departure location
 *     responses:
 *       200:
 *         description: Tours retrieved successfully
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};

        if (req.query.destination) {
            filter.destinationId = req.query.destination;
            console.log('🔍 Filtering tours by destinationId:', req.query.destination);
        }

        if (req.query.category) {
            filter.category = req.query.category;
        }

        if (req.query.featured !== undefined) {
            filter.isFeatured = req.query.featured === 'true';
        }

        if (req.query.departure) {
            filter['departureLocation.name'] = { $regex: req.query.departure, $options: 'i' };
        }

        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
            if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
        }

        // Lọc theo ngày khởi hành/kết thúc
        const start = req.query.start ? new Date(req.query.start) : null;
        const end = req.query.end ? new Date(req.query.end) : null;

        if (start && !isNaN(start.getTime()) && end && !isNaN(end.getTime())) {
            // Nếu cả hai ngày đều hợp lệ và start <= end
            if (start <= end) {
                filter.startDate = { $gte: start };
                filter.endDate = { $lte: end };
            }
        } else if (start && !isNaN(start.getTime())) {
            filter.startDate = { $gte: start };
        } else if (end && !isNaN(end.getTime())) {
            filter.endDate = { $lte: end };
        }

        // No additional filter for isActive - show all tours for admin management
        const enhancedFilter = {
            ...filter
        };

        console.log('🔍 Tour filter:', enhancedFilter);

        // Get tours with pagination - now includes all tours for admin management
        const tours = await Tour.find(enhancedFilter)
            .select('title slug description destinationId departureLocation itinerary startDate endDate price discount pricingByAge seats availableSeats images isFeatured rating reviewCount category duration isActive')
            .sort({ isFeatured: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('destinationId', 'name slug region image');

        console.log('🎯 Found tours for enhanced filter:', tours.length);

        // Auto-generate slugs for tours that don't have them
        const toursWithSlugs = [];
        for (let tour of tours) {
            if (!tour.slug && tour.title) {
                tour.slug = tour.title
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/đ/g, 'd')
                    .replace(/Đ/g, 'D')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim('-');
                console.log('✏️ Generated slug for tour:', tour.title, '→', tour.slug);
                await tour.save();
            }
            toursWithSlugs.push(tour);
        }

        // Get total count
        const totalTours = await Tour.countDocuments(enhancedFilter);
        const totalPages = Math.ceil(totalTours / limit);

        console.log('📊 Total tours found:', totalTours);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách tour thành công',
            data: {
                tours: toursWithSlugs,
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
        console.error('❌ Get tours error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/tours/featured:
 *   get:
 *     summary: Get featured tours
 *     description: Retrieve tours that are marked as featured (isFeatured = true)
 *     tags: [Tours]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of featured tours to return
 *     responses:
 *       200:
 *         description: Successfully retrieved featured tours
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tour'
 *       500:
 *         description: Server error
 */
router.get('/featured', async (req, res) => {
    try {
        const { limit = 6 } = req.query;

        // First try to find featured tours
        let featuredTours = await Tour.find({
            isFeatured: true,
            isActive: { $ne: false } // Include tours where isActive is true or undefined
        })
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .populate('destinationId', 'name slug');

        // If no featured tours found, get the latest tours as fallback
        if (featuredTours.length === 0) {
            featuredTours = await Tour.find({
                isActive: { $ne: false }
            })
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .populate('destinationId', 'name slug');
        }

        res.json({
            success: true,
            data: featuredTours,
            message: featuredTours.length === 0 ? 'Không tìm thấy tour nào' : undefined
        });
    } catch (error) {
        console.error('Error fetching featured tours:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách tour nổi bật',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/tours/debug:
 *   get:
 *     summary: Debug endpoint to check tours
 *     description: Debug endpoint to see all tours and their featured status
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: Debug information
 */
router.get('/debug', async (req, res) => {
    try {
        const totalTours = await Tour.countDocuments();
        const featuredTours = await Tour.countDocuments({ isFeatured: true });
        const activeTours = await Tour.countDocuments({ isActive: { $ne: false } });

        const sampleTours = await Tour.find({})
            .limit(5)
            .select('title isFeatured isActive createdAt')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            debug: {
                totalTours,
                featuredTours,
                activeTours,
                sampleTours
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/tours/{id}:
 *   get:
 *     summary: Get tour by ID
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: Tour retrieved successfully
 *       404:
 *         description: Tour not found
 */
router.get('/:id', async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id)
            .populate('destinationId', 'name slug region image description country');

        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tour'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin tour thành công',
            data: tour
        });
    } catch (error) {
        console.error('Get tour by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/tours/slug/{slug}:
 *   get:
 *     summary: Get tour by slug
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour slug
 *     responses:
 *       200:
 *         description: Tour retrieved successfully
 *       404:
 *         description: Tour not found
 */
router.get('/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        console.log(`🔍 Looking for tour with slug: "${slug}"`);

        // Use exact match with case-insensitive search
        const tour = await Tour.findOne({
            slug: { $regex: `^${slug}$`, $options: 'i' },
            isActive: true
        });

        if (!tour) {
            console.log(`❌ Tour not found with slug: "${slug}"`);
            return res.status(404).json({
                success: false,
                message: 'Tour không tồn tại'
            });
        }

        console.log(`✅ Found tour: "${tour.title}" (ID: ${tour._id}, Slug: "${tour.slug}")`);

        res.json({
            success: true,
            message: 'Lấy thông tin tour thành công',
            data: tour
        });
    } catch (error) {
        console.error('Get tour by slug error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin tour',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/tours/upload-image:
 *   post:
 *     summary: Upload tour image
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               tourId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: No image provided
 *       401:
 *         description: Unauthorized
 */
router.post('/upload-image', auth, admin, (req, res, next) => {
    // Create multer upload for 'image' field (different from 'avatar')
    const multer = require('multer');
    const path = require('path');

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '../uploads'));
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    const fileFilter = (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh định dạng JPG, PNG, WEBP'), false);
        }
    };

    const uploadImage = multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    }).single('image');

    uploadImage(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng chọn ảnh để tải lên'
                });
            }

            const tourId = req.body.tourId || 'temp';
            const uploadResult = await uploadTourImage(req.file, tourId);

            res.status(200).json({
                success: true,
                message: 'Tải ảnh lên thành công',
                data: {
                    url: uploadResult.url,
                    public_id: uploadResult.public_id
                }
            });
        } catch (error) {
            console.error('Upload tour image error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tải ảnh lên',
                error: error.message
            });
        }
    });
});

/**
 * @swagger
 * /api/tours/{id}:
 *   put:
 *     summary: Update tour by ID
 *     tags: [Tours]
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
 *       404:
 *         description: Tour not found
 */
router.put('/:id', async (req, res) => {
    try {
        const updatedTour = await Tour.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
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
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
