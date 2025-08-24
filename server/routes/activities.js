const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

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
 *     summary: Lấy danh sách hoạt động (activities)
 *     tags: [Activities]
 *     responses:
 *       200:
 *         description: Danh sách hoạt động
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
 *                     $ref: '#/components/schemas/Activity'
 */
router.get('/', async (req, res, next) => {
    try {
        const activities = await Activity.find();
        res.json({ success: true, data: activities });
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

module.exports = router;
