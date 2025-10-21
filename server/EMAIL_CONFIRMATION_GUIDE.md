# Hướng dẫn Email Xác nhận Booking

## Tổng quan

Hệ thống đã được tích hợp tính năng gửi email xác nhận tự động khi khách hàng đặt tour, activity hoặc flight thành công. Email sẽ hiển thị đầy đủ chi tiết booking giống như modal trên giao diện.

## Các loại Email

### 1. Email xác nhận đặt Tour

- **Subject**: `✅ Xác nhận đặt tour #[BOOKING_ID] - LuTrip`
- **Nội dung**:
  - Thông tin tour (tên, địa điểm, thời gian, hướng dẫn viên)
  - Thông tin khách hàng (họ tên, email, số điện thoại)
  - Danh sách người tham gia (người lớn, trẻ em)
  - Chi tiết giá và tổng tiền
  - Phương thức thanh toán
  - Ghi chú đặc biệt

### 2. Email xác nhận đặt Activity

- **Subject**: `✅ Xác nhận đặt hoạt động #[BOOKING_ID] - LuTrip`
- **Nội dung**:
  - Thông tin hoạt động (tên, địa điểm, ngày tham gia)
  - Thông tin khách hàng
  - Số lượng vé (người lớn, trẻ em, người cao tuổi, em bé)
  - Chi tiết giá và tổng tiền
  - Phương thức thanh toán

### 3. Email xác nhận đặt Flight

- **Subject**: `✈️ Xác nhận đặt vé máy bay #[BOOKING_ID] - LuTrip`
- **Nội dung**:
  - Thông tin chuyến bay (số hiệu, hãng bay, hạng vé)
  - Tuyến bay (điểm đi - điểm đến với thời gian)
  - Thông tin khách hàng
  - Danh sách hành khách (họ tên, ngày sinh, giới tính, hộ chiếu, số ghế)
  - Chi tiết giá và tổng tiền
  - Phương thức thanh toán

## Cấu hình Email

### Biến môi trường (.env)

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Client URL for email links
CLIENT_URL=http://localhost:3000
```

### Cách lấy App Password cho Gmail:

1. Đăng nhập Gmail
2. Vào **Google Account** > **Security**
3. Bật **2-Step Verification**
4. Vào **App passwords**
5. Chọn **Mail** và thiết bị của bạn
6. Copy mật khẩu 16 ký tự và dán vào `EMAIL_PASS`

## Flow hoạt động

### Tour Booking

```
1. User đặt tour → POST /api/bookingtours
2. Tạo BookingTour trong database
3. Giảm số ghế available
4. Lấy thông tin booking và user
5. Gửi email xác nhận → sendTourBookingEmail()
6. Return success response
```

### Activity Booking

```
1. User đặt activity → POST /api/bookingactivities
2. Tạo BookingActivity trong database
3. Tính toán giá và subtotal
4. Lấy thông tin booking và user
5. Gửi email xác nhận → sendActivityBookingEmail()
6. Return success response
```

### Flight Booking

```
1. User đặt vé bay → POST /api/bookingflights
2. Tạo BookingFlight và FlightPassenger trong database
3. Giảm số ghế available trong FlightClass
4. Lấy thông tin booking và user
5. Gửi email xác nhận → sendFlightBookingEmail()
6. Return success response
```

## Template Email

### Cấu trúc HTML Email

- **Header**: Logo LuTrip + gradient background
- **Success Icon**: Biểu tượng xác nhận màu xanh
- **Booking ID Box**: Mã booking và trạng thái
- **Info Sections**:
  - Thông tin sản phẩm (tour/activity/flight)
  - Thông tin khách hàng
  - Chi tiết người tham gia/hành khách
  - Thông tin thanh toán
- **Total Price**: Tổng tiền nổi bật
- **Important Notes**: Lưu ý quan trọng
- **CTA Button**: Link "Xem chi tiết đơn hàng"
- **Footer**: Copyright và links

### Responsive Design

Email được thiết kế responsive với:

- Desktop: 650px width
- Mobile: 100% width với padding adjusted
- Flexbox layout cho mobile

## Functions trong emailService.js

### Helper Functions

```javascript
// Format tiền tệ
formatCurrency(amount);
// Output: "1.000.000 ₫"

// Format ngày giờ đầy đủ
formatDate(dateString);
// Output: "21/10/2025, 14:30"

// Format chỉ ngày
formatDateOnly(dateString);
// Output: "21/10/2025"
```

### Main Functions

```javascript
// Gửi email xác nhận đặt tour
sendTourBookingEmail(userEmail, bookingData);

// Gửi email xác nhận đặt activity
sendActivityBookingEmail(userEmail, bookingData);

