const express = require('express');
const router = express.Router();
const Airline = require('../models/Airline');
const admin = require('../middleware/admin');

/**
 * @swagger
 * tags:
 *   name: Airlines
 *   description: API quản lý hãng hàng không
 */

/**
 * @swagger
 * /api/airlines:
 *   get:
 *     summary: Lấy danh sách tất cả hãng hàng không
 *     tags: [Airlines]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái hoạt động
 *     responses:
 *       200:
 *         description: Danh sách hãng hàng không
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Airline'
 */
router.get('/', async (req, res) => {
    try {
        const { isActive } = req.query;
        const query = {};

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const airlines = await Airline.find(query).sort({ name: 1 });

        res.json({
            success: true,
            data: airlines
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

/**
 * @swagger
 * /api/airlines/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết hãng hàng không
 *     tags: [Airlines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hãng hàng không
 *     responses:
 *       200:
 *         description: Thông tin hãng hàng không
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', async (req, res) => {
    try {
        const airline = await Airline.findById(req.params.id);

        if (!airline) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hãng hàng không'
            });
        }

        res.json({
            success: true,
            data: airline
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

/**
 * @swagger
 * /api/airlines:
 *   post:
 *     summary: Tạo hãng hàng không mới (Admin)
 *     tags: [Airlines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               logo:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/', admin, async (req, res) => {
    try {
        const { name, code, logo, description } = req.body;

        // Check if airline code already exists
        const existing = await Airline.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Mã hãng hàng không đã tồn tại'
            });
        }

        const airline = new Airline({
            name,
            code: code.toUpperCase(),
            logo,
            description
        });

        await airline.save();

        res.status(201).json({
            success: true,
            data: airline,
            message: 'Tạo hãng hàng không thành công'
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

/**
 * @swagger
 * /api/airlines/{id}:
 *   put:
 *     summary: Cập nhật thông tin hãng hàng không (Admin)
 *     tags: [Airlines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               logo:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', admin, async (req, res) => {
    try {
        const { name, logo, description, isActive } = req.body;

        const airline = await Airline.findByIdAndUpdate(
            req.params.id,
            { name, logo, description, isActive },
            { new: true, runValidators: true }
        );

        if (!airline) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hãng hàng không'
            });
        }

        res.json({
            success: true,
            data: airline,
            message: 'Cập nhật thành công'
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

/**
 * @swagger
 * /api/airlines/{id}:
 *   delete:
 *     summary: Xóa hãng hàng không (Admin)
 *     tags: [Airlines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy
 */
router.delete('/:id', admin, async (req, res) => {
    try {
        const airline = await Airline.findByIdAndDelete(req.params.id);

        if (!airline) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hãng hàng không'
            });
        }

        res.json({
            success: true,
            message: 'Xóa hãng hàng không thành công'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;
