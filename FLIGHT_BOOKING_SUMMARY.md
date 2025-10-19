# Flight Booking System - Complete Documentation

## 📚 Tổng Quan Hệ Thống

Hệ thống đặt vé máy bay hoàn chỉnh với các tính năng:

1. ✈️ **Dynamic Flight Class Display** - Hiển thị động hạng vé
2. 💰 **Age-Based Pricing** - Giá vé theo độ tuổi
3. 📝 **CCCD Requirement** - Yêu cầu CCCD cho người lớn
4. 💺 **Automatic Seat Management** - Quản lý ghế tự động

---

## 🎯 Business Rules Summary

### Phân Loại Hành Khách

| Loại             | Độ tuổi   | Giá vé | CCCD        | Chiếm ghế |
| ---------------- | --------- | ------ | ----------- | --------- |
| 👨 **Người lớn** | ≥ 12 tuổi | 100%   | ✅ Bắt buộc | ✅ 1 ghế  |
| 👧 **Trẻ em**    | 2-11 tuổi | 90%    | ❌ Không    | ✅ 1 ghế  |
| 👶 **Em bé**     | < 2 tuổi  | 10%    | ❌ Không    | ❌ 0 ghế  |

### Hạng Vé Hỗ Trợ

1. **Economy** - Phổ thông
2. **Premium Economy** - Phổ thông cao cấp
3. **Business** - Thương gia
4. **First Class** - Hạng nhất

---

## 📖 Chi Tiết Các Tính Năng

### 1. Dynamic Flight Class Display

**File:** [FLIGHT_CLASS_DYNAMIC_DISPLAY.md](./FLIGHT_CLASS_DYNAMIC_DISPLAY.md)

**Tính năng:**

- Hiển thị động các hạng vé có sẵn cho mỗi chuyến bay
- Không bắt buộc phải có cả Economy và Business
- Tự động chọn hạng vé đầu tiên
- Validation trước khi đặt vé

**Key Points:**

```typescript
// Frontend tự động load classes từ flight data
flight.classes?.map((flightClass) => {
  // Display each available class
})

// Layout responsive: 1-2 cột tùy số lượng hạng
<div className={`grid gap-4 ${
  flight.classes && flight.classes.length > 1
    ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-1'
}`}>
```

**Benefits:**

- Linh hoạt với bất kỳ số lượng/loại hạng vé
- UI/UX tốt hơn
- Không có hardcode

---

### 2. Age-Based Pricing

**File:** [FLIGHT_AGE_BASED_PRICING.md](./FLIGHT_AGE_BASED_PRICING.md)

**Tính năng:**

- Giá vé khác nhau theo độ tuổi
- Người lớn: 100% giá vé
- Trẻ em: 90% giá vé
- Em bé: 10% giá vé

**Implementation:**

```typescript
// Calculate price with age-based discount
const adultsTotal = adults * baseTicketPrice; // 100%
const childrenTotal = children * (baseTicketPrice * 0.9); // 90%
const infantsTotal = infants * (baseTicketPrice * 0.1); // 10%
const totalFlightPrice = adultsTotal + childrenTotal + infantsTotal;
```

**Example:**

```
Base Price: 1,000,000 đ
- 2 Adults:  2 × 1,000,000 = 2,000,000 đ
- 1 Child:   1 ×   900,000 =   900,000 đ
- 1 Infant:  1 ×   100,000 =   100,000 đ
----------------------------------------
Total:                       3,000,000 đ
```

**Benefits:**

- Phù hợp chuẩn hàng không quốc tế
- Khuyến khích du lịch gia đình
- Minh bạch giá cả

---

### 3. CCCD Requirement

**File:** [FLIGHT_CCCD_REQUIREMENT.md](./FLIGHT_CCCD_REQUIREMENT.md)

**Tính năng:**

- Chỉ người lớn (≥12 tuổi) cần CCCD/CMND
- Trẻ em và em bé không cần CCCD
- Form điều chỉnh theo loại hành khách

**Frontend Validation:**

