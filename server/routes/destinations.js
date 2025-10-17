const express = require('express');
const Destination = require('../models/Destination');
const router = express.Router();
const { uploadDestinationImage } = require('../utils/cloudinaryUpload');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

/**
 * @swagger
 * tags:
 *   name: Destinations
 *   description: Destination management endpoints
 */

/**
 * @swagger
 * /api/destinations:
 *   get:
 *     summary: Get all destinations
 *     tags: [Destinations]
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
 *         description: Number of destinations per page
 *       - in: query
 *         name: popular
 *         schema:
 *           type: boolean
 *         description: Filter by popular destinations
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           enum: [Miền Bắc, Miền Trung, Miền Nam]
 *         description: Filter by region
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by destination name
 *     responses:
 *       200:
 *         description: Destinations retrieved successfully
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
 *                         destinations:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Destination'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             currentPage:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *                             totalDestinations:
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

        if (req.query.popular !== undefined) {
            filter.popular = req.query.popular === 'true';
        }

        if (req.query.region) {
            filter.region = req.query.region;
        }

        if (req.query.search) {
            filter.name = { $regex: req.query.search, $options: 'i' };
        }

        // Get destinations with pagination and ensure slugs exist
        const destinations = await Destination.find(filter)
            .select('_id name description image popular slug region')
            .sort({ _id: 1 }) // Sort by ID ascending
            .skip(skip)
            .limit(limit);

        // Filter out destinations without slugs and auto-generate them
        const validDestinations = [];
        for (let destination of destinations) {
            if (!destination.slug) {
                destination.slug = destination.name
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/đ/g, 'd')
                    .replace(/Đ/g, 'D')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim('-');
                await destination.save();
            }
            validDestinations.push(destination);
        }

        // Get total count
        const totalDestinations = await Destination.countDocuments(filter);
        const totalPages = Math.ceil(totalDestinations / limit);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách địa điểm thành công',
            data: {
                destinations: validDestinations,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalDestinations,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get destinations error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/destinations/popular:
 *   get:
 *     summary: Get popular destinations
 *     tags: [Destinations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 6
 *         description: Number of popular destinations to return
 *     responses:
 *       200:
 *         description: Popular destinations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Destination'
 */
