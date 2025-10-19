# ⚡ Flight Booking - Quick Start Guide

## 🎯 Tổng Quan Nhanh

Hệ thống đặt vé máy bay với 4 tính năng chính:

1. **Dynamic Class Display** - Hiển thị hạng vé linh hoạt
2. **Age-Based Pricing** - Giá vé theo độ tuổi (100% / 90% / 10%)
3. **Smart CCCD Validation** - Chỉ người lớn cần CCCD
4. **Auto Seat Management** - Tự động trừ/hoàn ghế (em bé không chiếm ghế)

---

## 🚀 Cài Đặt Nhanh (5 phút)

### 1. Clone & Install

```bash
# Clone repo
git clone https://github.com/tienphat2910/LuTrip.git
cd LuTrip

# Install backend
cd server
npm install

# Install frontend
cd ../client
npm install
```

### 2. Setup Environment

```bash
# Server .env
cd server
cp .env.example .env
# Edit .env với MongoDB URI, Cloudinary, Firebase...

# Client .env.local
cd ../client
cp .env.local.example .env.local
# Edit với API_BASE_URL
```

### 3. Run

```bash
# Terminal 1 - Backend
cd server
npm run dev
# → http://localhost:5000

# Terminal 2 - Frontend
cd client
npm run dev
# → http://localhost:3000
```

---

## 📝 Quy Tắc Nhanh

### Giá Vé

```
👨 Người lớn (≥12 tuổi): 100% giá vé
👧 Trẻ em (2-11 tuổi):    90% giá vé
👶 Em bé (<2 tuổi):       10% giá vé
```

### CCCD

```
✅ Người lớn: BẮT BUỘC (9 hoặc 12 số)
❌ Trẻ em:    KHÔNG CẦN
❌ Em bé:     KHÔNG CẦN
```

### Ghế

```
✅ Người lớn: 1 ghế
✅ Trẻ em:    1 ghế
❌ Em bé:     0 ghế (ngồi cùng người lớn)
```

---

## 💻 Code Snippets

### Frontend - Tính Giá

```typescript
// Age-based pricing
const basePrice = selectedClass.price;

const adultsTotal = adults * basePrice; // 100%
const childrenTotal = children * basePrice * 0.9; // 90%
const infantsTotal = infants * basePrice * 0.1; // 10%

const total = adultsTotal + childrenTotal + infantsTotal;
```

### Backend - Tính Ghế

```javascript
// Calculate seats (NOT counting infants)
const calculateSeatsOccupied = (passengers) => {
  return passengers.filter((p) => {
    const age =
      (new Date() - new Date(p.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 2; // Only adults and children
  }).length;
};
```

### Validation - CCCD

```typescript
// Only validate CCCD for adults
const isAdult = passengerIndex < adultsCount;

if (isAdult && !passenger.identityNumber?.trim()) {
  return "Người lớn phải có CCCD!";
}
```

---

## 📊 Ví Dụ Nhanh

### Booking: 2 Adults + 1 Child + 1 Infant

**Input:**

```json
{
  "adults": 2,
  "children": 1,
  "infants": 1,
  "basePrice": 1000000
}
```

**Calculations:**

```
Giá vé:
- 2 Adults:  2 × 1,000,000 = 2,000,000 đ
- 1 Child:   1 ×   900,000 =   900,000 đ
- 1 Infant:  1 ×   100,000 =   100,000 đ
Total:                        3,000,000 đ

Số ghế:
- 2 Adults:  ✅ Count
- 1 Child:   ✅ Count
- 1 Infant:  ❌ NOT Count
Seats deducted: 3

CCCD Required:
- 2 Adults:  ✅ Required
- 1 Child:   ❌ Not required
- 1 Infant:  ❌ Not required
```

---

## 🔧 API Endpoints

### Create Booking

```http
POST /bookingflights
Content-Type: application/json

{
  "flightId": "flight_123",
  "flightClassId": "class_456",
  "passengers": [
    {
      "fullName": "Nguyễn Văn A",
      "dateOfBirth": "1990-01-01",
      "gender": "Nam",
      "identityNumber": "001234567890" // Adult
    },
    {
      "fullName": "Nguyễn Thị B",
      "dateOfBirth": "2018-05-15",
      "gender": "Nữ"
      // No CCCD - Child
    }
  ],
  "paymentMethod": "momo"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "bookingFlight": { ... },
    "passengers": [ ... ]
  },
  "message": "Đặt vé thành công. Đã trừ 2 ghế."
}
```

### Cancel Booking

```http
PUT /bookingflights/:id
Content-Type: application/json

{
  "status": "cancelled"
}
```

**Effect:** Tự động hoàn trả ghế vào FlightClass

---

## 🧪 Test Nhanh

### Test 1: All Infants (No seats deducted)

```javascript
passengers = [
  { dateOfBirth: "1990-01-01" }, // Adult
  { dateOfBirth: "2024-06-01" }, // Infant
  { dateOfBirth: "2024-08-15" } // Infant
];
// Expected: seatsOccupied = 1 ✅
```

### Test 2: CCCD Validation

