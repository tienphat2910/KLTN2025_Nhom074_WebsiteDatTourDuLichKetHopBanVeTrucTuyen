const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const {
    createZaloPayOrder,
    verifyZaloPayCallback,
    queryZaloPayOrderStatus,
    getPaymentStatusText
} = require('../utils/zalopayService');

/**
 * @swagger
 * /api/payment/zalopay/create:
 *   post:
 *     summary: Create ZaloPay payment order
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - description
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount in VND
 *               description:
 *                 type: string
 *                 description: Payment description
 *               extraData:
 *                 type: string
 *                 description: Extra data for the order
 *     responses:
 *       200:
 *         description: ZaloPay order created successfully
 *       400:
 *         description: Invalid request
 */
router.post('/zalopay/create', auth, async (req, res) => {
    try {
        const { amount, description, extraData } = req.body;

        if (!amount || !description) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin thanh toán'
            });
        }

        // Prepare order data
        const orderData = {
            amount: Math.round(amount), // ZaloPay requires integer amount
            description: description,
            userId: req.user._id.toString(),
            extraData: extraData || ''
        };

        // Create ZaloPay order
        const result = await createZaloPayOrder(orderData);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            data: {
                order_url: result.data.order_url,
                app_trans_id: result.data.app_trans_id,
                zp_trans_token: result.data.zp_trans_token,
                return_code: result.data.return_code,
                return_message: result.data.return_message
            },
            message: 'Tạo đơn hàng ZaloPay thành công'
        });
    } catch (error) {
        console.error('Create ZaloPay order error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo đơn hàng ZaloPay',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/payment/zalopay/callback:
 *   post:
 *     summary: ZaloPay payment callback
 *     tags: [Payment]
 *     description: Webhook endpoint for ZaloPay to notify payment result
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: string
 *               mac:
 *                 type: string
 *     responses:
 *       200:
 *         description: Callback processed
 */
router.post('/zalopay/callback', async (req, res) => {
    try {
        console.log('📞 ZaloPay callback received:', req.body);

        // Verify callback
        const verification = verifyZaloPayCallback(req.body);

        if (!verification.isValid) {
            console.error('❌ Invalid ZaloPay callback signature');
            return res.json({
                return_code: -1,
                return_message: 'Invalid signature'
            });
        }

        // Parse callback data
        const callbackData = verification.data;

        console.log('✅ Payment successful:', {
            app_trans_id: callbackData.app_trans_id,
            zp_trans_id: callbackData.zp_trans_id,
            amount: callbackData.amount,
            server_time: callbackData.server_time
        });

        // TODO: Can store payment transaction for reconciliation
        // TODO: Send confirmation email if needed
        // TODO: Emit socket event to notify user

        res.json({
            return_code: 1,
            return_message: 'success'
        });
    } catch (error) {
        console.error('❌ ZaloPay callback error:', error);
        res.json({
            return_code: 0, // ZaloPay will retry callback
            return_message: error.message
        });
    }
});

/**
 * @swagger
 * /api/payment/zalopay/status:
 *   post:
 *     summary: Query ZaloPay order status
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - app_trans_id
 *             properties:
 *               app_trans_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status retrieved successfully
 */
router.post('/zalopay/status', auth, async (req, res) => {
    try {
        const { app_trans_id } = req.body;

        if (!app_trans_id) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã giao dịch'
            });
        }

        const result = await queryZaloPayOrderStatus(app_trans_id);

        res.json({
            success: result.success,
            data: {
                ...result.data,
                statusText: getPaymentStatusText(result.data?.return_code)
            },
            message: result.message
        });
    } catch (error) {
        console.error('Query ZaloPay status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi truy vấn trạng thái đơn hàng',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/payment/zalopay/verify/{bookingId}:
 *   get:
 *     summary: Verify payment status for a booking
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status verified
 */
router.get('/zalopay/verify/:bookingId', auth, async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Verify booking belongs to user
        if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem đơn hàng này'
            });
        }

        // If booking doesn't have ZaloPay transaction ID
        if (!booking.zalopayTransId) {
            return res.json({
                success: true,
                data: {
                    bookingId: booking._id,
                    paymentStatus: booking.paymentStatus,
                    status: booking.status,
                    hasZaloPayTrans: false
                },
                message: 'Đơn hàng chưa có giao dịch ZaloPay'
            });
        }

        // Query ZaloPay status
        const result = await queryZaloPayOrderStatus(booking.zalopayTransId);

        // Update booking if payment is successful
        if (result.success && result.data.return_code === 1 && booking.paymentStatus !== 'paid') {
            booking.paymentStatus = 'paid';
            booking.status = 'confirmed';
            booking.paidAt = new Date();
            await booking.save();
        }

        res.json({
            success: true,
            data: {
                bookingId: booking._id,
                paymentStatus: booking.paymentStatus,
                status: booking.status,
                zalopayStatus: result.data,
                statusText: getPaymentStatusText(result.data?.return_code)
            },
            message: 'Xác minh thanh toán thành công'
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xác minh thanh toán',
            error: error.message
        });
    }
});

module.exports = router;
