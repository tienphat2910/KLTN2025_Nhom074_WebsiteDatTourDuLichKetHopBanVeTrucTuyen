# ZaloPay Payment Integration - LuTrip

## 📋 Tổng quan

Tích hợp thanh toán ZaloPay cho hệ thống đặt tour, hoạt động và vé máy bay LuTrip.

## 🔧 Cấu hình

### 1. Cài đặt dependencies

```bash
cd server
npm install crypto-js moment qs
```

### 2. Cấu hình biến môi trường (.env)

Thêm các biến sau vào file `server/.env`:

```env
# Server URL (quan trọng cho callback)
SERVER_URL=http://localhost:5000

# ZaloPay Configuration
ZALOPAY_APP_ID=2554
ZALOPAY_KEY1=sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn
ZALOPAY_KEY2=trMrHtvjo6myautxDUiAcYsVtaeQ8nhf
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create
ZALOPAY_QUERY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/query
```

**Lưu ý**: Đây là thông tin Sandbox của ZaloPay. Khi triển khai production, cần đăng ký tài khoản ZaloPay Business và thay đổi endpoint:

- Sandbox: `https://sb-openapi.zalopay.vn`
- Production: `https://openapi.zalopay.vn`

### 3. Cấu hình Ngrok (cho callback trong môi trường dev)

ZaloPay cần gọi callback URL từ server của họ. Trong môi trường development, bạn cần dùng Ngrok để expose localhost:

```bash
# Cài đặt ngrok
npm install -g ngrok

# Chạy ngrok
ngrok http 5000
```

Sau đó cập nhật `SERVER_URL` trong .env với URL ngrok:

```env
SERVER_URL=https://your-ngrok-url.ngrok-free.app
```

## 📡 API Endpoints

### 1. Tạo đơn hàng ZaloPay

**POST** `/api/payment/zalopay/create`

**Headers:**

```json
{
  "Authorization": "Bearer <token>"
}
```

**Request Body:**

```json
{
  "bookingId": "6750abcd1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "order_url": "https://sbgateway.zalopay.vn/openapi/pay/...",
    "app_trans_id": "241028_123456",
    "zp_trans_token": "...",
    "bookingId": "6750abcd1234567890"
  },
  "message": "Tạo đơn hàng ZaloPay thành công"
}
```

### 2. Callback từ ZaloPay (Webhook)

**POST** `/api/payment/zalopay/callback`

Endpoint này sẽ được ZaloPay gọi tự động khi thanh toán thành công.

**Request Body:**

```json
{
  "data": "...",
  "mac": "..."
}
```

**Response:**

```json
{
  "return_code": 1,
  "return_message": "success"
}
```

### 3. Kiểm tra trạng thái đơn hàng

**POST** `/api/payment/zalopay/status`

**Headers:**

```json
{
  "Authorization": "Bearer <token>"
}
```

**Request Body:**

```json
{
  "app_trans_id": "241028_123456"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "return_code": 1,
    "return_message": "",
    "is_processing": false,
    "amount": 1500000,
    "zp_trans_id": 240331000000175,
    "statusText": "Thanh toán thành công"
  }
}
```

**Return Codes:**

- `1`: Thanh toán thành công
- `2`: Thanh toán thất bại
- `3`: Đơn hàng chưa thanh toán hoặc đang xử lý

### 4. Xác minh thanh toán cho booking

**GET** `/api/payment/zalopay/verify/:bookingId`

**Headers:**

```json
{
  "Authorization": "Bearer <token>"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "bookingId": "6750abcd1234567890",
    "paymentStatus": "paid",
    "status": "confirmed",
    "zalopayStatus": { ... },
    "statusText": "Thanh toán thành công"
  }
}
```

## 🔄 Luồng thanh toán

### Frontend Flow:

```
1. User chọn "Thanh toán qua ZaloPay"
   ↓
2. Gọi API /api/payment/zalopay/create
   ↓
3. Nhận order_url từ response
   ↓
4. Chuyển hướng user đến order_url (ZaloPay payment page)
   ↓
5. User thanh toán trên ZaloPay app
   ↓
6. ZaloPay redirect về redirecturl (CLIENT_URL/payment/zalopay/result)
   ↓
7. Frontend gọi API /api/payment/zalopay/verify/:bookingId
   ↓
8. Hiển thị kết quả thanh toán
```

### Backend Flow:

```
1. API /create tạo đơn hàng ZaloPay
   ↓
2. Lưu app_trans_id vào Booking
   ↓
3. Trả về order_url cho frontend
   ↓
   [User thanh toán trên ZaloPay]
   ↓
4. ZaloPay gọi callback URL
   ↓
5. Verify MAC signature
   ↓
6. Cập nhật Booking: paymentStatus='paid', status='confirmed'
   ↓
7. Gửi email xác nhận (TODO)
   ↓
8. Emit socket event (TODO)
```

