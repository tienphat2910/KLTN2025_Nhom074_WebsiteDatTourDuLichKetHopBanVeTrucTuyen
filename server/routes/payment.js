const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const momoConfig = require('../config/momo');

/**
 * @swagger
 * components:
 *   schemas:
 *     MoMoPaymentRequest:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: number
 *           description: Payment amount in VND
 *           example: 100000
 *         orderInfo:
 *           type: string
 *           description: Order description
 *           example: "Thanh toán tour du lịch"
 *         extraData:
 *           type: string
 *           description: Extra data for the order
 *           example: ""
 *     MoMoPaymentResponse:
 *       type: object
 *       properties:
 *         partnerCode:
 *           type: string
 *         orderId:
 *           type: string
 *         requestId:
 *           type: string
 *         amount:
 *           type: number
 *         responseTime:
 *           type: number
 *         message:
 *           type: string
 *         resultCode:
 *           type: number
 *         payUrl:
 *           type: string
 *           description: URL to redirect user for payment
 *         deeplink:
 *           type: string
 *         qrCodeUrl:
 *           type: string
 */

/**
 * @swagger
 * /api/payment/momo:
 *   post:
 *     summary: Create MoMo payment
 *     description: Create a payment request with MoMo gateway
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MoMoPaymentRequest'
 *     responses:
 *       200:
 *         description: Payment request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoMoPaymentResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: number
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Error message"
 */
router.post('/', async (req, res) => {
    try {
        const {
            accessKey,
            secretKey,
            orderInfo,
            partnerCode,
            redirectUrl,
            ipnUrl,
            requestType,
            extraData,
            orderGroupId,
            autoCapture,
            lang,
            endpoint
        } = momoConfig;

        // Get amount from request body, default to 10000 if not provided
        const amount = req.body.amount ? req.body.amount.toString() : '10000';
        const customOrderInfo = req.body.orderInfo || orderInfo;
        const customExtraData = req.body.extraData || extraData;

        // Generate unique orderId and requestId
        const orderId = partnerCode + new Date().getTime();
        const requestId = orderId;

        // Create raw signature string
        const rawSignature =
            'accessKey=' + accessKey +
            '&amount=' + amount +
            '&extraData=' + customExtraData +
            '&ipnUrl=' + ipnUrl +
            '&orderId=' + orderId +
            '&orderInfo=' + customOrderInfo +
            '&partnerCode=' + partnerCode +
            '&redirectUrl=' + redirectUrl +
            '&requestId=' + requestId +
            '&requestType=' + requestType;

        // Generate signature
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        // Create request body for MoMo API
        const requestBody = JSON.stringify({
            partnerCode: partnerCode,
            partnerName: 'LuTrip',
            storeId: 'LuTripStore',
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: customOrderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            lang: lang,
            requestType: requestType,
            autoCapture: autoCapture,
            extraData: customExtraData,
            orderGroupId: orderGroupId,
            signature: signature,
        });

        // Options for axios request to MoMo
        const options = {
            method: 'POST',
            url: endpoint,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
            },
            data: requestBody,
        };

        // Send request to MoMo and return response
        const result = await axios(options);
        return res.status(200).json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('MoMo payment error:', error);
        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/payment/momo/callback:
 *   post:
 *     summary: MoMo payment callback
 *     description: Handle callback from MoMo after payment completion
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partnerCode:
 *                 type: string
 *               orderId:
 *                 type: string
 *               requestId:
 *                 type: string
 *               amount:
 *                 type: number
 *               orderInfo:
 *                 type: string
 *               orderType:
 *                 type: string
 *               transId:
 *                 type: number
 *               resultCode:
 *                 type: number
 *                 description: "0: success, 9000: authorized, other: failed"
 *               message:
 *                 type: string
 *               payType:
 *                 type: string
 *               responseTime:
 *                 type: number
 *               extraData:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       204:
 *         description: Callback processed successfully
 */
router.post('/callback', async (req, res) => {
    try {
        /**
         * resultCode = 0: giao dịch thành công.
         * resultCode = 9000: giao dịch được cấp quyền (authorization) thành công.
         * resultCode <> 0: giao dịch thất bại.
         */
        console.log('📞 MoMo callback received:', req.body);

        const {
            partnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            payType,
            responseTime,
            extraData,
            signature
        } = req.body;

        // Parse extraData to determine booking type
        let parsedExtraData = {};
        try {
            if (extraData) {
                parsedExtraData = JSON.parse(extraData);
            }
        } catch (e) {
            console.warn('Could not parse extraData:', e.message);
        }

        const { bookingType } = parsedExtraData;

        // Handle successful payment
        if (resultCode === 0) {
            console.log(`✅ Payment successful for order ${orderId}, transaction ${transId}`);

            // Handle Amadeus booking payment
            if (bookingType === 'amadeus_flight') {
                const AmadeusBooking = require('../models/AmadeusBooking');
                const User = require('../models/User');

                const booking = await AmadeusBooking.findOne({ momoOrderId: orderId });

                if (booking) {
                    booking.paymentStatus = 'paid';
                    booking.status = 'confirmed';
                    booking.paidAt = new Date();
                    booking.momoTransId = transId;
                    booking.momoResponse = {
                        resultCode,
                        message,
                        transId,
                        amount,
                        responseTime
                    };
                    await booking.save();

                    console.log(`✅ Amadeus booking ${booking.bookingReference} payment confirmed`);

                    // Send confirmation email
                    try {
                        const user = await User.findById(booking.userId);
                        if (user && user.email) {
                            const { sendEmail } = require('../utils/emailService');
                            // TODO: Create proper email template for Amadeus booking
                            console.log(`📧 Sending confirmation email to ${user.email}`);
                        }
                    } catch (emailError) {
                        console.warn('Email sending error:', emailError.message);
                    }
                } else {
                    console.warn('⚠️ Amadeus booking not found for orderId:', orderId);
                }
            }
        } else if (resultCode === 9000) {
            console.log(`⚠️ Payment authorized for order ${orderId}, transaction ${transId}`);
        } else {
            console.log(`❌ Payment failed for order ${orderId}, resultCode: ${resultCode}, message: ${message}`);
        }

        return res.status(204).end();
    } catch (error) {
        console.error('❌ MoMo callback error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/payment/momo/check-status:
 *   post:
 *     summary: Check MoMo transaction status
 *     description: Query MoMo for transaction status
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID to check status for
 *                 example: "MOMO1234567890"
 *     responses:
 *       200:
 *         description: Transaction status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     partnerCode:
 *                       type: string
 *                     orderId:
 *                       type: string
 *                     requestId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     resultCode:
 *                       type: number
 *                     message:
 *                       type: string
 *                     responseTime:
 *                       type: number
 *       400:
 *         description: Missing orderId in request
 *       500:
 *         description: Internal server error
 */
router.post('/check-status', async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'orderId is required'
            });
        }

        const { secretKey, accessKey, queryEndpoint } = momoConfig;

        // Create signature for status check
        const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=MOMO&requestId=${orderId}`;
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        // Create request body for status check
        const requestBody = JSON.stringify({
            partnerCode: 'MOMO',
            requestId: orderId,
            orderId: orderId,
            signature: signature,
            lang: 'vi',
        });

        // Options for axios request to MoMo query endpoint
        const options = {
            method: 'POST',
            url: queryEndpoint,
            headers: {
                'Content-Type': 'application/json',
            },
            data: requestBody,
        };

        const result = await axios(options);

        return res.status(200).json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('MoMo status check error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;