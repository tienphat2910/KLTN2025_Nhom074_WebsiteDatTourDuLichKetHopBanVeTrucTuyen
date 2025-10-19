# Flight Age-Based Pricing - Documentation

## Overview

Hệ thống đặt vé máy bay đã được cập nhật với chính sách giá vé dựa trên độ tuổi của hành khách, theo tiêu chuẩn của ngành hàng không.

## Chính Sách Giá Vé

### Phân Loại Hành Khách

| Loại hành khách  | Độ tuổi   | Giá vé | CCCD/CMND   | Ghi chú                   |
| ---------------- | --------- | ------ | ----------- | ------------------------- |
| 👨 **Người lớn** | ≥ 12 tuổi | 100%   | ✅ Bắt buộc | Giá vé đầy đủ             |
| 👧 **Trẻ em**    | 2-11 tuổi | 90%    | ❌ Không    | Giảm 10% giá vé người lớn |
| 👶 **Em bé**     | < 2 tuổi  | 10%    | ❌ Không    | Không có chỗ ngồi riêng   |

### Công Thức Tính Giá

```typescript
// Giá vé cơ bản từ FlightClass
const baseTicketPrice = selectedFlightClass.price;

// Tính giá theo loại hành khách
const adultsTotal = adults * baseTicketPrice * 1.0; // 100%
const childrenTotal = children * baseTicketPrice * 0.9; // 90%
const infantsTotal = infants * baseTicketPrice * 0.1; // 10%

// Tổng tiền vé
const totalFlightPrice = adultsTotal + childrenTotal + infantsTotal;
```

## Thay Đổi Code

### 1. Trang Chi Tiết Chuyến Bay (`flights/detail/[id]/page.tsx`)

#### Cập nhật hàm tính giá

**Trước:**

```typescript
const calculateTotalPrice = () => {
  if (!flight) return 0;

  const selectedFlightClass = flight.classes?.find(
    (c) => c.className.toLowerCase() === selectedClass.toLowerCase()
  );

  if (!selectedFlightClass) return 0;

  const ticketPrice = selectedFlightClass.price;
  const totalPassengers = adults + children + infants;
  const ticketTotal = ticketPrice * totalPassengers; // ❌ Tất cả cùng giá

  // ... add-ons calculation

  return ticketTotal + baggageTotal + insuranceTotal + prioritySeatTotal;
};
```

**Sau:**

```typescript
const calculateTotalPrice = () => {
  if (!flight) return 0;

  const selectedFlightClass = flight.classes?.find(
    (c) => c.className.toLowerCase() === selectedClass.toLowerCase()
  );

  if (!selectedFlightClass) return 0;

  const baseTicketPrice = selectedFlightClass.price;

  // ✅ Age-based pricing
  const adultsTotal = adults * baseTicketPrice;
  const childrenTotal = children * (baseTicketPrice * 0.9);
  const infantsTotal = infants * (baseTicketPrice * 0.1);
  const ticketTotal = adultsTotal + childrenTotal + infantsTotal;

  const baggageTotal = extraBaggage * EXTRA_BAGGAGE_PRICE;
  const insuranceTotal = insurance
    ? (adults + children + infants) * INSURANCE_PRICE
    : 0;
  const prioritySeatTotal = prioritySeat
    ? (adults + children + infants) * PRIORITY_SEAT_PRICE
    : 0;

  return ticketTotal + baggageTotal + insuranceTotal + prioritySeatTotal;
};
```

#### Thêm thông báo chính sách giá

```typescript
{
  /* Age-based Pricing Info */
}
<div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="text-xs text-blue-800">
    <strong>📋 Chính sách giá vé:</strong>
    <ul className="mt-1 ml-4 space-y-1">
      <li>• Người lớn (≥12 tuổi): 100% giá vé</li>
      <li>• Trẻ em (2-11 tuổi): 90% giá vé</li>
      <li>• Em bé (&lt;2 tuổi): 10% giá vé</li>
    </ul>
  </div>
</div>;
```