router.get('/popular', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;

        const destinations = await Destination.find({ popular: true })
            .select('_id name description image popular slug region')
            .sort({ _id: 1 }) // Sort by ID ascending
            .limit(limit);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách địa điểm phổ biến thành công',
            data: destinations
        });
    } catch (error) {
        console.error('Get popular destinations error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/destinations/{id}:
 *   get:
 *     summary: Get destination by ID
 *     tags: [Destinations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination ID
 *     responses:
 *       200:
 *         description: Destination retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Destination'
 *       404:
 *         description: Destination not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id)
            .select('_id name description image popular slug region country createdAt');

        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy địa điểm'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin địa điểm thành công',
            data: destination
        });
    } catch (error) {
        console.error('Get destination by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/destinations/slug/{slug}:
 *   get:
 *     summary: Get destination by slug
 *     tags: [Destinations]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination slug
 *     responses:
 *       200:
 *         description: Destination retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Destination'
 *       404:
 *         description: Destination not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/slug/:slug', async (req, res) => {
    try {
        console.log('🔍 Looking for destination with slug:', req.params.slug);

        const destination = await Destination.findOne({ slug: req.params.slug })
            .select('_id name description image popular slug region country createdAt');

        console.log('🎯 Found destination:', destination ? {
            _id: destination._id,
            name: destination.name,
            slug: destination.slug
        } : 'NOT FOUND');

        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy địa điểm'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin địa điểm thành công',
            data: destination
        });
    } catch (error) {
        console.error('❌ Get destination by slug error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/destinations/fix-slugs:
 *   post:
 *     summary: Fix missing slugs for existing destinations
 *     tags: [Destinations]
 *     responses:
 *       200:
 *         description: Slugs updated successfully
 */
router.post('/fix-slugs', async (req, res) => {
    try {
        const destinations = await Destination.find({ $or: [{ slug: { $exists: false } }, { slug: '' }] });

        for (let destination of destinations) {
            destination.slug = destination.name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D')
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim('-');

            await destination.save();
        }

        res.status(200).json({
            success: true,
            message: `Updated ${destinations.length} destinations with slugs`,
            data: { updated: destinations.length }
        });
    } catch (error) {
        console.error('Fix slugs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/destinations:
 *   post:
 *     summary: Create a new destination
 *     tags: [Destinations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - image
 *               - region
 *             properties:
 *               name:
 *                 type: string
 *                 description: Destination name
 *               description:
 *                 type: string
 *                 description: Destination description
 *               image:
 *                 type: string
 *                 description: Image URL
 *               popular:
 *                 type: boolean
 *                 description: Whether destination is popular
 *               region:
 *                 type: string
 *                 enum: [Miền Bắc, Miền Trung, Miền Nam, Tây Nguyên]
 *                 description: Region
 *     responses:
 *       201:
 *         description: Destination created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Destination'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
    try {
        const { name, description, image, popular, region } = req.body;

        // Generate sequential ID like D001, D002, etc.
        const lastDestination = await Destination.findOne({}, {}, { sort: { '_id': -1 } });
        let nextId = 'D001';

        if (lastDestination && lastDestination._id) {
            // Extract number from ID like D016 -> 16
            const match = lastDestination._id.match(/^D(\d+)$/);
            if (match) {
                const currentNum = parseInt(match[1], 10);
                const nextNum = currentNum + 1;
                nextId = `D${nextNum.toString().padStart(3, '0')}`;
            }
        }

        const destination = new Destination({
            _id: nextId,
            name,
            description,
            image,
            popular: popular || false,
            region
        });

        const savedDestination = await destination.save();

        res.status(201).json({
            success: true,
            message: 'Tạo địa điểm mới thành công',
            data: savedDestination
        });
    } catch (error) {
        console.error('Create destination error:', error);

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
                message: 'Slug đã tồn tại, vui lòng chọn tên khác'
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
 * /api/destinations/{id}:
 *   put:
 *     summary: Update destination
 *     tags: [Destinations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Destination name
 *               description:
 *                 type: string
 *                 description: Destination description
 *               image:
 *                 type: string
 *                 description: Image URL
 *               popular:
 *                 type: boolean
 *                 description: Whether destination is popular
 *               region:
 *                 type: string
 *                 enum: [Miền Bắc, Miền Trung, Miền Nam, Tây Nguyên]
 *                 description: Region
 *     responses:
 *       200:
 *         description: Destination updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Destination'
 *       404:
 *         description: Destination not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, description, image, popular, region } = req.body;

        const destination = await Destination.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                image,
                popular,
                region
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy địa điểm'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật địa điểm thành công',
            data: destination
        });
    } catch (error) {
        console.error('Update destination error:', error);

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
                message: 'Slug đã tồn tại, vui lòng chọn tên khác'
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
 * /api/destinations/{id}:
 *   delete:
 *     summary: Delete destination
 *     tags: [Destinations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination ID
 *     responses:
 *       200:
 *         description: Destination deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Destination not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', async (req, res) => {
    try {
        const destination = await Destination.findByIdAndDelete(req.params.id);

        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy địa điểm'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa địa điểm thành công'
        });
    } catch (error) {
        console.error('Delete destination error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
});

/**
 * @swagger
 * /api/destinations/upload-image:
 *   post:
 *     summary: Upload destination image to Cloudinary
 *     tags: [Destinations]
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
 *                 description: Destination image file (max 5MB, formats: JPG, PNG, WEBP)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/upload-image', (req, res, next) => {
    // Use uploadSingle but change field name to 'image'
    const uploadImage = multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, path.join(__dirname, '../uploads'));
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        }),
        fileFilter: (req, file, cb) => {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Chỉ chấp nhận file ảnh định dạng JPG, PNG, WEBP'), false);
            }
        },
        limits: { fileSize: 5 * 1024 * 1024 }
    }).single('image');

    uploadImage(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log('POST /upload-image called');
        console.log('File received:', req.file ? 'Yes' : 'No');

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

        // Generate temp destination ID for upload
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('Starting upload to Cloudinary...');

        // Upload to Cloudinary
        const uploadResult = await uploadDestinationImage(req.file, tempId);

        console.log('Upload result:', uploadResult);

        res.status(200).json({
            success: true,
            message: 'Upload ảnh thành công',
            data: {
                url: uploadResult.url,
                public_id: uploadResult.public_id
            }
        });
    } catch (error) {
        console.error('Upload destination image error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

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

module.exports = router;
