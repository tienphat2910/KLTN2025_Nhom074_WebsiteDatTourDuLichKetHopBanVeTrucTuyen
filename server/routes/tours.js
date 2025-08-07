const express = require('express');
const Tour = require('../models/Tour');
const Destination = require('../models/Destination');
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

        // Use $or condition to include tours where isActive is true OR undefined/null
        const enhancedFilter = {
            ...filter,
            $or: [
                { isActive: true },
                { isActive: { $exists: false } },
                { isActive: null }
            ]
        };

        console.log('🔍 Tour filter:', enhancedFilter);

        // Debug: Check all tours in database with isActive field
        const allTours = await Tour.find({}).select('title destinationId isActive');
        console.log('📋 All tours in database with isActive:', allTours.map(t => ({
            title: t.title,
            destinationId: t.destinationId,
            isActive: t.isActive
        })));

        // Get tours with pagination
        const tours = await Tour.find(enhancedFilter)
            .select('title slug description destinationId departureLocation itinerary startDate endDate price discount pricingByAge seats availableSeats images isFeatured rating reviewCount category duration isActive')
            .sort({ isFeatured: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('destinationId', 'name slug region image');

        console.log('🎯 Found tours for enhanced filter:', tours.length);
        console.log('🎯 Tour details:', tours.map(t => ({
            title: t.title,
            destinationId: t.destinationId,
            slug: t.slug,
            isActive: t.isActive
        })));

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
 *     tags: [Tours]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 6
 *         description: Number of featured tours to return
 *     responses:
 *       200:
 *         description: Featured tours retrieved successfully
 */
router.get('/featured', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;

        const tours = await Tour.find({ isFeatured: true, isActive: true })
            .select('title slug description destinationId departureLocation startDate endDate price discount pricingByAge seats availableSeats images isFeatured rating reviewCount category duration')
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('destinationId', 'name slug region image');

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách tour nổi bật thành công',
            data: tours
        });
    } catch (error) {
        console.error('Get featured tours error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
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

            // Log all available slugs for debugging
            const allTours = await Tour.find({ isActive: true }, 'title slug _id');
            console.log('📋 Available tour slugs:');
            allTours.forEach(t => {
                console.log(`  - ID: ${t._id}, Slug: "${t.slug}", Title: "${t.title}"`);
            });

            // Check for similar slugs
            const similarTours = allTours.filter(t =>
                t.slug.includes(slug) || slug.includes(t.slug)
            );
            if (similarTours.length > 0) {
                console.log('🔍 Similar slugs found:', similarTours.map(t => t.slug));
            }

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

// Debug endpoint to check and fix slug duplicates
router.post('/debug/fix-slugs', async (req, res) => {
    try {
        console.log('🔧 Fixing slug duplicates...');

        // Get all tours
        const allTours = await Tour.find({});

        // Check for duplicates
        const slugCounts = allTours.reduce((acc, tour) => {
            acc[tour.slug] = (acc[tour.slug] || []).concat(tour);
            return acc;
        }, {});

        const duplicates = Object.entries(slugCounts).filter(([_, tours]) => tours.length > 1);

        console.log(`📊 Found ${duplicates.length} duplicate slug groups`);

        let fixedCount = 0;

        for (const [slug, tours] of duplicates) {
            console.log(`🔍 Fixing slug "${slug}" with ${tours.length} duplicates`);

            // Keep the first tour with original slug, update others
            for (let i = 1; i < tours.length; i++) {
                const tour = tours[i];
                const timestamp = Date.now().toString().slice(-6);
                const newSlug = `${slug}-${timestamp}-${i}`;

                await Tour.updateOne(
                    { _id: tour._id },
                    { $set: { slug: newSlug } }
                );

                console.log(`✅ Updated tour "${tour.title}" slug: ${slug} → ${newSlug}`);
                fixedCount++;
            }
        }

        // Get updated tours to verify
        const updatedTours = await Tour.find({}).select('title slug _id');
        console.log('📋 All tours after fix:', updatedTours.map(t => ({
            id: t._id,
            title: t.title,
            slug: t.slug
        })));

        res.json({
            success: true,
            message: `Fixed ${fixedCount} duplicate slugs`,
            data: {
                duplicatesFound: duplicates.length,
                toursFixed: fixedCount,
                updatedTours: updatedTours.map(t => ({ id: t._id, slug: t.slug, title: t.title }))
            }
        });
    } catch (error) {
        console.error('❌ Fix slugs error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint to check and fix isActive field
router.post('/debug/fix-active', async (req, res) => {
    try {
        console.log('🔧 Fixing isActive field for all tours...');

        // Update all tours without isActive field to have isActive: true
        const result = await Tour.updateMany(
            {
                $or: [
                    { isActive: { $exists: false } },
                    { isActive: null }
                ]
            },
            {
                $set: { isActive: true }
            }
        );

        console.log('📊 Updated tours:', result);

        // Get all tours to verify
        const allTours = await Tour.find({}).select('title destinationId isActive');
        console.log('📋 All tours after fix:', allTours.map(t => ({
            title: t.title,
            destinationId: t.destinationId,
            isActive: t.isActive
        })));

        res.json({
            success: true,
            message: `Fixed ${result.modifiedCount} tours`,
            data: result
        });
    } catch (error) {
        console.error('❌ Fix active error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/tours/validate-departures:
 *   post:
 *     summary: Validate departure locations for tours
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: Departure locations validated successfully
 */
router.post('/validate-departures', async (req, res) => {
    try {
        console.log('🔍 Validating tour departure locations...');

        // Get all tours
        const tours = await Tour.find({});

        let updatedCount = 0;
        let mismatchCount = 0;

        // Check and fix departure locations
        for (const tour of tours) {
            // Check if the tour title indicates a departure location
            const titleLower = tour.title.toLowerCase();
            let expectedDeparture = null;

            if (titleLower.includes('khởi hành từ tphcm') ||
                titleLower.includes('khởi hành từ hồ chí minh') ||
                titleLower.includes('từ tp.hcm')) {
                expectedDeparture = 'TP. Hồ Chí Minh';
            } else if (titleLower.includes('khởi hành từ hà nội') ||
                titleLower.includes('từ hà nội') ||
                titleLower.includes('từ hn')) {
                expectedDeparture = 'Hà Nội';
            } else if (titleLower.includes('khởi hành từ đà nẵng') ||
                titleLower.includes('từ đà nẵng')) {
                expectedDeparture = 'Đà Nẵng';
            }

            // Check if we need to update the departure location
            if (expectedDeparture &&
                (!tour.departureLocation || tour.departureLocation.name !== expectedDeparture)) {

                console.log(`⚠️ Mismatch found for tour: "${tour.title}"`);
                console.log(`   Current departure: ${tour.departureLocation?.name || 'None'}`);
                console.log(`   Expected departure: ${expectedDeparture}`);

                // Update the tour with the correct departure location
                await Tour.updateOne(
                    { _id: tour._id },
                    {
                        $set: {
                            departureLocation: {
                                name: expectedDeparture,
                                region: expectedDeparture === 'Hà Nội' ? 'Miền Bắc' :
                                    expectedDeparture === 'Đà Nẵng' ? 'Miền Trung' : 'Miền Nam'
                            }
                        }
                    }
                );

                updatedCount++;
                mismatchCount++;
            } else if (!tour.departureLocation) {
                // Set a default departure location if none exists
                await Tour.updateOne(
                    { _id: tour._id },
                    {
                        $set: {
                            departureLocation: {
                                name: 'TP. Hồ Chí Minh',
                                region: 'Miền Nam'
                            }
                        }
                    }
                );
                updatedCount++;
            }
        }

        res.status(200).json({
            success: true,
            message: `Validated ${tours.length} tours, fixed ${updatedCount} departures, found ${mismatchCount} mismatches`,
            data: {
                totalTours: tours.length,
                updatedTours: updatedCount,
                mismatchCount: mismatchCount
            }
        });
    } catch (error) {
        console.error('❌ Validate departures error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xác thực điểm khởi hành',
            error: error.message
        });
    }
});

module.exports = router;