#### Cập nhật hiển thị chi tiết giá

**Trước:**

```typescript
<div className="flex justify-between">
  <span className="text-gray-600">
    Vé máy bay ({adults + children + infants} người)
  </span>
  <span className="font-medium">
    {(basePrice * (adults + children + infants)).toLocaleString("vi-VN")} đ
  </span>
</div>
```

**Sau:**

```typescript
{
  adults > 0 && (
    <div className="flex justify-between">
      <span className="text-gray-600">
        Người lớn ({adults} x {basePrice.toLocaleString("vi-VN")} đ)
      </span>
      <span className="font-medium">
        {(adults * basePrice).toLocaleString("vi-VN")} đ
      </span>
    </div>
  );
}
{
  children > 0 && (
    <div className="flex justify-between">
      <span className="text-gray-600">
        Trẻ em ({children} x {(basePrice * 0.9).toLocaleString("vi-VN")} đ -
        90%)
      </span>
      <span className="font-medium">
        {(children * basePrice * 0.9).toLocaleString("vi-VN")} đ
      </span>
    </div>
  );
}
{
  infants > 0 && (
    <div className="flex justify-between">
      <span className="text-gray-600">
        Em bé ({infants} x {(basePrice * 0.1).toLocaleString("vi-VN")} đ - 10%)
      </span>
      <span className="font-medium">
        {(infants * basePrice * 0.1).toLocaleString("vi-VN")} đ
      </span>
    </div>
  );
}
```

### 2. Trang Đặt Vé (`bookingflight/page.tsx`)

#### Cập nhật logic tính giá cho submit

**Trong hàm handleSubmit:**

```typescript
// Calculate total amount with age-based pricing
const numTickets = adults + children + infants;
const baseTicketPrice = selectedClass.price;
const pricePerTicket = baseTicketPrice; // Keep for backend compatibility

// Age-based pricing:
const adultsTotal = adults * baseTicketPrice;
const childrenTotal = children * (baseTicketPrice * 0.9);
const infantsTotal = infants * (baseTicketPrice * 0.1);
const totalFlightPrice = adultsTotal + childrenTotal + infantsTotal;

// Calculate add-ons
const baggageTotal = extraBaggage * EXTRA_BAGGAGE_PRICE;
const insuranceTotal = insurance ? numTickets * INSURANCE_PRICE : 0;
const prioritySeatTotal = prioritySeat ? numTickets * PRIORITY_SEAT_PRICE : 0;
const addOnsTotal = baggageTotal + insuranceTotal + prioritySeatTotal;

const subtotalWithAddons = totalFlightPrice + addOnsTotal;
```

#### Cập nhật hiển thị giá cho UI

```typescript
// Age-based pricing calculation for display
const baseTicketPrice = selectedClass?.price || 0;
const numTickets = adults + children + infants;

const adultsPrice = baseTicketPrice; // 100%
const childrenPrice = baseTicketPrice * 0.9; // 90%
const infantsPrice = baseTicketPrice * 0.1; // 10%

const adultsTotal = adults * adultsPrice;
const childrenTotal = children * childrenPrice;
const infantsTotal = infants * infantsPrice;
const totalFlightPrice = adultsTotal + childrenTotal + infantsTotal;
```

#### Cập nhật phần Chi tiết đặt vé

```typescript
{
  adults > 0 && (
    <div className="flex justify-between">
      <span>
        Người lớn ({adults} x {adultsPrice.toLocaleString("vi-VN")} đ)
      </span>
      <span className="font-medium">
        {adultsTotal.toLocaleString("vi-VN")} đ
      </span>
    </div>
  );
}
{
  children > 0 && (
    <div className="flex justify-between">
      <span>
        Trẻ em 2-11 tuổi ({children} x {childrenPrice.toLocaleString("vi-VN")} đ
        - 90%)
      </span>
      <span className="font-medium">
        {childrenTotal.toLocaleString("vi-VN")} đ
      </span>
    </div>
  );
}
{
  infants > 0 && (
    <div className="flex justify-between">
      <span>
        Em bé dưới 2 tuổi ({infants} x {infantsPrice.toLocaleString("vi-VN")} đ
        - 10%)
      </span>
      <span className="font-medium">
        {infantsTotal.toLocaleString("vi-VN")} đ
      </span>
    </div>
  );
}
```

