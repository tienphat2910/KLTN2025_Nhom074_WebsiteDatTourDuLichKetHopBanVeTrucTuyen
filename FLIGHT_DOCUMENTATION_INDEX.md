# 📚 Flight Booking System - Documentation Index

## 🎯 Mục Đích

Đây là tài liệu đầy đủ cho **LuTrip Flight Booking System**, bao gồm tất cả tính năng và business logic liên quan đến đặt vé máy bay.

---

## 📖 Danh Sách Tài Liệu

### 1. 📘 [FLIGHT_BOOKING_SUMMARY.md](./FLIGHT_BOOKING_SUMMARY.md)

**Tổng quan toàn bộ hệ thống**

- ✅ Overview của tất cả tính năng
- ✅ Business rules tổng hợp
- ✅ Database schema
- ✅ Complete booking flow
- ✅ API endpoints summary
- ✅ Testing checklist

**Đọc trước tiên để hiểu tổng quan!**

---

### 2. 🎨 [FLIGHT_CLASS_DYNAMIC_DISPLAY.md](./FLIGHT_CLASS_DYNAMIC_DISPLAY.md)

**Hiển thị động hạng vé**

**Nội dung:**

- Hiển thị các hạng vé có sẵn cho mỗi chuyến bay
- Không bắt buộc phải có Economy và Business
- Layout responsive (1-2 cột)
- Validation đầy đủ

**Key Features:**

- ✅ Support 4 loại hạng: Economy, Premium Economy, Business, First Class
- ✅ Auto-select first available class
- ✅ Conditional rendering
- ✅ Empty state handling

**Tech Stack:**

- Frontend: Next.js, TypeScript, TailwindCSS
- Backend: MongoDB FlightClass model

---

### 3. 💰 [FLIGHT_AGE_BASED_PRICING.md](./FLIGHT_AGE_BASED_PRICING.md)

**Chính sách giá vé theo độ tuổi**

**Pricing Rules:**
| Loại | Độ tuổi | Giá vé |
|------|---------|--------|
| Người lớn | ≥ 12 tuổi | 100% |
| Trẻ em | 2-11 tuổi | 90% |
| Em bé | < 2 tuổi | 10% |

**Key Points:**

- ✅ Age calculation logic
- ✅ Price breakdown UI
- ✅ Frontend & backend implementation
- ✅ Testing scenarios với nhiều tổ hợp

**Benefits:**

- Phù hợp chuẩn hàng không quốc tế
- Khuyến khích du lịch gia đình
- Minh bạch giá cả

---

### 4. 📝 [FLIGHT_CCCD_REQUIREMENT.md](./FLIGHT_CCCD_REQUIREMENT.md)

**Yêu cầu CCCD/CMND cho hành khách**

**Requirements:**
| Loại | CCCD/CMND |
|------|-----------|
| Người lớn (≥12 tuổi) | ✅ Bắt buộc |
| Trẻ em (2-11 tuổi) | ❌ Không |
| Em bé (<2 tuổi) | ❌ Không |

**Key Changes:**

- ✅ Conditional CCCD field display
- ✅ Smart validation (only for adults)
- ✅ Backend model update (required: false)
- ✅ Backward compatible

**UI Changes:**

- Form điều chỉnh theo loại hành khách
- Ít field hơn cho trẻ em/em bé
- Better user experience

---

### 5. 💺 [FLIGHT_SEAT_MANAGEMENT.md](./FLIGHT_SEAT_MANAGEMENT.md)

**Quản lý ghế tự động**

**Core Logic:**
| Loại | Chiếm ghế? |
|------|------------|
| Người lớn | ✅ 1 ghế |
| Trẻ em | ✅ 1 ghế |
| Em bé | ❌ 0 ghế |

**Features:**

- ✅ Auto deduct seats khi đặt vé
- ✅ Auto return seats khi hủy/xóa booking
- ✅ Validation: không đủ ghế → reject booking
- ✅ Em bé không chiếm ghế (theo quy định hàng không)

**Implementation:**

