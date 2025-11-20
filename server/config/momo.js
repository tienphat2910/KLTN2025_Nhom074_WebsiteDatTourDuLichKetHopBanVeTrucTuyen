module.exports = {
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    orderInfo: process.env.MOMO_ORDER_INFO,
    partnerCode: process.env.MOMO_PARTNER_CODE,
    redirectUrl: process.env.MOMO_REDIRECT_URL,
    ipnUrl: process.env.MOMO_IPN_URL,
    requestType: process.env.MOMO_REQUEST_TYPE,
    extraData: process.env.MOMO_EXTRA_DATA,
    orderGroupId: process.env.MOMO_ORDER_GROUP_ID,
    autoCapture: process.env.MOMO_AUTO_CAPTURE === 'true',
    lang: process.env.MOMO_LANG,
    endpoint: process.env.MOMO_ENDPOINT,
    queryEndpoint: process.env.MOMO_QUERY_ENDPOINT
};