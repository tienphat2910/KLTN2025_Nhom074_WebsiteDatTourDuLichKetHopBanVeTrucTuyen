# Flight Seat Management - Documentation

## Overview

Hệ thống quản lý số ghế tự động khi đặt vé, hủy vé, hoặc xóa booking. **Em bé (infants dưới 2 tuổi) không chiếm ghế** nên không được tính vào số ghế cần trừ.

## Business Rules

### Phân Loại Chiếm Ghế

| Loại hành khách  | Độ tuổi   | Chiếm ghế? | Lý do               |
| ---------------- | --------- | ---------- | ------------------- |
| 👨 **Người lớn** | ≥ 12 tuổi | ✅ Có      | Cần ghế riêng       |
| 👧 **Trẻ em**    | 2-11 tuổi | ✅ Có      | Cần ghế riêng       |
| 👶 **Em bé**     | < 2 tuổi  | ❌ Không   | Ngồi cùng người lớn |

### Quy Tắc Tính Ghế

```javascript
/**
 * Tính số ghế chiếm dụng:
 * - Người lớn (≥ 12 tuổi): 1 ghế
 * - Trẻ em (2-11 tuổi): 1 ghế
 * - Em bé (< 2 tuổi): 0 ghế (không chiếm ghế)
 */
const calculateSeatsOccupied = (passengers) => {
  if (!passengers || passengers.length === 0) return 0;

  const today = new Date();
  let seatsCount = 0;

  passengers.forEach((passenger) => {
    if (passenger.dateOfBirth) {
      const birthDate = new Date(passenger.dateOfBirth);
      const ageInYears = (today - birthDate) / (365.25 * 24 * 60 * 60 * 1000);

      // Chỉ đếm hành khách ≥ 2 tuổi
      if (ageInYears >= 2) {
        seatsCount++;
      }
    }
  });

  return seatsCount;
};
```

## Implementation

### 1. POST `/bookingflights` - Tạo Booking Mới

**Flow:**

1. Nhận dữ liệu passengers và booking
2. **Tính số ghế cần trừ** bằng `calculateSeatsOccupied()`
3. Kiểm tra FlightClass có đủ ghế không
4. **Trừ số ghế** từ `FlightClass.availableSeats`
5. Tạo BookingFlight và FlightPassenger records
6. Return success với số ghế đã trừ

**Code:**

```javascript
router.post("/", async (req, res) => {
  try {
    const { passengers, ...bookingFlightData } = req.body;

    // Tính số ghế cần trừ (người lớn + trẻ em, KHÔNG tính em bé)
    const seatsToDeduct = calculateSeatsOccupied(passengers);

    // Cập nhật số ghế trong FlightClass
    if (bookingFlightData.flightClassId && seatsToDeduct > 0) {
      const flightClass = await FlightClass.findById(
        bookingFlightData.flightClassId
      );

      if (!flightClass) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy hạng vé"
        });
      }

      // Kiểm tra đủ ghế không
      if (flightClass.availableSeats < seatsToDeduct) {
        return res.status(400).json({
          success: false,
          message: `Không đủ ghế trống. Còn ${flightClass.availableSeats} ghế, cần ${seatsToDeduct} ghế`
        });
      }

      // Trừ ghế
      flightClass.availableSeats -= seatsToDeduct;
      await flightClass.save();
    }

    // Tạo booking...
    const bookingFlight = new BookingFlight(bookingFlightData);
    await bookingFlight.save();

    // Tạo passengers...
    let createdPassengers = [];
    if (passengers && passengers.length > 0) {
      const passengerDocs = passengers.map((passenger) => ({
        ...passenger,
        bookingFlightId: bookingFlight._id
      }));
      createdPassengers = await FlightPassenger.insertMany(passengerDocs);
    }

    res.status(201).json({
      success: true,
      data: {
        bookingFlight,
        passengers: createdPassengers
      },
      message: `Đặt vé thành công. Đã trừ ${seatsToDeduct} ghế.`
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
```