## UI/UX Improvements

### 1. Hiển thị rõ ràng độ tuổi

**Trước:**

- Người lớn
- Trẻ em
- Em bé

**Sau:**

- Người lớn (≥12 tuổi)
- Trẻ em (2-11 tuổi)
- Em bé (<2 tuổi)

### 2. Hiển thị phần trăm giảm giá

- Trẻ em: "90%" hoặc "- 10%"
- Em bé: "10%" hoặc "- 90%"

### 3. Breakdown chi tiết

Mỗi loại hành khách hiển thị:

- Số lượng
- Giá đơn vị (đã áp dụng giảm giá)
- Phần trăm (nếu có giảm)
- Tổng tiền

### 4. Thông báo chính sách

Thêm khung thông tin màu xanh hiển thị chính sách giá vé ngay dưới phần chọn số lượng hành khách.

## Testing Scenarios

### Scenario 1: Chỉ có người lớn

**Input:**

- Adults: 2
- Children: 0
- Infants: 0
- Base Price: 1,000,000 đ

**Expected:**

- Adults Total: 2 × 1,000,000 = 2,000,000 đ
- Final Total: 2,000,000 đ

### Scenario 2: Gia đình có trẻ em

**Input:**

- Adults: 2
- Children: 1
- Infants: 0
- Base Price: 1,000,000 đ

**Expected:**

- Adults Total: 2 × 1,000,000 = 2,000,000 đ
- Children Total: 1 × 900,000 = 900,000 đ
- Final Total: 2,900,000 đ

### Scenario 3: Gia đình có em bé

**Input:**

- Adults: 2
- Children: 1
- Infants: 1
- Base Price: 1,000,000 đ

**Expected:**

- Adults Total: 2 × 1,000,000 = 2,000,000 đ
- Children Total: 1 × 900,000 = 900,000 đ
- Infants Total: 1 × 100,000 = 100,000 đ
- Final Total: 3,000,000 đ

### Scenario 4: Với add-ons

**Input:**

- Adults: 2, Children: 1, Infants: 1
- Base Price: 1,000,000 đ
- Extra Baggage: 2 kiện
- Insurance: Yes
- Priority Seat: Yes

**Expected:**

- Flight Total: 3,000,000 đ (như Scenario 3)
- Baggage: 2 × 200,000 = 400,000 đ
- Insurance: 4 người × 150,000 = 600,000 đ
- Priority Seat: 4 người × 100,000 = 400,000 đ
- Final Total: 4,400,000 đ

### Scenario 5: Với discount 10%

**Input:**

- Subtotal: 4,400,000 đ
- Discount: 10%

**Expected:**

- Discount Amount: 440,000 đ
- Final Total: 3,960,000 đ

## Benefits

### 1. Phù Hợp Chuẩn Hàng Không

- Tuân thủ chính sách giá vé quốc tế
- Trẻ em được giảm giá hợp lý
- Em bé không chiếm chỗ ngồi → giá thấp

### 2. Tính Minh Bạch

- Hiển thị rõ giá từng loại hành khách
- Breakdown chi tiết từng khoản
- Không có phí ẩn

### 3. User Experience

- Dễ hiểu với người dùng
- Khuyến khích đi du lịch cùng gia đình
- Giá hợp lý cho mọi độ tuổi

### 4. Business Logic

- Tối ưu doanh thu
- Cạnh tranh với các hãng khác
- Linh hoạt với nhiều đối tượng khách hàng

## Business Rules

### 1. Em bé (Infants)