```typescript
const hasEmptyFields = passengers.some((passenger, index) => {
  const isAdult = index < adults;

  if (isAdult) {
    return !passenger.identityNumber?.trim(); // ✅ Required for adults
  } else {
    return false; // ❌ Not required for children/infants
  }
});
```

**Backend Model:**

```javascript
identityNumber: {
    type: String,
    required: false, // ✅ Optional
    validate: {
        validator: function (v) {
            if (!v) return true; // ✅ Allow empty
            return /^\d{9}$|^\d{12}$/.test(v); // Must be 9 or 12 digits if provided
        }
    }
}
```

**Benefits:**

- Phù hợp thực tế (trẻ em chưa có CCCD)
- Đơn giản hóa form
- Linh hoạt với giấy tờ khác (giấy khai sinh)

---

### 4. Automatic Seat Management

**File:** [FLIGHT_SEAT_MANAGEMENT.md](./FLIGHT_SEAT_MANAGEMENT.md)

**Tính năng:**

- Tự động trừ ghế khi đặt vé
- Tự động hoàn trả ghế khi hủy/xóa booking
- Em bé không chiếm ghế (không trừ)

**Core Function:**

```javascript
const calculateSeatsOccupied = (passengers) => {
  const today = new Date();
  let seatsCount = 0;

  passengers.forEach((passenger) => {
    if (passenger.dateOfBirth) {
      const birthDate = new Date(passenger.dateOfBirth);
      const ageInYears = (today - birthDate) / (365.25 * 24 * 60 * 60 * 1000);

      // Only count passengers ≥ 2 years old
      if (ageInYears >= 2) {
        seatsCount++;
      }
    }
  });

  return seatsCount;
};
```

**Flow - Đặt vé:**

1. Calculate seats needed (adults + children, NOT infants)
2. Check if enough seats available
3. Deduct seats from FlightClass
4. Create booking and passengers
5. Return success with seats deducted count

**Flow - Hủy vé:**

1. Get booking and passengers
2. Calculate seats to return
3. Add seats back to FlightClass
4. Update booking status to 'cancelled'

**Example:**

```
Booking: 2 Adults + 1 Child + 1 Infant
Seats to deduct: 3 (not counting infant)

FlightClass.availableSeats:
Before: 100
After:   97 ✅
```

**Benefits:**

- Quản lý ghế real-time
- Tránh overselling
- Logic chính xác với quy định hàng không

---

## 🗂️ Database Schema

### Core Models

#### 1. Flight

```javascript
{
  flightCode: String,           // "VN123"
  airlineId: ObjectId,          // Ref: Airline
  departureAirportId: String,   // Ref: Airport
  arrivalAirportId: String,     // Ref: Airport
  departureTime: Date,
  arrivalTime: Date,
  durationMinutes: Number,
  basePrice: Number,
  availableSeats: Number,
  status: String                // 'active' | 'inactive' | 'cancelled'
}
```

#### 2. FlightClass

```javascript
{
  flightCode: String,           // "VN123"
  className: String,            // 'Economy' | 'Premium Economy' | 'Business' | 'First Class'
  price: Number,
  baggageAllowance: Number,     // kg
  cabinBaggage: Number,         // kg
  availableSeats: Number,       // ← Auto-managed
  amenities: [String]
}
```

#### 3. BookingFlight

```javascript
{
  bookingId: ObjectId,          // Ref: Booking
  flightId: ObjectId,           // Ref: Flight
  flightCode: String,
  flightClassId: ObjectId,      // Ref: FlightClass
  numTickets: Number,
  pricePerTicket: Number,       // Base price
  totalFlightPrice: Number,     // Age-based calculated total
  status: String,               // 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentMethod: String,        // 'momo' | 'bank_transfer'
  discountCode: String,
  discountAmount: Number
}
```

#### 4. FlightPassenger

```javascript
{
  bookingFlightId: ObjectId,    // Ref: BookingFlight
  fullName: String,             // Required
  identityNumber: String,       // Optional (only for adults)
  dateOfBirth: Date,            // Required
  gender: String,               // Required
  phoneNumber: String,          // Optional
  email: String,                // Optional
  nationality: String,          // Default: 'Vietnam'
  seatNumber: String            // Optional
}
```