```javascript
// Adult without CCCD
passengers = [
  {
    fullName: "A",
    dateOfBirth: "1990-01-01",
    identityNumber: "" // ❌ Empty
  }
];
// Expected: Validation error ❌
```

### Test 3: Price Calculation

```javascript
basePrice = 1000000;
adults = 1;
children = 1;
infants = 1;

// Expected:
// 1,000,000 + 900,000 + 100,000 = 2,000,000 ✅
```

---

## 🐛 Troubleshooting

### Lỗi: "Không đủ ghế trống"

```
Nguyên nhân: FlightClass.availableSeats < seats needed
Giải pháp:
1. Check FlightClass.availableSeats trong DB
2. Kiểm tra có booking khác đang hold ghế không
3. Refresh lại số ghế available
```

### Lỗi: "CCCD/CMND phải có 9 hoặc 12 số"

```
Nguyên nhân: identityNumber không match format
Giải pháp:
1. Check regex: /^\d{9}$|^\d{12}$/
2. Loại bỏ spaces và special characters
3. Đảm bảo chỉ có digits
```

### Lỗi: Giá vé không đúng

```
Nguyên nhân: Logic tính giá sai
Giải pháp:
1. Check age calculation
2. Verify price multipliers (1.0, 0.9, 0.1)
3. Log intermediate values để debug
```

---

## 📚 Tài Liệu Đầy Đủ

Để hiểu sâu hơn, đọc:

- **[FLIGHT_DOCUMENTATION_INDEX.md](./FLIGHT_DOCUMENTATION_INDEX.md)** - Index tất cả docs
- **[FLIGHT_BOOKING_SUMMARY.md](./FLIGHT_BOOKING_SUMMARY.md)** - Tổng quan hệ thống

---

## ✅ Checklist Triển Khai

### Backend

- [ ] MongoDB connected
- [ ] Models đã tạo (Flight, FlightClass, BookingFlight, FlightPassenger)
- [ ] Routes đã setup (bookingflights.js)
- [ ] Helper function calculateSeatsOccupied() working
- [ ] Seed data có sẵn

### Frontend

- [ ] Flight detail page hiển thị classes
- [ ] Booking form có conditional CCCD field
- [ ] Price calculation hiển thị breakdown
- [ ] Passenger count (adults/children/infants) working
- [ ] Payment integration working

### Testing

- [ ] Unit tests cho calculateSeatsOccupied()
- [ ] Integration tests cho booking flow
- [ ] E2E test user journey
- [ ] Test với edge cases (all infants, no CCCD, etc.)

---

## 🎓 Next Steps

1. **Đọc [FLIGHT_DOCUMENTATION_INDEX.md](./FLIGHT_DOCUMENTATION_INDEX.md)**
2. **Chạy project locally**
3. **Test với data mẫu**
4. **Đọc từng documentation file chi tiết**
5. **Implement additional features**

---

## 💡 Pro Tips

### 1. Age Calculation

```javascript
// Use 365.25 để account cho leap years
const ageInYears = (today - birthDate) / (365.25 * 24 * 60 * 60 * 1000);
```

### 2. Seat Validation

```javascript
// Always check seats BEFORE creating booking
if (flightClass.availableSeats < seatsNeeded) {
  return error; // Don't create booking
}
```

### 3. CCCD Format

```javascript
// Strip whitespace before validation
const cleaned = identityNumber.replace(/\s/g, "");
const isValid = /^\d{9}$|^\d{12}$/.test(cleaned);
```

### 4. Price Display

```javascript
// Always show breakdown for transparency
<div>
  <p>Người lớn: {adultsTotal.toLocaleString("vi-VN")} đ</p>
  <p>Trẻ em (90%): {childrenTotal.toLocaleString("vi-VN")} đ</p>
  <p>Em bé (10%): {infantsTotal.toLocaleString("vi-VN")} đ</p>
  <hr />
  <p>
    <strong>Tổng: {total.toLocaleString("vi-VN")} đ</strong>
  </p>
</div>
```

---

## 🎯 Common Scenarios

### Scenario 1: Family with young children

```
2 Adults (30, 32 years) + 1 Child (5 years) + 1 Infant (1 year)
→ Price: 100% + 100% + 90% + 10% = 300% base
→ Seats: 3 (not counting infant)
→ CCCD: 2 required (adults only)
```

### Scenario 2: Business travelers

```
3 Adults (all 25+ years)
→ Price: 100% + 100% + 100% = 300% base
→ Seats: 3
→ CCCD: 3 required (all adults)
```

### Scenario 3: Parent with infant only

```
1 Adult (28 years) + 1 Infant (6 months)
→ Price: 100% + 10% = 110% base
→ Seats: 1 (infant doesn't occupy seat)
→ CCCD: 1 required (adult only)
```

---

**🚀 Ready to go! Start booking flights now!**

---

**Last Updated:** October 19, 2025  
**Version:** 1.0.0  
**For Full Documentation:** See [FLIGHT_DOCUMENTATION_INDEX.md](./FLIGHT_DOCUMENTATION_INDEX.md)
