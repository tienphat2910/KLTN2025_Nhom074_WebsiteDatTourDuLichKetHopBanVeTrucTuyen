# MoMo Payment Integration

## Tổng quan

Tích hợp thanh toán MoMo vào hệ thống LuTrip với 3 API chính:

- Tạo thanh toán
- Xử lý callback từ MoMo
- Kiểm tra trạng thái giao dịch

## Cài đặt

1. Cài đặt dependencies:

```bash
npm install axios
```

2. Cấu hình MoMo trong `config/momo.js`:

- `accessKey`: Khóa truy cập từ MoMo
- `secretKey`: Khóa bí mật từ MoMo
- `redirectUrl`: URL chuyển hướng sau khi thanh toán thành công
- `ipnUrl`: URL callback từ MoMo (cần domain public hoặc ngrok)

## API Endpoints

### 1. Tạo thanh toán MoMo

**POST** `/api/payment/momo`

**Request Body:**

```json
{
  "amount": 100000,
  "orderInfo": "Thanh toán tour du lịch Đà Lạt",
  "extraData": ""
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "partnerCode": "MOMO",
    "orderId": "MOMO1698825600123",
    "requestId": "MOMO1698825600123",
    "amount": 100000,
    "responseTime": 1698825600000,
    "message": "Thành công.",
    "resultCode": 0,
    "payUrl": "https://test-payment.momo.vn/...",
    "deeplink": "momo://...",
    "qrCodeUrl": "https://test-payment.momo.vn/..."
  }
}
```

### 2. Callback từ MoMo

**POST** `/api/payment/momo/callback`

Endpoint này sẽ được MoMo gọi tự động sau khi người dùng thanh toán.

**Callback Data:**

```json
{
  "partnerCode": "MOMO",
  "orderId": "MOMO1698825600123",
  "requestId": "MOMO1698825600123",
  "amount": 100000,
  "orderInfo": "Thanh toán tour du lịch",
  "orderType": "momo_wallet",
  "transId": 4014083433,
  "resultCode": 0,
  "message": "Thành công.",
  "payType": "qr",
  "responseTime": 1698825811069,
  "extraData": "",
  "signature": "..."
}
```

**Result Codes:**

- `0`: Giao dịch thành công
- `9000`: Giao dịch được cấp quyền thành công
- Khác `0`: Giao dịch thất bại

### 3. Kiểm tra trạng thái giao dịch

**POST** `/api/payment/momo/check-status`

**Request Body:**

```json
{
  "orderId": "MOMO1698825600123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "partnerCode": "MOMO",
    "orderId": "MOMO1698825600123",
    "requestId": "MOMO1698825600123",
    "amount": 100000,
    "resultCode": 0,
    "message": "Thành công.",
    "responseTime": 1698825600000
  }
}
```

## Cách sử dụng

### 1. Tạo thanh toán từ Frontend

```javascript
const createPayment = async (amount, orderInfo) => {
  try {
    const response = await fetch("/api/payment/momo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amount,
        orderInfo: orderInfo
      })
    });

    const result = await response.json();

    if (result.success) {
      // Chuyển hướng người dùng đến payUrl để thanh toán
      window.location.href = result.data.payUrl;
    }
  } catch (error) {
    console.error("Payment error:", error);
  }
};
```

### 2. Xử lý kết quả thanh toán

Sau khi thanh toán, người dùng sẽ được chuyển hướng về `redirectUrl` được cấu hình trong `config/momo.js`.

### 3. Kiểm tra trạng thái giao dịch

```javascript
const checkPaymentStatus = async (orderId) => {
  try {
    const response = await fetch("/api/payment/momo/check-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        orderId: orderId
      })
    });

    const result = await response.json();

    if (result.success) {
      const { resultCode, message } = result.data;

      if (resultCode === 0) {
        console.log("Thanh toán thành công");
      } else {
        console.log("Thanh toán thất bại:", message);
      }
    }
  } catch (error) {
    console.error("Status check error:", error);
  }
};
```

## Lưu ý quan trọng

1. **IPN URL**: Để nhận callback từ MoMo, `ipnUrl` phải là domain public. Trong môi trường development, sử dụng ngrok:

   ```bash
   ngrok http 5000
   ```

   Sau đó cập nhật `ipnUrl` trong `config/momo.js`

2. **Bảo mật**:

   - Luôn verify signature trong callback để đảm bảo request từ MoMo
   - Không lưu `secretKey` trong code, sử dụng biến môi trường

3. **Test Environment**:

   - Code hiện tại sử dụng MoMo test environment
   - Để production, cần thay đổi endpoints trong `config/momo.js`

4. **Database Integration**:
   - Cần tích hợp với database để lưu trạng thái đơn hàng
   - Cập nhật trạng thái đơn hàng trong callback handler

## API Documentation

Xem chi tiết API tại: `http://localhost:5000/api-docs` sau khi chạy server.
