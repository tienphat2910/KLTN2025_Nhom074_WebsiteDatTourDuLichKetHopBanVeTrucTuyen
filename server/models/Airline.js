const mongoose = require('mongoose');

const airlineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    logo: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Airline:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         _id:
 *           type: string
 *           description: ID của hãng hàng không
 *         name:
 *           type: string
 *           description: Tên hãng hàng không
 *           example: Vietnam Airlines
 *         code:
 *           type: string
 *           description: Mã hãng hàng không
 *           example: VN
 *         logo:
 *           type: string
 *           description: URL logo hãng hàng không
 *         description:
 *           type: string
 *           description: Mô tả về hãng hàng không
 *         isActive:
 *           type: boolean
 *           description: Trạng thái hoạt động
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = mongoose.model('Airline', airlineSchema);