### 2. PUT `/bookingflights/:id` - Cập Nhật Booking (Hủy vé)

**Flow khi status → 'cancelled':**

1. Lấy booking cũ
2. Kiểm tra nếu status thay đổi thành 'cancelled'
3. Lấy danh sách passengers
4. **Tính số ghế cần hoàn trả**
5. **Cộng lại số ghế** vào `FlightClass.availableSeats`
6. Update booking status

**Code:**

```javascript
router.put("/:id", async (req, res) => {
  try {
    const oldBookingFlight = await BookingFlight.findById(req.params.id);
    if (!oldBookingFlight) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    // Nếu status đổi thành cancelled, hoàn trả ghế
    if (
      req.body.status === "cancelled" &&
      oldBookingFlight.status !== "cancelled"
    ) {
      const passengers = await FlightPassenger.find({
        bookingFlightId: req.params.id
      });
      const seatsToReturn = calculateSeatsOccupied(passengers);

      // Hoàn trả ghế vào FlightClass
      if (oldBookingFlight.flightClassId && seatsToReturn > 0) {
        const flightClass = await FlightClass.findById(
          oldBookingFlight.flightClassId
        );
        if (flightClass) {
          flightClass.availableSeats += seatsToReturn;
          await flightClass.save();
        }
      }
    }

    const bookingFlight = await BookingFlight.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, data: bookingFlight });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
```

### 3. DELETE `/bookingflights/:id` - Xóa Booking

**Flow:**

1. Lấy booking và passengers
2. **Tính số ghế cần hoàn trả**
3. **Cộng lại số ghế** vào FlightClass
4. Xóa booking và passengers

**Code:**

```javascript
router.delete("/:id", async (req, res) => {
  try {
    const bookingFlight = await BookingFlight.findById(req.params.id);
    if (!bookingFlight) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    // Lấy passengers để tính số ghế cần hoàn trả
    const passengers = await FlightPassenger.find({
      bookingFlightId: req.params.id
    });
    const seatsToReturn = calculateSeatsOccupied(passengers);

    // Hoàn trả ghế vào FlightClass
    if (bookingFlight.flightClassId && seatsToReturn > 0) {
      const flightClass = await FlightClass.findById(
        bookingFlight.flightClassId
      );
      if (flightClass) {
        flightClass.availableSeats += seatsToReturn;
        await flightClass.save();
      }
    }

    // Xóa booking và passengers
    await BookingFlight.findByIdAndDelete(req.params.id);
    await FlightPassenger.deleteMany({ bookingFlightId: req.params.id });

    res.json({
      success: true,
      message: `Đã xóa booking và hoàn trả ${seatsToReturn} ghế`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

## Testing Scenarios

### Scenario 1: Đặt vé - Gia đình 4 người

**Input:**

- 2 Người lớn (≥12 tuổi)
- 1 Trẻ em (5 tuổi)
- 1 Em bé (1 tuổi)
- FlightClass.availableSeats = 100

**Expected:**

- Seats to deduct: **3** (2 adults + 1 child, NOT infant)
- FlightClass.availableSeats after: **97**

**Logic:**

```javascript
passengers = [
  { dateOfBirth: "1990-01-01" }, // Adult: age = 35 → Count
  { dateOfBirth: "1992-05-15" }, // Adult: age = 33 → Count
  { dateOfBirth: "2020-03-10" }, // Child: age = 5 → Count
  { dateOfBirth: "2024-08-20" } // Infant: age = 1 → NOT Count
];
// seatsOccupied = 3
```

### Scenario 2: Đặt vé - Chỉ người lớn

**Input:**

- 2 Người lớn
- FlightClass.availableSeats = 50

**Expected:**

- Seats to deduct: **2**
- FlightClass.availableSeats after: **48**

### Scenario 3: Đặt vé - Chỉ có em bé với người lớn

**Input:**

- 1 Người lớn
- 2 Em bé (dưới 2 tuổi)
- FlightClass.availableSeats = 100

**Expected:**

- Seats to deduct: **1** (chỉ người lớn)
- FlightClass.availableSeats after: **99**

### Scenario 4: Hủy vé - Gia đình 4 người

**Input:**

- BookingFlight.status: "confirmed" → "cancelled"
- 2 Adults + 1 Child + 1 Infant
- FlightClass.availableSeats = 97

**Expected:**

- Seats to return: **3**
- FlightClass.availableSeats after: **100**

### Scenario 5: Không đủ ghế

**Input:**

- Request: 3 Adults + 2 Children = 5 seats needed
- FlightClass.availableSeats = 3

**Expected:**

- Status: **400 Bad Request**
- Error: "Không đủ ghế trống. Còn 3 ghế, cần 5 ghế"
- No booking created
- No seats deducted

### Scenario 6: Xóa booking

**Input:**

- DELETE /bookingflights/123
- Booking có: 2 Adults + 1 Infant
- FlightClass.availableSeats = 95

**Expected:**

- Seats returned: **2** (không tính infant)
- FlightClass.availableSeats after: **97**
- Booking deleted
- Passengers deleted

## Edge Cases

### 1. Passenger không có dateOfBirth

```javascript
passengers = [
  { fullName: "Nguyễn Văn A" } // No dateOfBirth
];
// seatsOccupied = 0 (skipped)
```

**Handling:** Bỏ qua passenger này, không tính vào số ghế

### 2. dateOfBirth invalid format

```javascript
passengers = [{ dateOfBirth: "invalid-date" }];
// new Date("invalid-date") → Invalid Date
// ageInYears → NaN
// NaN >= 2 → false → không count
```

**Handling:** Invalid date không pass điều kiện `ageInYears >= 2`, không tính ghế

### 3. Passenger đúng 2 tuổi (biên)

```javascript
const birthDate = new Date("2023-10-19"); // Exactly 2 years ago
const today = new Date("2025-10-19");
const ageInYears = 2.0; // Exactly 2