---

## 🔄 Complete Booking Flow

### Step 1: User Selects Flight & Class

```
User → Browse Flights → Select Flight → Choose Class (Dynamic)
```

### Step 2: Enter Passenger Info

```
For each passenger:
  - Full Name ✅
  - Gender ✅
  - Date of Birth ✅
  - CCCD (only if adult) ✅/❌
```

### Step 3: Calculate Price

```typescript
// Age-based pricing
Adults:   count × price × 1.0
Children: count × price × 0.9
Infants:  count × price × 0.1
Total = Sum of all
```

### Step 4: Payment

```
User selects: MoMo or Bank Transfer
Apply discount code (optional)
Calculate final total
```

### Step 5: Create Booking (Backend)

```javascript
1. Calculate seats needed (adults + children, NOT infants)
2. Check FlightClass.availableSeats >= seatsNeeded
3. Deduct seats: FlightClass.availableSeats -= seatsNeeded
4. Create Booking record
5. Create BookingFlight record
6. Create FlightPassenger records
7. Return success
```

### Step 6: Payment Confirmation

```
MoMo: Redirect to MoMo payment → Callback → Update status
Bank Transfer: Show bank info → Manual confirmation
```

---

## 📊 Example: Complete Booking

### Input Data

```json
{
  "flightId": "flight_123",
  "flightCode": "VN456",
  "flightClassId": "class_eco_001",
  "passengers": [
    {
      "fullName": "Nguyễn Văn A",
      "dateOfBirth": "1990-01-01",
      "gender": "Nam",
      "identityNumber": "001234567890", // Adult
      "phoneNumber": "0901234567",
      "email": "nguyenvana@example.com"
    },
    {
      "fullName": "Nguyễn Thị B",
      "dateOfBirth": "1992-05-15",
      "gender": "Nữ",
      "identityNumber": "009876543210" // Adult
    },
    {
      "fullName": "Nguyễn Văn C",
      "dateOfBirth": "2018-03-20",
      "gender": "Nam"
      // No identityNumber - Child
    },
    {
      "fullName": "Nguyễn Thị D",
      "dateOfBirth": "2024-08-10",
      "gender": "Nữ"
      // No identityNumber - Infant
    }
  ],
  "paymentMethod": "momo"
}
```

### Calculations

#### 1. Base Price

```
FlightClass.price = 1,500,000 đ
```

#### 2. Age-Based Pricing

```
Adult 1:  1,500,000 × 1.0 = 1,500,000 đ
Adult 2:  1,500,000 × 1.0 = 1,500,000 đ
Child 1:  1,500,000 × 0.9 = 1,350,000 đ
Infant 1: 1,500,000 × 0.1 =   150,000 đ
----------------------------------------
Total:                      4,500,000 đ
```

#### 3. Seat Management

```
Adults:  2 (both ≥ 12 years old)  → Count ✅
Child:   1 (5 years old)          → Count ✅
Infant:  1 (1 year old)           → NOT Count ❌

Seats to deduct: 3

FlightClass.availableSeats:
Before: 150
After:  147 ✅
```

#### 4. CCCD Validation

```
Adult 1: identityNumber = "001234567890" ✅
Adult 2: identityNumber = "009876543210" ✅
Child 1: No identityNumber required     ✅
Infant:  No identityNumber required     ✅

Validation: PASS ✅
```

### Backend Response

```json
{
  "success": true,
  "data": {
    "bookingFlight": {
      "_id": "67123abc",
      "flightCode": "VN456",
      "flightClassId": "class_eco_001",
      "numTickets": 4,
      "pricePerTicket": 1500000,
      "totalFlightPrice": 4500000,
      "status": "pending"
    },
    "passengers": [
      /* 4 passenger records */
    ]
  },
  "message": "Đặt vé thành công. Đã trừ 3 ghế."
}
```

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] calculateSeatsOccupied() với nhiều loại hành khách
- [ ] Age calculation (edge cases: exactly 2 years old)
- [ ] Price calculation với discount
- [ ] CCCD validation (9 và 12 số)