```javascript
// Helper function
const calculateSeatsOccupied = (passengers) => {
  // Count only passengers >= 2 years old
  // Infants (< 2 years) don't occupy seats
};
```

**API Flows:**

- POST /bookingflights → Deduct seats
- PUT /bookingflights/:id (cancel) → Return seats
- DELETE /bookingflights/:id → Return seats

---

## 🗂️ Cấu Trúc Files

```
LuTrip/
├── README.md                              # Main project README
├── FLIGHT_DOCUMENTATION_INDEX.md          # This file
│
├── FLIGHT_BOOKING_SUMMARY.md              # 📘 Complete system overview
├── FLIGHT_CLASS_DYNAMIC_DISPLAY.md        # 🎨 Dynamic class display
├── FLIGHT_AGE_BASED_PRICING.md            # 💰 Age-based pricing
├── FLIGHT_CCCD_REQUIREMENT.md             # 📝 CCCD requirements
├── FLIGHT_SEAT_MANAGEMENT.md              # 💺 Seat management
│
├── client/                                # Frontend code
│   └── src/
│       ├── app/
│       │   ├── flights/detail/[id]/       # ← Flight detail page
│       │   └── bookingflight/             # ← Booking page
│       └── services/
│           ├── flightService.ts
│           └── bookingFlightService.ts
│
└── server/                                # Backend code
    ├── models/
    │   ├── Flight.js
    │   ├── FlightClass.js                 # ← Seat management here
    │   ├── FlightPassenger.js             # ← CCCD optional
    │   └── BookingFlight.js
    └── routes/
        └── bookingflights.js              # ← Core booking logic
```

---

## 🔍 Cách Sử Dụng Tài Liệu

### Scenario 1: Tôi muốn hiểu toàn bộ hệ thống

👉 Đọc: [FLIGHT_BOOKING_SUMMARY.md](./FLIGHT_BOOKING_SUMMARY.md)

### Scenario 2: Tôi cần implement dynamic class selection

👉 Đọc: [FLIGHT_CLASS_DYNAMIC_DISPLAY.md](./FLIGHT_CLASS_DYNAMIC_DISPLAY.md)

### Scenario 3: Tôi cần hiểu logic tính giá vé

👉 Đọc: [FLIGHT_AGE_BASED_PRICING.md](./FLIGHT_AGE_BASED_PRICING.md)

### Scenario 4: Tôi muốn biết khi nào cần CCCD

👉 Đọc: [FLIGHT_CCCD_REQUIREMENT.md](./FLIGHT_CCCD_REQUIREMENT.md)

### Scenario 5: Tôi cần implement seat management

👉 Đọc: [FLIGHT_SEAT_MANAGEMENT.md](./FLIGHT_SEAT_MANAGEMENT.md)

### Scenario 6: Tôi là developer mới join team

👉 Đọc theo thứ tự:

1. FLIGHT_BOOKING_SUMMARY.md (overview)
2. FLIGHT_CLASS_DYNAMIC_DISPLAY.md (UI)
3. FLIGHT_AGE_BASED_PRICING.md (pricing logic)
4. FLIGHT_CCCD_REQUIREMENT.md (validation)
5. FLIGHT_SEAT_MANAGEMENT.md (backend logic)

---

## 🧩 Mối Quan Hệ Giữa Các Tính Năng

```
┌─────────────────────────────────────────────────────┐
│         FLIGHT BOOKING SYSTEM                       │
└─────────────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌────────┐    ┌─────────┐    ┌──────────┐
   │ Flight │───→│ Classes │───→│ Booking  │
   │ Search │    │ Display │    │   Form   │
   └────────┘    └─────────┘    └──────────┘
                       │              │
                       │              ▼
                       │         ┌─────────┐
                       └────────→│ Pricing │
                                 └─────────┘
                                      │
                       ┌──────────────┼──────────────┐
                       ▼              ▼              ▼
                 ┌──────────┐   ┌────────┐    ┌──────────┐
                 │Age-Based │   │  CCCD  │    │   Seat   │
                 │  Pricing │   │Validate│    │Management│
                 └──────────┘   └────────┘    └──────────┘
                       │              │              │
                       └──────────────┼──────────────┘
                                      ▼
                              ┌────────────┐
                              │  Payment   │
                              └────────────┘
```