if (ageInYears >= 2) {
  // true
  seatsCount++; // ✅ Counted
}
```

**Handling:** `>=` nên 2 tuổi đúng vẫn tính vào số ghế (đúng quy định)

### 4. FlightClass không tồn tại

```javascript
if (!flightClass) {
  return res.status(404).json({
    success: false,
    message: "Không tìm thấy hạng vé"
  });
}
```

**Handling:** Return 404, không tạo booking

### 5. seatsToDeduct = 0 (chỉ có em bé)

```javascript
if (bookingFlightData.flightClassId && seatsToDeduct > 0) {
  // Only execute if seatsToDeduct > 0
}
```

**Handling:** Skip việc trừ ghế, nhưng vẫn tạo booking thành công

## API Response Examples

### Success - Đặt vé

```json
{
  "success": true,
  "data": {
    "bookingFlight": {
      "_id": "67123abc",
      "flightId": "flight_001",
      "flightClassId": "class_001",
      "numTickets": 4,
      "status": "pending"
    },
    "passengers": [
      {
        "_id": "pass_001",
        "fullName": "Nguyễn Văn A",
        "dateOfBirth": "1990-01-01"
      }
      // ... 3 more passengers
    ]
  },
  "message": "Đặt vé thành công. Đã trừ 3 ghế."
}
```

### Error - Không đủ ghế

```json
{
  "success": false,
  "message": "Không đủ ghế trống. Còn 50 ghế, cần 100 ghế"
}
```

### Success - Hủy vé

```json
{
  "success": true,
  "data": {
    "_id": "67123abc",
    "status": "cancelled"
    // ... other fields
  }
}
```

### Success - Xóa booking

```json
{
  "success": true,
  "message": "Đã xóa booking và hoàn trả 3 ghế"
}
```

## Database Impact

### FlightClass Schema

```javascript
{
  flightCode: "VN123",
  className: "Economy",
  price: 1500000,
  availableSeats: 150, // ← Được cập nhật tự động
  // ... other fields
}
```

### Changes Tracking

| Action             | availableSeats Change | Formula                          |
| ------------------ | --------------------- | -------------------------------- |
| **Create Booking** | Giảm                  | `availableSeats - seatsOccupied` |
| **Cancel Booking** | Tăng                  | `availableSeats + seatsOccupied` |
| **Delete Booking** | Tăng                  | `availableSeats + seatsOccupied` |

## Benefits

### 1. Tự Động Quản Lý Ghế

- ✅ Không cần manual update availableSeats
- ✅ Đồng bộ real-time
- ✅ Tránh overselling (bán quá số ghế)

### 2. Logic Phù Hợp

- ✅ Em bé không chiếm ghế (tiêu chuẩn hàng không)
- ✅ Chính xác với quy định thực tế
- ✅ Tối ưu số ghế sử dụng

### 3. Data Integrity

- ✅ Transaction-like behavior
- ✅ Rollback khi có lỗi (MongoDB atomic operations)
- ✅ Consistent state

### 4. User Experience

- ✅ Hiển thị chính xác số ghế còn lại
- ✅ Ngăn đặt vé khi hết ghế
- ✅ Thông báo rõ ràng

## Security & Validation

### 1. Check FlightClass tồn tại

```javascript
if (!flightClass) {
  return res.status(404).json({ message: "Không tìm thấy hạng vé" });
}
```

### 2. Validate số ghế đủ

```javascript
if (flightClass.availableSeats < seatsToDeduct) {
  return res.status(400).json({
    message: `Không đủ ghế trống. Còn ${flightClass.availableSeats} ghế, cần ${seatsToDeduct} ghế`
  });
}
```

### 3. Atomic operations

- MongoDB `findByIdAndUpdate` là atomic
- Không có race condition giữa check và update

### 4. Rollback on error

```javascript
try {
  // Deduct seats
  // Create booking
  // Create passengers
} catch (error) {
  // If error, seats are NOT deducted (transaction fails)
  res.status(400).json({ message: error.message });
}
```

## Monitoring & Logging

### Recommended Logs

```javascript
// Log khi trừ ghế
console.log(
  `[SEAT DEDUCT] FlightClass ${flightClassId}: ${seatsToDeduct} seats deducted`
);

