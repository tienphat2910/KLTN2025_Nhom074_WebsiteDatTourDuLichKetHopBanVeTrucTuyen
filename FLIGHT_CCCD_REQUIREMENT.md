# Flight Passenger CCCD Requirement Update

## Overview

Cập nhật yêu cầu CCCD/CMND cho hành khách theo quy định thực tế của ngành hàng không: chỉ yêu cầu CCCD cho người lớn, trẻ em và em bé không cần CCCD.

## Thay Đổi Chính Sách

### ❌ Trước đây

- **Tất cả hành khách** (người lớn, trẻ em, em bé) đều bắt buộc phải có CCCD/CMND
- Form hiển thị field CCCD cho tất cả loại hành khách
- Backend validation yêu cầu `identityNumber` cho mọi FlightPassenger

### ✅ Hiện tại

- **Chỉ người lớn (≥12 tuổi)** bắt buộc phải có CCCD/CMND
- **Trẻ em (2-11 tuổi)**: Không yêu cầu CCCD
- **Em bé (<2 tuổi)**: Không yêu cầu CCCD

## Phân Loại Hành Khách

| Loại         | Độ tuổi   | CCCD/CMND         | Lý do                                         |
| ------------ | --------- | ----------------- | --------------------------------------------- |
| 👨 Người lớn | ≥ 12 tuổi | ✅ **Bắt buộc**   | Cần giấy tờ tùy thân để kiểm tra an ninh      |
| 👧 Trẻ em    | 2-11 tuổi | ❌ Không bắt buộc | Có thể dùng giấy khai sinh, đi cùng người lớn |
| 👶 Em bé     | < 2 tuổi  | ❌ Không bắt buộc | Quá nhỏ, chưa có CCCD, đi cùng người lớn      |

## Code Changes

### 1. Frontend - Validation Logic (`bookingflight/page.tsx`)

#### ❌ Before:

```typescript
const hasEmptyFields = passengers.some((passenger, index) => {
  if (index === 0) {
    return (
      !passenger.fullName.trim() ||
      !passenger.phoneNumber?.trim() ||
      !passenger.email?.trim() ||
      !passenger.gender.trim() ||
      !passenger.dateOfBirth.trim() ||
      !passenger.identityNumber?.trim() // ❌ Bắt buộc cho tất cả
    );
  }
  return (
    !passenger.fullName.trim() ||
    !passenger.gender.trim() ||
    !passenger.dateOfBirth.trim() ||
    !passenger.identityNumber?.trim() // ❌ Bắt buộc cho tất cả
  );
});
```

#### ✅ After:

```typescript
const hasEmptyFields = passengers.some((passenger, index) => {
  // First passenger (contact person - always adult)
  if (index === 0) {
    return (
      !passenger.fullName.trim() ||
      !passenger.phoneNumber?.trim() ||
      !passenger.email?.trim() ||
      !passenger.gender.trim() ||
      !passenger.dateOfBirth.trim() ||
      !passenger.identityNumber?.trim() // ✅ Bắt buộc vì là người lớn
    );
  }

  // Other passengers
  // Adults need CCCD, but children and infants don't
  const isAdult = index < adults;
  if (isAdult) {
    return (
      !passenger.fullName.trim() ||
      !passenger.gender.trim() ||
      !passenger.dateOfBirth.trim() ||
      !passenger.identityNumber?.trim() // ✅ Bắt buộc cho người lớn
    );
  } else {
    // Children and infants don't need CCCD
    return (
      !passenger.fullName.trim() ||
      !passenger.gender.trim() ||
      !passenger.dateOfBirth.trim()
      // ✅ Không check identityNumber cho trẻ em và em bé
    );
  }
});
```

### 2. Frontend - Form Display

#### Conditional CCCD Field:

```typescript
{
  /* CCCD - Only for adults */
}
{
  passengerType === "adult" && (
    <div className="lg:col-span-1">
      <label className="block font-semibold mb-1 text-gray-700">
        CCCD/CMND *
      </label>
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
        value={passenger.identityNumber || ""}
        onChange={(e) =>
          updatePassenger(index, "identityNumber", e.target.value)
        }
        placeholder="Nhập số CCCD/CMND (9 hoặc 12 số)"
        required
      />
    </div>
  );
}
```

### 3. Frontend - Initialize Passengers

```typescript
// Add adults (require CCCD)
for (let i = 0; i < adults; i++) {
  passengerList.push({
    fullName: i === 0 && user?.fullName ? user.fullName : "",
    phoneNumber: i === 0 && user?.phone ? user.phone : undefined,
    email: i === 0 && user?.email ? user.email : undefined,
    gender: "Nam",
    dateOfBirth: "",
    identityNumber: "", // ✅ Required for adults
    nationality: "Vietnam"
  });
}

// Add children (no CCCD needed)
for (let i = 0; i < children; i++) {
  passengerList.push({
    fullName: "",
    gender: "Nam",
    dateOfBirth: "",
    identityNumber: undefined, // ✅ Not required for children
    nationality: "Vietnam"
  });
}

// Add infants (no CCCD needed)
for (let i = 0; i < infants; i++) {
  passengerList.push({
    fullName: "",
    gender: "Nam",
    dateOfBirth: "",
    identityNumber: undefined, // ✅ Not required for infants
    nationality: "Vietnam"
  });
}
```