### Integration Tests

- [ ] POST /bookingflights - successful booking
- [ ] POST /bookingflights - not enough seats error
- [ ] PUT /bookingflights/:id - cancel booking
- [ ] DELETE /bookingflights/:id - delete booking
- [ ] Seat deduction và return chính xác

### E2E Tests

- [ ] Complete booking flow: search → select → book → pay
- [ ] Booking với discount code
- [ ] Booking cancellation flow
- [ ] Multiple concurrent bookings (race condition)

### Edge Cases

- [ ] All infants (no seats deducted)
- [ ] Passenger without dateOfBirth
- [ ] Invalid date format
- [ ] FlightClass not found
- [ ] Already cancelled booking
- [ ] Negative available seats

---

## 🚀 Deployment Notes

### Environment Variables

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/lutrip

# MoMo Payment
MOMO_PARTNER_CODE=xxx
MOMO_ACCESS_KEY=xxx
MOMO_SECRET_KEY=xxx
```

### Database Indexes

```javascript
// FlightClass
flightClassSchema.index({ flightCode: 1 });

// BookingFlight
bookingFlightSchema.index({ bookingId: 1 });
bookingFlightSchema.index({ flightId: 1 });
bookingFlightSchema.index({ flightClassId: 1 });

// FlightPassenger
flightPassengerSchema.index({ bookingFlightId: 1 });
```

### Performance Considerations

- Use MongoDB aggregation for reports
- Cache flight classes data
- Implement seat locking for concurrent bookings
- Add Redis for session management

---

## 📝 API Endpoints Summary

### Flights

```
GET    /flights              - List all flights
GET    /flights/:id          - Get flight details with classes
POST   /flights              - Create new flight (admin)
PUT    /flights/:id          - Update flight (admin)
DELETE /flights/:id          - Delete flight (admin)
```

### Flight Classes

```
GET    /flightclasses                    - List all classes
GET    /flightclasses/:id                - Get class details
GET    /flightclasses/flight/:flightCode - Get classes by flight
POST   /flightclasses                    - Create class (admin)
PUT    /flightclasses/:id                - Update class (admin)
DELETE /flightclasses/:id                - Delete class (admin)
```

### Booking Flights

```
POST   /bookingflights         - Create booking (auto deduct seats)
GET    /bookingflights         - List all bookings
GET    /bookingflights/:id     - Get booking details with passengers
PUT    /bookingflights/:id     - Update booking (auto return seats if cancelled)
DELETE /bookingflights/:id     - Delete booking (auto return seats)
```

### Passengers

```
GET    /bookingflights/:id/passengers - Get passengers of a booking
```

---

## 🎓 Key Learnings

### 1. Business Logic Separation

- Age calculation → Helper function
- Seat calculation → Helper function
- Price calculation → Service layer

### 2. Data Integrity

- Atomic operations for seat updates
- Transaction-like behavior
- Proper error handling

### 3. User Experience

- Clear error messages
- Real-time seat availability
- Transparent pricing breakdown

### 4. Scalability

- Indexed queries
- Efficient data structures
- Reusable components

---

## 📚 Documentation Files

1. **FLIGHT_CLASS_DYNAMIC_DISPLAY.md** - Dynamic class selection
2. **FLIGHT_AGE_BASED_PRICING.md** - Age-based pricing system
3. **FLIGHT_CCCD_REQUIREMENT.md** - CCCD validation rules
4. **FLIGHT_SEAT_MANAGEMENT.md** - Automatic seat management
5. **FLIGHT_BOOKING_SUMMARY.md** (This file) - Complete system overview

---

## 🤝 Contributing

### Code Style

- Use meaningful variable names
- Add comments for complex logic
- Follow existing patterns

### Git Workflow

```bash
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

### Pull Request Template

```markdown
## What

Brief description

## Why

Business reason

## How

Technical implementation

## Testing

Test cases covered
```

---

**Last Updated:** October 19, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Project:** LuTrip - Flight Booking System
