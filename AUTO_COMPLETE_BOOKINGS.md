# 🎯 Hệ Thống Tự Động Hoàn Thành Booking

## 📋 Tổng Quan

Hệ thống tự động chuyển trạng thái booking từ **"Đã xác nhận"** sang **"Hoàn thành"** khi đã qua thời gian kết thúc của dịch vụ.

## ⚙️ Cách Hoạt Động

### 1. **Xác Định Thời Gian Kết Thúc**

Hệ thống tự động xác định thời gian kết thúc **bao gồm cả NGÀY và GIỜ** dựa vào loại booking:

- **Tour** 🏖️: Sử dụng `endDate` từ Tour (ngày + giờ kết thúc tour)
- **Flight** ✈️: Sử dụng `arrivalDate` từ FlightSchedule hoặc `arrivalTime` từ Flight
  - Với **round trip**: Lấy giờ đến của **chuyến về** (chuyến bay muộn nhất)
  - Với **one-way**: Lấy giờ đến của chuyến bay đó
  - ⚠️ **Quan trọng**: So sánh cả ngày **VÀ GIỜ PHÚT** để đảm bảo chính xác
- **Activity** 🎯: Sử dụng `endDate` hoặc `date` từ Activity

### 2. **Tự Động Kiểm Tra**

- **Tần suất**: Mỗi 60 phút (có thể tùy chỉnh)
- **Điều kiện**:
  - Trạng thái hiện tại = `confirmed`
  - Thời gian kết thúc (ngày + giờ) < Thời gian hiện tại
  - ⏰ **Kiểm tra chính xác đến phút** cho chuyến bay
- **Hành động**:
  - Cập nhật Booking status → `completed`
  - Cập nhật BookingTour/BookingActivity status → `completed`
  - Gửi notification đến admin qua Socket.IO

### 3. **Chạy Thủ Công**

Admin có thể trigger auto-complete bất cứ lúc nào:

1. Vào trang **Admin > Quản lý Booking**
2. Click button **"Auto-Complete"**
3. Hệ thống sẽ kiểm tra và cập nhật ngay lập tức

## 🔧 Cấu Hình

### Backend Configuration

File: `server/index.js`

```javascript
// Thay đổi tần suất kiểm tra (phút)
scheduleAutoComplete(60); // 60 phút = 1 giờ
```

Các tùy chọn phổ biến:

- `30` - Mỗi 30 phút
- `60` - Mỗi 1 giờ (mặc định)
- `120` - Mỗi 2 giờ
- `1440` - Mỗi ngày

### API Endpoint

**POST** `/api/admin/bookings/auto-complete`

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "message": "Đã kiểm tra 25 bookings, hoàn thành 3 bookings",
  "data": {
    "success": true,
    "totalChecked": 25,
    "completedCount": 3,
    "updates": [
      {
        "bookingId": "673abc123...",
        "endDate": "2025-11-01T10:00:00.000Z",
        "bookingType": "tour"
      }
    ]
  }
}
```

## 📊 Logs

Khi chạy, hệ thống sẽ ghi log chi tiết với thông tin ngày giờ:

```
🔄 Starting auto-complete bookings task...
📋 Found 25 confirmed bookings to check
✅ Booking abc12345 (flight) ended at T6, 01/11/2025, 10:30. Auto-completing...
⏳ Booking def67890 (flight) will end at T2, 05/11/2025, 14:30 (còn 3 ngày)
⏳ Booking ghi11111 (tour) will end at CN, 10/11/2025, 17:00 (còn 8 ngày)
✅ Booking jkl22222 (activity) ended at T5, 01/11/2025, 16:00. Auto-completing...
✅ Auto-complete task completed. Updated 2 bookings to "completed" status.
```

**Chi tiết log:**

- ✅ = Booking đã được auto-complete
- ⏳ = Booking chưa đến thời gian kết thúc
- Hiển thị thời gian còn lại (phút/giờ/ngày)
- Format: Thứ, DD/MM/YYYY, HH:MM

## 🎯 Ví Dụ Thực Tế

### Tour Du Lịch

```
Tour: "Hà Nội - Hạ Long 3N2Đ"
Start Date: 01/11/2025 08:00
End Date: 03/11/2025 17:00
Booking Status: confirmed