### 4. Backend - Model Update (`FlightPassenger.js`)

#### ❌ Before:

```javascript
identityNumber: {
    type: String,
    required: true, // ❌ Bắt buộc cho tất cả
    trim: true,
    validate: {
        validator: function (v) {
            return v && /^\d{9}$|^\d{12}$/.test(v);
        },
        message: 'CCCD/CMND phải có 9 hoặc 12 số'
    }
}
```

#### ✅ After:

```javascript
identityNumber: {
    type: String,
    required: false, // ✅ Không bắt buộc (optional)
    trim: true,
    validate: {
        validator: function (v) {
            // If provided, must be 9 or 12 digits
            // If empty/null/undefined, it's valid (for children and infants)
            if (!v) return true; // ✅ Cho phép empty
            return /^\d{9}$|^\d{12}$/.test(v);
        },
        message: 'CCCD/CMND phải có 9 hoặc 12 số'
    }
}
```

### 5. Type Definition (`bookingFlightService.ts`)

Type đã support optional từ đầu - không cần thay đổi:

```typescript
export interface PassengerInfo {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  gender: "Nam" | "Nữ";
  dateOfBirth: string;
  identityNumber?: string; // ✅ Optional từ đầu
  seatNumber?: string;
  nationality?: string;
}
```

## UI Changes

### Form Layout

**Người lớn (Adult):**

```
┌─────────────────────────────────────────────────────────┐
│ [Người lớn 1] (Người liên hệ)                           │
├─────────────┬─────────────┬─────────────┬─────────────┤
│ Họ và tên * │ Giới tính * │ Ngày sinh * │ CCCD/CMND * │ ← Có CCCD
├─────────────┴─────────────┴─────────────┴─────────────┤
│ Số điện thoại *                                         │
├─────────────────────────────────────────────────────────┤
│ Email *                                                 │
└─────────────────────────────────────────────────────────┘
```

**Trẻ em (Child):**

```
┌─────────────────────────────────────────────────────────┐
│ [Trẻ em 1]                                              │
├─────────────┬─────────────┬─────────────┐
│ Họ và tên * │ Giới tính * │ Ngày sinh * │ ← Không có CCCD
└─────────────┴─────────────┴─────────────┘
```

**Em bé (Infant):**

```
┌─────────────────────────────────────────────────────────┐
│ [Em bé 1]                                               │
├─────────────┬─────────────┬─────────────┐
│ Họ và tên * │ Giới tính * │ Ngày sinh * │ ← Không có CCCD
└─────────────┴─────────────┴─────────────┘
```

## Benefits

### 1. Phù Hợp Thực Tế

- ✅ Trẻ em dưới 12 tuổi thường chưa có CCCD
- ✅ Em bé dưới 2 tuổi chắc chắn chưa có CCCD
- ✅ Giấy khai sinh có thể dùng thay thế cho trẻ em

### 2. User Experience

- ✅ Giảm số field phải điền
- ✅ Form đơn giản hơn cho gia đình có trẻ em
- ✅ Không gây khó khăn cho người dùng

### 3. Compliance

- ✅ Tuân thủ quy định thực tế của hàng không
- ✅ Tương thích với các hãng bay quốc tế
- ✅ Linh hoạt với nhiều loại giấy tờ

## Validation Rules

### Frontend Validation

1. **Người lớn (index < adults)**:

   - Họ tên: Required
   - Giới tính: Required
   - Ngày sinh: Required
   - CCCD: **Required** (9 hoặc 12 số)
   - Phone/Email: Required (chỉ người liên hệ)

2. **Trẻ em (index >= adults && index < adults + children)**:

   - Họ tên: Required
   - Giới tính: Required
   - Ngày sinh: Required
   - CCCD: **Not Required** ❌

3. **Em bé (index >= adults + children)**:
   - Họ tên: Required
   - Giới tính: Required
   - Ngày sinh: Required
   - CCCD: **Not Required** ❌

### Backend Validation

```javascript
// Model FlightPassenger
{
  fullName: { required: true },
  gender: { required: true },
  dateOfBirth: { required: true },
  identityNumber: {
    required: false, // ✅ Optional
    validate: {
      validator: function(v) {
        if (!v) return true; // ✅ OK nếu empty
        return /^\d{9}$|^\d{12}$/.test(v); // ✅ Nếu có thì phải đúng format
      }
    }
  }
}
```

## Testing Scenarios

### Scenario 1: Gia đình - 2 Người lớn + 1 Trẻ em + 1 Em bé

**Form Fields:**