## 💻 Frontend Integration Example

### 1. Tạo Payment Component

```typescript
// components/Payment/ZaloPayButton.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";

interface ZaloPayButtonProps {
  bookingId: string;
}

export function ZaloPayButton({ bookingId }: ZaloPayButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/payment/zalopay/create",
        { bookingId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Redirect to ZaloPay payment page
        window.location.href = response.data.data.order_url;
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Lỗi khi tạo đơn hàng thanh toán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700"
    >
      {loading ? "Đang xử lý..." : "Thanh toán qua ZaloPay"}
    </Button>
  );
}
```

### 2. Tạo Payment Result Page

```typescript
// app/payment/zalopay/result/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

export default function ZaloPayResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading"
  );

  useEffect(() => {
    const verifyPayment = async () => {
      // Get bookingId from URL params or localStorage
      const bookingId =
        searchParams.get("bookingId") ||
        localStorage.getItem("pendingBookingId");

      if (!bookingId) {
        setStatus("failed");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/payment/zalopay/verify/${bookingId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (
          response.data.success &&
          response.data.data.paymentStatus === "paid"
        ) {
          setStatus("success");
          localStorage.removeItem("pendingBookingId");

          setTimeout(() => {
            router.push(`/booking/success/${bookingId}`);
          }, 3000);
        } else {
          setStatus("failed");
        }
      } catch (error) {
        console.error("Verify payment error:", error);
        setStatus("failed");
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="container mx-auto py-20 text-center">
      {status === "loading" && (
        <div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Đang xác minh thanh toán...</h2>
        </div>
      )}

      {status === "success" && (
        <div>
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            Thanh toán thành công!
          </h2>
          <p className="text-gray-600">Đang chuyển hướng...</p>
        </div>
      )}

      {status === "failed" && (
        <div>
          <div className="text-red-600 text-6xl mb-4">✗</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Thanh toán thất bại
          </h2>
          <p className="text-gray-600">Vui lòng thử lại sau</p>
        </div>
      )}
    </div>
  );
}
```

## 🧪 Testing

### Test với Sandbox

ZaloPay cung cấp số thẻ test:

- **Số thẻ**: 4111 1111 1111 1111
- **Tên chủ thẻ**: Bất kỳ
- **Ngày hết hạn**: Bất kỳ (trong tương lai)
- **CVV**: Bất kỳ

### Test Callback với Ngrok

1. Chạy server: `npm run dev`
2. Chạy ngrok: `ngrok http 5000`
3. Cập nhật SERVER_URL trong .env với URL ngrok
4. Restart server
5. Tạo đơn hàng và thanh toán test
6. Check console để xem callback logs

## 📊 Database Schema

Các trường mới được thêm vào Booking model:

```javascript
{
  paymentStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'paid', 'refunded', 'failed']
  },
  paymentMethod: {
    type: String,
    enum: ['momo', 'zalopay', 'bank_transfer', 'cash']
  },
  zalopayTransId: String,      // app_trans_id
  zalopayZpTransId: String,     // zp_trans_id from callback
  zalopayOrderUrl: String,      // Payment URL
  paidAt: Date
}
```

## 🚀 Production Deployment

### 1. Đăng ký ZaloPay Business

- Truy cập: https://docs.zalopay.vn/
- Đăng ký tài khoản merchant
- Nhận app_id, key1, key2 production

### 2. Cập nhật config production

```env
ZALOPAY_APP_ID=<production_app_id>
ZALOPAY_KEY1=<production_key1>
ZALOPAY_KEY2=<production_key2>
ZALOPAY_ENDPOINT=https://openapi.zalopay.vn/v2/create
ZALOPAY_QUERY_ENDPOINT=https://openapi.zalopay.vn/v2/query
SERVER_URL=https://api.lutrip.com
```

### 3. Đăng ký Callback URL với ZaloPay

- Đăng nhập ZaloPay Merchant Portal
- Cấu hình callback URL: `https://api.lutrip.com/api/payment/zalopay/callback`
- Whitelist IP của server

## ⚠️ Lưu ý quan trọng

1. **Bảo mật**:

   - Không commit key1, key2 vào git
   - Sử dụng environment variables
   - Verify MAC signature trong callback

2. **Callback URL**:

   - Phải là HTTPS trong production
   - Phải public accessible (không localhost)
   - Response phải nhanh (<30s)

3. **Error Handling**:

   - ZaloPay sẽ retry callback tối đa 3 lần nếu return_code = 0
   - Luôn return return_code = 1 sau khi xử lý thành công
   - Log tất cả callback để debug

4. **Transaction ID**:
   - Format: `YYMMDD_<random6digits>`
   - Phải unique
   - Dùng để query trạng thái sau này

## 📞 Support

- ZaloPay Docs: https://docs.zalopay.vn/
- ZaloPay Support: support@zalopay.vn
- Hotline: 1900 5555 77

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-28