// Gửi email xác nhận đặt flight
sendFlightBookingEmail(userEmail, bookingData);
```

### BookingData Structure

#### Tour Booking Data

```javascript
{
  booking: {
    _id: "bookingId",
    totalPrice: 5000000,
    status: "pending",
    createdAt: "2025-10-21T..."
  },
  tourBooking: {
    tourId: {
      name: "Tour Đà Lạt 3N2Đ",
      destination: { name: "Đà Lạt" },
      duration: "3 ngày 2 đêm",
      tourGuide: "Nguyễn Văn A"
    },
    numAdults: 2,
    numChildren: 1,
    pricePerAdult: 2000000,
    pricePerChild: 1000000,
    departureDate: "2025-11-01",
    passengers: [...],
    paymentMethod: "momo",
    note: "..."
  },
  user: {
    fullName: "Nguyễn Văn B",
    email: "user@example.com",
    phone: "0123456789"
  }
}
```

#### Activity Booking Data

```javascript
{
  booking: { ... },
  activityBooking: {
    activityId: {
      name: "Vé Vinpearl Land",
      destination: { name: "Nha Trang" },
      location: { address: "..." }
    },
    numAdults: 2,
    numChildren: 1,
    numSeniors: 0,
    numBabies: 0,
    price: {...},
    subtotal: 1500000,
    scheduledDate: "2025-11-01",
    paymentMethod: "momo"
  },
  user: { ... }
}
```

#### Flight Booking Data

```javascript
{
  booking: { ... },
  flightBooking: {
    flightId: {
      flightCode: "VN123",
      airline: { name: "Vietnam Airlines" },
      departureAirport: { code: "SGN", city: "TP.HCM" },
      arrivalAirport: { code: "HAN", city: "Hà Nội" },
      departureTime: "2025-11-01T08:00",
      arrivalTime: "2025-11-01T10:00",
      duration: "2h",
      aircraft: "Airbus A321"
    },
    flightClassId: { name: "Economy" },
    numTickets: 2,
    pricePerTicket: 1500000,
    totalFlightPrice: 3000000,
    discountAmount: 0,
    passengers: [
      {
        fullName: "Nguyễn Văn A",
        dateOfBirth: "1990-01-01",
        gender: "male",
        passportNumber: "A123456",
        seatNumber: "12A"
      }
    ],
    paymentMethod: "momo"
  },
  user: { ... }
}
```

## Error Handling

Email sending sử dụng try-catch riêng biệt:

- Nếu gửi email thất bại → Log error nhưng KHÔNG fail booking
- Booking vẫn được tạo thành công
- User vẫn nhận được response success

```javascript
try {
  // Send email
  await sendTourBookingEmail(...)
  console.log('✅ Email sent')
} catch (emailError) {
  console.error('❌ Email failed:', emailError)
  // Don't throw - booking still succeeds
}
```

## Testing

### Test gửi email Tour:

```bash
POST /api/bookingtours
Body: {
  "bookingId": "...",
  "tourId": "...",
  "numAdults": 2,
  "numChildren": 1,
  ...
}
Headers: {
  "Authorization": "Bearer <token>"
}
```

### Test gửi email Activity:

```bash
POST /api/bookingactivities
Body: {
  "bookingId": "...",
  "activityId": "...",
  "numAdults": 2,
  ...
}
Headers: {
  "Authorization": "Bearer <token>"
}
```

### Test gửi email Flight:

```bash
POST /api/bookingflights
Body: {
  "bookingId": "...",
  "flightId": "...",
  "flightClassId": "...",
  "passengers": [...],
  ...
}
Headers: {
  "Authorization": "Bearer <token>"
}
```

## Logs

Console sẽ hiển thị:

```
✅ Tour booking created for 3 people. Tour: 67...
✅ Tour booking confirmation email sent to: user@example.com
```

Hoặc nếu lỗi:

```
❌ Email sending failed: Error: Invalid credentials
```

## Customization

### Thay đổi màu sắc:

- **Tour**: Gradient tím `#667eea` → `#764ba2`
- **Activity**: Gradient cam `#f97316` → `#ea580c`
- **Flight**: Gradient xanh lá `#10b981` → `#059669`

### Thêm nội dung:

Chỉnh sửa trong `server/utils/emailService.js`:

- Tìm function tương ứng (sendTourBookingEmail, etc.)
- Thêm HTML vào biến `htmlContent`
- Sử dụng template literals để insert data

### Thay đổi logo:

Update URL trong header:

```html
<img src="YOUR_LOGO_URL" alt="LuTrip Logo" />
```

## Support

Nếu có vấn đề:

1. Check `.env` có đúng EMAIL_USER và EMAIL_PASS
2. Check Gmail có bật 2-Step Verification và App Password
3. Check console logs để xem error message
4. Verify booking vẫn được tạo thành công dù email fail

## Future Enhancements

- [ ] Email template cho status updates (confirmed, cancelled)
- [ ] Multi-language support
- [ ] PDF attachment cho booking confirmation
- [ ] SMS notification integration
- [ ] Email queue với retry mechanism
- [ ] Admin notification emails