1. Người lớn 1 (Liên hệ):

   - Họ tên ✅
   - Giới tính ✅
   - Ngày sinh ✅
   - **CCCD ✅** (Required)
   - Số điện thoại ✅
   - Email ✅

2. Người lớn 2:

   - Họ tên ✅
   - Giới tính ✅
   - Ngày sinh ✅
   - **CCCD ✅** (Required)

3. Trẻ em 1:

   - Họ tên ✅
   - Giới tính ✅
   - Ngày sinh ✅
   - **Không có CCCD** ❌

4. Em bé 1:
   - Họ tên ✅
   - Giới tính ✅
   - Ngày sinh ✅
   - **Không có CCCD** ❌

**Validation Result:** ✅ Pass

### Scenario 2: Chỉ người lớn - 2 Người lớn

**Form Fields:**

1. Người lớn 1: Đầy đủ + **CCCD** ✅
2. Người lớn 2: Đầy đủ + **CCCD** ✅

**Validation Result:** ✅ Pass

### Scenario 3: Người lớn không nhập CCCD

**Form Fields:**

1. Người lớn 1: Đầy đủ nhưng **thiếu CCCD** ❌

**Validation Result:** ❌ Fail
**Error:** "Vui lòng nhập đầy đủ thông tin tất cả hành khách!"

### Scenario 4: Trẻ em với CCCD (optional)

**Form Fields:**

1. Người lớn 1: Đầy đủ + CCCD ✅
2. Trẻ em 1: Đầy đủ + **có nhập CCCD** ✅

**Validation Result:** ✅ Pass (CCCD optional nhưng nếu nhập thì vẫn được)

## Database Impact

### Migration Status

- ✅ **No migration needed**
- Existing data vẫn hợp lệ
- Model đã update `required: false`
- Old bookings with all CCCD filled: Still valid
- New bookings without children/infant CCCD: Valid

### Backward Compatibility

- ✅ Old bookings: Vẫn hiển thị đầy đủ CCCD nếu có
- ✅ New bookings: Chấp nhận empty CCCD cho trẻ em/em bé
- ✅ API không thay đổi structure
- ✅ Frontend vẫn gửi đúng format

## API Payload Example

### Example 1: Family Booking

```json
{
  "flightId": "flight_123",
  "passengers": [
    {
      "fullName": "Nguyễn Văn A",
      "gender": "Nam",
      "dateOfBirth": "1990-01-01",
      "identityNumber": "001234567890", // ✅ Adult has CCCD
      "phoneNumber": "0901234567",
      "email": "nguyenvana@example.com"
    },
    {
      "fullName": "Nguyễn Văn B",
      "gender": "Nam",
      "dateOfBirth": "1992-05-15",
      "identityNumber": "009876543210" // ✅ Adult has CCCD
    },
    {
      "fullName": "Nguyễn Thị C",
      "gender": "Nữ",
      "dateOfBirth": "2018-03-20"
      // ✅ Child - No identityNumber field
    },
    {
      "fullName": "Nguyễn Văn D",
      "gender": "Nam",
      "dateOfBirth": "2024-08-10"
      // ✅ Infant - No identityNumber field
    }
  ]
}
```

### Example 2: Only Adults

```json
{
  "flightId": "flight_123",
  "passengers": [
    {
      "fullName": "Trần Thị E",
      "gender": "Nữ",
      "dateOfBirth": "1995-12-01",
      "identityNumber": "001122334455", // ✅ Required
      "phoneNumber": "0912345678",
      "email": "tranthie@example.com"
    },
    {
      "fullName": "Lê Văn F",
      "gender": "Nam",
      "dateOfBirth": "1998-07-20",
      "identityNumber": "005544332211" // ✅ Required
    }
  ]
}
```

## Summary

| Aspect                | Before              | After                     |
| --------------------- | ------------------- | ------------------------- |
| **CCCD for Adults**   | ✅ Required         | ✅ Required               |
| **CCCD for Children** | ✅ Required         | ❌ Not Required           |
| **CCCD for Infants**  | ✅ Required         | ❌ Not Required           |
| **Form Fields**       | Same for all        | Conditional based on type |
| **Validation**        | All must have CCCD  | Only adults need CCCD     |
| **Backend Model**     | `required: true`    | `required: false`         |
| **User Experience**   | More fields to fill | Simpler for families      |
| **Compliance**        | Too strict          | Realistic & flexible      |

## Related Documentation

- [FLIGHT_AGE_BASED_PRICING.md](./FLIGHT_AGE_BASED_PRICING.md) - Chính sách giá vé theo độ tuổi
- [FLIGHT_CLASS_DYNAMIC_DISPLAY.md](./FLIGHT_CLASS_DYNAMIC_DISPLAY.md) - Hiển thị động hạng vé

---

**Last Updated:** October 19, 2025
**Status:** ✅ Production Ready
**Breaking Changes:** ❌ None (Backward compatible)