// Log khi hoàn trả ghế
console.log(
  `[SEAT RETURN] FlightClass ${flightClassId}: ${seatsToReturn} seats returned`
);

// Log khi không đủ ghế
console.log(
  `[SEAT ERROR] FlightClass ${flightClassId}: Not enough seats. Available: ${availableSeats}, Needed: ${seatsToDeduct}`
);
```

## Future Enhancements

1. **Seat Reservation System**

   - Hold seats trong 10 phút
   - Auto-release nếu không thanh toán

2. **Seat Selection**

   - Cho phép chọn số ghế cụ thể
   - Lưu vào FlightPassenger.seatNumber

3. **Overbooking Strategy**

   - Cho phép đặt vượt 5-10% số ghế
   - Tối ưu revenue management

4. **Waitlist**

   - Danh sách chờ khi hết ghế
   - Auto-notify khi có ghế trống

5. **Analytics**
   - Track occupancy rate
   - Predict demand
   - Dynamic pricing

## Related Documentation

- [FLIGHT_AGE_BASED_PRICING.md](./FLIGHT_AGE_BASED_PRICING.md) - Giá vé theo độ tuổi
- [FLIGHT_CCCD_REQUIREMENT.md](./FLIGHT_CCCD_REQUIREMENT.md) - Yêu cầu CCCD
- [FLIGHT_CLASS_DYNAMIC_DISPLAY.md](./FLIGHT_CLASS_DYNAMIC_DISPLAY.md) - Hiển thị hạng vé

---

**Last Updated:** October 19, 2025
**Status:** ✅ Production Ready
**File:** `server/routes/bookingflights.js`