### Dependencies Flow:

1. **Flight Class Display** → User chọn hạng vé
2. **Age-Based Pricing** → Tính giá dựa trên số lượng người lớn/trẻ em/em bé
3. **CCCD Requirement** → Validate form chỉ cho người lớn
4. **Seat Management** → Trừ ghế (người lớn + trẻ em, không tính em bé)
5. **Payment** → Hoàn tất booking

---

## 📊 Business Rules Matrix

| Feature     | Adults (≥12)  | Children (2-11) | Infants (<2)    |
| ----------- | ------------- | --------------- | --------------- |
| **Price**   | 100%          | 90%             | 10%             |
| **CCCD**    | ✅ Required   | ❌ Not Required | ❌ Not Required |
| **Seat**    | ✅ 1 seat     | ✅ 1 seat       | ❌ 0 seats      |
| **Display** | Standard form | Simplified form | Simplified form |

---

## 🎯 Quick Reference

### Age Calculation

```javascript
const ageInYears = (today - birthDate) / (365.25 * 24 * 60 * 60 * 1000);
```

### Price Calculation

```javascript
const adultsTotal = adults * basePrice * 1.0;
const childrenTotal = children * basePrice * 0.9;
const infantsTotal = infants * basePrice * 0.1;
```

### Seat Calculation

```javascript
const seatsOccupied = passengers.filter((p) => {
  const age = calculateAge(p.dateOfBirth);
  return age >= 2; // Adults + Children, NOT infants
}).length;
```

### CCCD Validation

```javascript
const needsCCCD = (passenger) => {
  const age = calculateAge(passenger.dateOfBirth);
  return age >= 12; // Only adults
};
```

---

## 🧪 Testing Guidelines

### Unit Tests

- [ ] Age calculation với edge cases
- [ ] Price calculation với tất cả tổ hợp
- [ ] Seat calculation với infants
- [ ] CCCD validation

### Integration Tests

- [ ] Complete booking flow
- [ ] Cancel booking flow
- [ ] Seat deduction và return
- [ ] Payment integration

### E2E Tests

- [ ] User journey: search → select → book → pay
- [ ] Error scenarios: not enough seats, invalid CCCD
- [ ] Concurrent bookings

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] API endpoints tested
- [ ] Frontend build successful
- [ ] Payment integration working
- [ ] Error logging enabled
- [ ] Monitoring setup

---

## 📞 Support & Contact

**Project:** LuTrip - Flight Booking System  
**Repository:** [github.com/tienphat2910/LuTrip](https://github.com/tienphat2910/LuTrip)  
**Branch:** nhanhphat  
**Documentation Version:** 1.0.0  
**Last Updated:** October 19, 2025

---

## 🎓 Learning Resources

### Recommended Reading Order for New Developers:

1. **Week 1**: FLIGHT_BOOKING_SUMMARY.md

   - Understand overall architecture
   - Learn database schema
   - Review API endpoints

2. **Week 2**: FLIGHT_CLASS_DYNAMIC_DISPLAY.md

   - Implement frontend components
   - Work with FlightClass model
   - Build responsive UI

3. **Week 3**: FLIGHT_AGE_BASED_PRICING.md

   - Implement pricing logic
   - Test with various combinations
   - Update UI to show breakdown

4. **Week 4**: FLIGHT_CCCD_REQUIREMENT.md

   - Add conditional validation
   - Update form UI
   - Test edge cases

5. **Week 5**: FLIGHT_SEAT_MANAGEMENT.md
   - Implement backend logic
   - Test concurrent bookings
   - Add monitoring

---

## 📝 Change Log

### Version 1.0.0 (2025-10-19)

- ✅ Initial documentation
- ✅ Dynamic class display
- ✅ Age-based pricing
- ✅ CCCD requirement logic
- ✅ Automatic seat management

---

**Happy Coding! ✈️**