- **Quy định**: Dưới 2 tuổi
- **Giá**: 10% giá vé người lớn
- **Chỗ ngồi**: Không có chỗ ngồi riêng (ngồi cùng người lớn)
- **Tỷ lệ**: Tối đa 1 em bé / 1 người lớn
- **CCCD/CMND**: ❌ Không yêu cầu

### 2. Trẻ em (Children)

- **Quy định**: Từ 2 đến dưới 12 tuổi
- **Giá**: 90% giá vé người lớn
- **Chỗ ngồi**: Có chỗ ngồi riêng
- **Ưu đãi**: Giảm 10% so với người lớn
- **CCCD/CMND**: ❌ Không yêu cầu

### 3. Người lớn (Adults)

- **Quy định**: Từ 12 tuổi trở lên
- **Giá**: 100% giá vé đầy đủ
- **Chỗ ngồi**: Có chỗ ngồi riêng
- **CCCD/CMND**: ✅ Bắt buộc (9 hoặc 12 số)

## Backend Compatibility

### Lưu ý về dữ liệu gửi lên backend

```typescript
// pricePerTicket giữ nguyên là base price
const pricePerTicket = baseTicketPrice;

// totalFlightPrice đã tính theo age-based
const totalFlightPrice = adultsTotal + childrenTotal + infantsTotal;

// Backend payload
{
  flightClassId: selectedClass._id,
  numTickets: adults + children + infants,
  pricePerTicket: baseTicketPrice,      // Base price (cho reference)
  totalFlightPrice: calculatedTotal,     // Tổng đã tính age-based
  passengers: [...],                     // Chi tiết từng hành khách
  // ...
}
```

### Database Schema

**BookingFlight model** - Không cần thay đổi:

- `pricePerTicket`: Giá vé base (cho reference)
- `totalFlightPrice`: Tổng tiền thực tế (đã tính theo age-based)
- Backend chỉ cần lưu tổng tiền, không cần biết breakdown

**FlightPassenger model** - Đã cập nhật:

```javascript
identityNumber: {
    type: String,
    required: false, // ✅ Không bắt buộc cho trẻ em và em bé
    trim: true,
    validate: {
        validator: function (v) {
            // If provided, must be 9 or 12 digits
            if (!v) return true; // ✅ Cho phép empty cho trẻ em/em bé
            return /^\d{9}$|^\d{12}$/.test(v);
        },
        message: 'CCCD/CMND phải có 9 hoặc 12 số'
    }
}
```

## Migration Notes

### Không cần migrate database

- Schema không thay đổi
- Logic tính giá chỉ ở frontend
- Booking cũ vẫn hợp lệ (đã lưu totalFlightPrice)

### Testing Required

- ✅ Test với nhiều tổ hợp người lớn/trẻ em/em bé
- ✅ Test với add-ons
- ✅ Test với discount codes
- ✅ Test payment flow (MoMo, Bank Transfer)
- ✅ Test hiển thị trên mobile/desktop

## Future Enhancements

1. **Dynamic Age Rules**

   - Admin có thể config phần trăm giảm giá
   - Khác nhau theo chuyến bay / hãng hàng không

2. **Special Promotions**

   - Trẻ em miễn phí trong dịp lễ
   - Combo gia đình (2 adults + 2 children) giảm thêm

3. **Age Verification**

   - Kiểm tra ngày sinh khi nhập thông tin hành khách
   - Cảnh báo nếu độ tuổi không khớp với loại đã chọn

4. **Group Booking**
   - Giảm giá cho nhóm > 10 người
   - Giá đặc biệt cho đoàn du lịch

---

**Last Updated:** October 19, 2025
**Status:** ✅ Production Ready
**Related Docs:**

- [FLIGHT_CLASS_DYNAMIC_DISPLAY.md](./FLIGHT_CLASS_DYNAMIC_DISPLAY.md)
- [MOMO_CLIENT_INTEGRATION.md](./client/MOMO_CLIENT_INTEGRATION.md)
