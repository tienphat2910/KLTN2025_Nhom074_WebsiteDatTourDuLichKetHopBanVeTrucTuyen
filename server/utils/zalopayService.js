const axios = require('axios');
const CryptoJS = require('crypto-js');
const moment = require('moment');
const qs = require('qs');
const zalopayConfig = require('../config/zalopay');

/**
 * Create ZaloPay payment order
 * @param {Object} orderData - Order information
 * @param {Number} orderData.amount - Payment amount
 * @param {String} orderData.description - Order description
 * @param {String} orderData.userId - User ID
 * @param {String} orderData.extraData - Extra data (optional)
 * @returns {Object} ZaloPay order creation result
 */
const createZaloPayOrder = async (orderData) => {
    try {
        const { amount, description, userId, extraData } = orderData;

        // Generate unique transaction ID
        const transID = Math.floor(Math.random() * 1000000);
        const app_trans_id = `${moment().format('YYMMDD')}_${transID}`;

        // Embed data - will be returned in callback
        const embed_data = {
            redirecturl: `${process.env.CLIENT_URL}/payment/success`,
            userId: userId,
            extraData: extraData || ''
        };

        const items = [{
            itemid: app_trans_id,
            itemname: description,
            itemprice: amount,
            itemquantity: 1
        }];

        const order = {
            app_id: zalopayConfig.app_id,
            app_trans_id: app_trans_id,
            app_user: userId || 'user_default',
            app_time: Date.now(),
            item: JSON.stringify(items),
            embed_data: JSON.stringify(embed_data),
            amount: amount,
            callback_url: `${process.env.SERVER_URL}/api/payment/zalopay/callback`,
            description: description || `LuTrip - Thanh toán đơn hàng`,
            bank_code: '',
        };

        // Generate MAC
        const data =
            zalopayConfig.app_id + '|' +
            order.app_trans_id + '|' +
            order.app_user + '|' +
            order.amount + '|' +
            order.app_time + '|' +
            order.embed_data + '|' +
            order.item;

        order.mac = CryptoJS.HmacSHA256(data, zalopayConfig.key1).toString();

        // Call ZaloPay API
        const result = await axios.post(zalopayConfig.endpoint, null, {
            params: order,
            timeout: 15000
        });

        console.log('✅ ZaloPay order created:', {
            app_trans_id,
            amount,
            return_code: result.data.return_code
        });

        return {
            success: result.data.return_code === 1,
            data: {
                ...result.data,
                app_trans_id,
                amount
            },
            message: result.data.return_message || 'Tạo đơn hàng ZaloPay thành công'
        };
    } catch (error) {
        console.error('❌ ZaloPay create order error:', error.message);
        return {
            success: false,
            message: error.response?.data?.return_message || 'Lỗi khi tạo đơn hàng ZaloPay',
            error: error.message
        };
    }
};

/**
 * Verify ZaloPay callback
 * @param {Object} callbackData - Callback data from ZaloPay
 * @returns {Object} Verification result
 */
const verifyZaloPayCallback = (callbackData) => {
    try {
        const { data: dataStr, mac: reqMac } = callbackData;

        // Calculate MAC
        const mac = CryptoJS.HmacSHA256(dataStr, zalopayConfig.key2).toString();

        console.log('🔐 ZaloPay callback verification:', {
            reqMac,
            calculatedMac: mac,
            isValid: reqMac === mac
        });

        if (reqMac !== mac) {
            return {
                return_code: -1,
                return_message: 'mac not equal',
                isValid: false
            };
        }

        // Parse callback data
        const dataJson = JSON.parse(dataStr);
        console.log('✅ ZaloPay callback data:', dataJson);

        return {
            return_code: 1,
            return_message: 'success',
            isValid: true,
            data: dataJson
        };
    } catch (error) {
        console.error('❌ ZaloPay callback verification error:', error.message);
        return {
            return_code: 0,
            return_message: error.message,
            isValid: false
        };
    }
};

/**
 * Query ZaloPay order status
 * @param {String} app_trans_id - ZaloPay transaction ID
 * @returns {Object} Order status
 */
const queryZaloPayOrderStatus = async (app_trans_id) => {
    try {
        const postData = {
            app_id: zalopayConfig.app_id,
            app_trans_id: app_trans_id,
        };

        // Generate MAC
        const data = postData.app_id + '|' + postData.app_trans_id + '|' + zalopayConfig.key1;
        postData.mac = CryptoJS.HmacSHA256(data, zalopayConfig.key1).toString();

        const postConfig = {
            method: 'post',
            url: zalopayConfig.query_endpoint,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: qs.stringify(postData),
            timeout: 15000
        };

        const result = await axios(postConfig);

        console.log('📊 ZaloPay order status:', {
            app_trans_id,
            return_code: result.data.return_code,
            amount: result.data.amount
        });

        /**
         * return_code:
         * 1: Thành công
         * 2: Thất bại
         * 3: Đơn hàng chưa thanh toán hoặc giao dịch đang xử lý
         */
        return {
            success: result.data.return_code === 1,
            data: result.data,
            isPending: result.data.return_code === 3,
            isFailed: result.data.return_code === 2,
            message: result.data.return_message || 'Truy vấn thành công'
        };
    } catch (error) {
        console.error('❌ ZaloPay query order error:', error.message);
        return {
            success: false,
            message: error.response?.data?.return_message || 'Lỗi khi truy vấn đơn hàng',
            error: error.message
        };
    }
};

/**
 * Get payment status text in Vietnamese
 * @param {Number} return_code - ZaloPay return code
 * @returns {String} Status text
 */
const getPaymentStatusText = (return_code) => {
    const statusMap = {
        1: 'Thanh toán thành công',
        2: 'Thanh toán thất bại',
        3: 'Đơn hàng chưa thanh toán hoặc đang xử lý'
    };
    return statusMap[return_code] || 'Trạng thái không xác định';
};

module.exports = {
    createZaloPayOrder,
    verifyZaloPayCallback,
    queryZaloPayOrderStatus,
    getPaymentStatusText
};
