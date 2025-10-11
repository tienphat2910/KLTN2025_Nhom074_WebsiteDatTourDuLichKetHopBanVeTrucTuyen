# MoMo Payment Integration - Client Side

## Tổng quan

Tích hợp thanh toán MoMo vào client Next.js cho tính năng đặt tour.

## Luồng thanh toán MoMo

### 1. Chọn MoMo làm phương thức thanh toán

- Người dùng điền thông tin đặt tour
- Chọn "MoMo" làm phương thức thanh toán
- Nhấn "Xác nhận đặt tour"

### 2. Tạo thanh toán MoMo

- Client gọi API `/api/payment/momo` để tạo thanh toán
- Server trả về `payUrl` để chuyển hướng
- Lưu thông tin booking tạm thời vào `localStorage`
- Chuyển hướng người dùng đến trang thanh toán MoMo

### 3. Thanh toán tại MoMo

- Người dùng thực hiện thanh toán trên trang MoMo
- MoMo chuyển hướng về `/payment/success` với kết quả

### 4. Xử lý kết quả thanh toán

- Kiểm tra trạng thái thanh toán với MoMo API
- Nếu thành công: Tạo booking tour và hiển thị thành công
- Nếu thất bại: Hiển thị lỗi và cho phép thử lại

## Files đã thêm/cập nhật

### 1. `src/services/paymentService.ts`

Service xử lý gọi API thanh toán MoMo:

- `createMoMoPayment()`: Tạo thanh toán
- `checkMoMoPaymentStatus()`: Kiểm tra trạng thái
- `redirectToMoMoPayment()`: Chuyển hướng đến MoMo

### 2. `src/app/bookingtour/page.tsx`

Cập nhật logic xử lý thanh toán:

- Import `paymentService`
- Cập nhật `handleSubmit()` để xử lý thanh toán MoMo
- Lưu thông tin booking vào `localStorage` trước khi chuyển hướng

### 3. `src/app/payment/success/page.tsx`

Trang xử lý kết quả thanh toán:

- Nhận parameters từ MoMo redirect
- Kiểm tra trạng thái thanh toán
- Tạo booking nếu thanh toán thành công
- Hiển thị kết quả và các hành động tiếp theo

## Cách sử dụng

### 1. Cài đặt và chạy

```bash
# Đảm bảo server đang chạy trên port 5000
cd server
npm run dev

# Chạy client trên port 3000
cd client
npm run dev
```

### 2. Đặt tour với MoMo

1. Truy cập trang đặt tour: `/bookingtour?tourId=xxx&adults=2`
2. Điền thông tin hành khách
3. Chọn "MoMo" làm phương thức thanh toán
4. Nhấn "Xác nhận đặt tour"
5. Hệ thống sẽ chuyển hướng đến trang thanh toán MoMo
6. Thực hiện thanh toán
7. Được chuyển hướng về `/payment/success` với kết quả

### 3. Xử lý kết quả

- **Thành công**: Booking được tạo, hiển thị thông tin giao dịch
- **Thất bại**: Hiển thị lỗi, cho phép thử lại
- **Lỗi**: Hiển thị lỗi hệ thống, hướng dẫn liên hệ hỗ trợ

## Data Flow

### LocalStorage Data

Trước khi chuyển hướng đến MoMo, hệ thống lưu thông tin booking:

```javascript
{
  "tourId": "tour_id",
  "numAdults": 2,
  "numChildren": 0,
  "numInfants": 0,
  "priceByAge": { "adult": 1000000, "child": 800000, "infant": 0 },
  "subtotal": 2000000,
  "status": "pending",
  "passengers": [...],
  "note": "Ghi chú",
  "paymentMethod": "momo",
  "momoOrderId": "MOMO1698825600123"
}
```

### MoMo Redirect Parameters

Sau khi thanh toán, MoMo chuyển hướng về với parameters:

- `partnerCode`: MOMO
- `orderId`: Mã đơn hàng
- `resultCode`: 0 (thành công), khác 0 (thất bại)
- `message`: Thông báo kết quả
- `transId`: Mã giao dịch MoMo
- `amount`: Số tiền
- `signature`: Chữ ký bảo mật

## Xử lý lỗi

### 1. Lỗi tạo thanh toán

- Hiển thị toast error
- Cho phép người dùng thử lại
- Không chuyển hướng

### 2. Lỗi thanh toán MoMo

- Chuyển hướng về `/payment/success` với `resultCode != 0`
- Hiển thị lỗi và cho phép thử lại đặt tour

### 3. Lỗi tạo booking sau thanh toán thành công

- Thanh toán đã thành công nhưng không tạo được booking
- Hiển thị thông báo đặc biệt yêu cầu liên hệ hỗ trợ
- Cung cấp thông tin giao dịch để tra cứu

## Security

### 1. Validation

- Kiểm tra authentication trước khi thanh toán
- Validate thông tin booking trước khi tạo thanh toán
- Verify orderId khớp với localStorage

### 2. Error Handling

- Không hiển thị thông tin nhạy cảm trong error message
- Log error chi tiết cho debug
- Graceful degradation khi có lỗi

## Testing

### 1. Test Cases

- [ ] Đặt tour thành công với MoMo
- [ ] Thanh toán thất bại
- [ ] Hủy thanh toán ở MoMo
- [ ] Lỗi network khi tạo thanh toán
- [ ] Lỗi tạo booking sau thanh toán thành công
- [ ] Authentication expired trong quá trình thanh toán

### 2. Test Environment

- Sử dụng MoMo test credentials trong `server/config/momo.js`
- Test với các scenario khác nhau của resultCode
- Kiểm tra localStorage handling

## Production Notes

### 1. Environment Configuration

- Cập nhật MoMo endpoints từ test sang production
- Cấu hình domain chính xác cho redirectUrl và ipnUrl
- Sử dụng HTTPS cho tất cả endpoints

### 2. Monitoring

- Log tất cả payment transactions
- Monitor payment success rate
- Alert khi có lỗi payment rate cao

### 3. Backup Plan

- Có phương thức thanh toán backup (chuyển khoản, tiền mặt)
- Hướng dẫn user khi MoMo không khả dụng
- Manual booking process cho trường hợp khẩn cấp