→ Sau 17:00:00 ngày 03/11/2025, hệ thống tự động chuyển sang "completed"
⚠️ Nếu hiện tại là 16:59 ngày 03/11/2025 → Vẫn chưa complete
✅ Nếu hiện tại là 17:01 ngày 03/11/2025 → Tự động complete
```

### Chuyến Bay Một Chiều

```
Flight: VN123 SGN → HAN
Departure: 01/11/2025 08:00
Arrival: 01/11/2025 10:00
Booking Status: confirmed

→ Sau 10:00:00 ngày 01/11/2025, hệ thống tự động chuyển sang "completed"
⚠️ Kiểm tra chính xác cả giờ phút, không chỉ ngày
```

### Chuyến Bay Khứ Hồi (Round Trip)

```
Chiều đi: VN123 SGN → HAN
  Departure: 01/11/2025 08:00
  Arrival: 01/11/2025 10:00

Chiều về: VN456 HAN → SGN
  Departure: 05/11/2025 12:30
  Arrival: 05/11/2025 14:30

Booking Status: confirmed

→ Hệ thống lấy thời gian đến của CHUYẾN VỀ (muộn nhất): 14:30 ngày 05/11/2025
→ Sau 14:30:00 ngày 05/11/2025, tự động chuyển sang "completed"
⚠️ KHÔNG complete sau chiều đi (10:00 ngày 01/11) vì còn chuyến về
```

## 🚀 Deployment

### Development

```bash
cd server
npm start
```

Hệ thống sẽ tự động khởi động scheduler và log:

```
✅ Kết nối MongoDB thành công
🌐 Server chạy tại: http://localhost:5000
🔌 Socket.IO đã được khởi tạo
⏰ Auto-complete bookings scheduler đã được khởi động
⏰ Scheduling auto-complete bookings task every 60 minutes
```

### Production

Đảm bảo server chạy liên tục (sử dụng PM2 hoặc systemd):

```bash
# Sử dụng PM2
pm2 start server/index.js --name lutrip-api
pm2 save
```

## 🔍 Testing

### Test Thủ Công

1. Tạo một booking với trạng thái `confirmed`
2. Set `endDate` của tour/activity hoặc `arrivalDate` của flight về quá khứ
3. Click button **"Auto-Complete"** ở admin
4. Kiểm tra booking đã chuyển sang `completed`

### Test Tự Động

File: `server/utils/autoCompleteBookings.js`

Chạy function:

```javascript
const { autoCompleteBookings } = require("./utils/autoCompleteBookings");

// Test
await autoCompleteBookings();
```

## ⚠️ Lưu Ý

1. **Timezone**: Server sử dụng timezone local, đảm bảo cấu hình đúng
2. **Performance**: Với số lượng booking lớn, có thể tối ưu bằng index hoặc batch processing
3. **Notification**: Socket.IO phải được cấu hình đúng để admin nhận real-time updates
4. **Rollback**: Nếu cần hoàn tác, phải update status thủ công qua API hoặc database

## 📱 Frontend Integration

### Admin UI

- Button "Auto-Complete" nằm ở header của trang Quản lý Booking
- Hiển thị toast notification khi hoàn thành
- Tự động reload danh sách booking và stats sau khi update

### User UI

- User sẽ thấy booking status tự động cập nhật
- Nhận email notification (nếu đã cấu hình)

## 🔐 Security

- Chỉ admin có quyền trigger auto-complete
- API endpoint được bảo vệ bởi admin middleware
- Validate input và booking status trước khi update

## 📈 Future Enhancements

- [ ] Email notification cho user khi booking completed
- [ ] Cron job scheduling linh hoạt hơn
- [ ] Dashboard hiển thị thống kê auto-complete
- [ ] Batch processing cho performance tốt hơn
- [ ] Webhook integration cho third-party services
