const express = require('express');
const Destination = require('../models/Destination');
const router = express.Router();

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
            .sort({ popular: -1, name: 1 })
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
            .sort({ name: 1 })
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

// Add debug endpoint to check all destinations
router.get('/debug/all', async (req, res) => {
    try {
        const destinations = await Destination.find({}).select('_id name slug');
        console.log('📋 All destinations:', destinations);
        res.json({ destinations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
