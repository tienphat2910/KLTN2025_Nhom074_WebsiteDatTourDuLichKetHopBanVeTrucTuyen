module.exports = {
    accessKey: 'F8BBA842ECF85',
    secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    orderInfo: 'pay with MoMo',
    partnerCode: 'MOMO',
    redirectUrl: 'http://localhost:3000/payment/success', // Client URL for success redirect
    ipnUrl: 'https://df67ddcbe77b.ngrok-free.app/api/payment/momo/callback', // Server callback URL
    requestType: 'payWithMethod',
    extraData: '',
    orderGroupId: '',
    autoCapture: true,
    lang: 'vi',
    endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
    queryEndpoint: 'https://test-payment.momo.vn/v2/gateway/api/query'
};