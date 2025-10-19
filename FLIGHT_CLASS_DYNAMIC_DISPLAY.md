# Flight Class Dynamic Display - Documentation

## Overview

Hệ thống đã được cập nhật để hiển thị động các hạng vé dựa trên dữ liệu thực tế của mỗi chuyến bay, thay vì bắt buộc phải có cả Economy và Business.

## Các loại hạng vé được hỗ trợ

Theo `FlightClass` model, hệ thống hỗ trợ 4 loại hạng vé:

1. **Economy** - Phổ thông
2. **Premium Economy** - Phổ thông cao cấp
3. **Business** - Thương gia
4. **First Class** - Hạng nhất

## Thay đổi Frontend

### 1. Trang Chi Tiết Chuyến Bay (`flights/detail/[id]/page.tsx`)

#### State Management

```typescript
// Trước: Giới hạn economy | business
const [selectedClass, setSelectedClass] = useState<"economy" | "business">(
  "economy"
);

// Sau: Chấp nhận mọi loại class name
const [selectedClass, setSelectedClass] = useState<string>("economy");
```

#### Auto-select First Available Class

```typescript
useEffect(() => {
  if (!id) return;
  const fetchFlight = async () => {
    try {
      const data = await flightService.getFlightById(id as string);
      setFlight(data);

      // Tự động chọn hạng vé đầu tiên có sẵn
      if (data.classes && data.classes.length > 0) {
        const firstClass = data.classes[0].className.toLowerCase();
        setSelectedClass(firstClass);
      }
    } catch (err) {
      setError("Không tìm thấy chuyến bay");
    } finally {
      setLoading(false);
    }
  };
  fetchFlight();
}, [id]);
```

#### Dynamic Class Display

```typescript
<div
  className={`grid gap-4 ${
    flight.classes && flight.classes.length > 1
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1"
  }`}
>
  {flight.classes?.map((flightClass) => {
    const className = flightClass.className;
    const classKey = className.toLowerCase();
    const isEconomy = classKey === "economy";

    return (
      <div
        key={flightClass._id}
        onClick={() => setSelectedClass(classKey)}
        className={`cursor-pointer ${
          isEconomy
            ? "bg-gradient-to-r from-sky-50 to-blue-50"
            : "bg-gradient-to-r from-amber-50 to-orange-50"
        } border-2 rounded-xl p-4 transition-all duration-300 ${
          selectedClass === classKey
            ? isEconomy
              ? "border-sky-500 shadow-lg scale-105"
              : "border-amber-500 shadow-lg scale-105"
            : isEconomy
            ? "border-sky-200 hover:border-sky-400"
            : "border-amber-200 hover:border-amber-400"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h4
            className={`font-semibold ${
              isEconomy ? "text-sky-800" : "text-amber-800"
            }`}
          >
            {className === "Economy"
              ? "Phổ thông"
              : className === "Business"
              ? "Thương gia"
              : className}
          </h4>
          <input
            type="radio"
            checked={selectedClass === classKey}
            onChange={() => setSelectedClass(classKey)}
            className={`w-5 h-5 ${
              isEconomy ? "text-sky-600" : "text-amber-600"
            }`}
          />
        </div>
        <div
          className={`text-2xl font-bold mb-1 ${
            isEconomy ? "text-sky-600" : "text-amber-600"
          }`}
        >
          {flightClass.price?.toLocaleString("vi-VN") || "N/A"} đ
        </div>
        <div className="text-sm text-gray-600">
          Còn {flightClass.availableSeats || 0} ghế
        </div>
      </div>
    );
  })}
</div>;
{
  (!flight.classes || flight.classes.length === 0) && (
    <div className="text-center py-4 text-gray-500">
      Chưa có thông tin hạng vé
    </div>
  );
}
```

#### Validation

```typescript
const handleBookNow = () => {
  // Kiểm tra có hạng vé không
  if (!flight?.classes || flight.classes.length === 0) {
    alert("Chuyến bay này chưa có hạng vé nào. Vui lòng chọn chuyến bay khác.");
    return;
  }

  // Kiểm tra hạng vé đã chọn có tồn tại không
  const selectedFlightClass = flight.classes.find(
    (c) => c.className.toLowerCase() === selectedClass.toLowerCase()
  );

  if (!selectedFlightClass) {
    alert("Hạng vé đã chọn không khả dụng. Vui lòng chọn hạng vé khác.");
    return;
  }

  // Tiếp tục đặt vé...
};
```

#### Button State

```typescript
<button
  type="button"
  onClick={handleBookNow}
  disabled={!flight?.classes || flight.classes.length === 0}
  className="w-full bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
>
  {flight?.classes && flight.classes.length > 0
    ? `Đặt vé ngay - ${calculateTotalPrice().toLocaleString("vi-VN")} đ`
    : "Chưa có hạng vé"}
</button>
```

### 2. Trang Đặt Vé (`bookingflight/page.tsx`)

#### URL Params

```typescript
// Trước: Type assertion
const seatClass = (searchParams.get("seatClass") || "economy") as
  | "economy"
  | "business";

// Sau: String flexible
const seatClass = searchParams.get("seatClass") || "economy";
```

#### Dynamic Class Name Display

```typescript
// Trong header
<span className="mr-4">
  🎫 Hạng {
    flight.classes?.find((c) => c.className.toLowerCase() === seatClass.toLowerCase())?.className
    || (seatClass === "economy" ? "Phổ thông" : seatClass === "business" ? "Thương gia" : seatClass)
  }
</span>

// Trong chi tiết giá
<div className="flex justify-between">
  <span>Hạng ghế:</span>
  <span className="font-medium capitalize">
    {
      flight.classes?.find((c) => c.className.toLowerCase() === seatClass.toLowerCase())?.className
      || (seatClass === "economy" ? "Phổ thông" : seatClass === "business" ? "Thương gia" : seatClass)
    }
  </span>
</div>
```

## Behavior Changes

### Trước:

- ❌ Bắt buộc phải có cả Economy và Business
- ❌ Hiển thị "N/A" nếu thiếu hạng vé
- ❌ Vẫn cho phép đặt vé khi không có hạng vé

### Sau:

- ✅ Chỉ hiển thị các hạng vé thực sự có sẵn
- ✅ Layout responsive: 1 cột nếu chỉ có 1 hạng, 2 cột nếu có nhiều hạng
- ✅ Tự động chọn hạng vé đầu tiên
- ✅ Disable nút đặt vé nếu không có hạng vé nào
- ✅ Hiển thị tên hạng vé chính xác từ database
- ✅ Validation trước khi đặt vé

## UI/UX Improvements

### 1. Color Coding

- **Economy**: Sky blue (gradient from-sky-50 to-blue-50)
- **Other Classes**: Amber/Orange (gradient from-amber-50 to-orange-50)

### 2. Empty State

```typescript
{
  (!flight.classes || flight.classes.length === 0) && (
    <div className="text-center py-4 text-gray-500">
      Chưa có thông tin hạng vé
    </div>
  );
}
```

### 3. Disabled State

- Button disabled với opacity 50%
- Text thay đổi: "Đặt vé ngay" → "Chưa có hạng vé"
- Cursor not-allowed

## Backend Support

### FlightClass Model

```javascript
className: {
    type: String,
    required: true,
    enum: ['Economy', 'Premium Economy', 'Business', 'First Class'],
    default: 'Economy'
}
```

### Supported Classes:

1. ✅ **Economy** - Phổ thông
2. ✅ **Premium Economy** - Phổ thông cao cấp
3. ✅ **Business** - Thương gia
4. ✅ **First Class** - Hạng nhất

## Testing Scenarios

### Scenario 1: Chuyến bay chỉ có Economy

- ✅ Hiển thị 1 card duy nhất
- ✅ Layout 1 cột
- ✅ Tự động chọn Economy
- ✅ Có thể đặt vé

### Scenario 2: Chuyến bay có cả Economy và Business

- ✅ Hiển thị 2 cards
- ✅ Layout 2 cột trên desktop, 1 cột trên mobile
- ✅ Tự động chọn hạng đầu tiên
- ✅ Có thể chuyển đổi giữa các hạng

### Scenario 3: Chuyến bay có Premium Economy

- ✅ Hiển thị đúng tên "Premium Economy"
- ✅ Màu amber (không phải economy)
- ✅ Giá và số ghế hiển thị chính xác

### Scenario 4: Chuyến bay không có hạng vé nào

- ✅ Hiển thị "Chưa có thông tin hạng vé"
- ✅ Button disabled
- ✅ Không thể đặt vé
- ✅ Alert khi cố gắng đặt

### Scenario 5: URL có seatClass không tồn tại

- ✅ Hiển thị fallback name
- ✅ Validation khi submit
- ✅ Alert yêu cầu chọn hạng vé khác

## Benefits

1. **Flexibility**: Hỗ trợ bất kỳ loại hạng vé nào trong enum
2. **User Experience**: Chỉ hiển thị options thực sự có sẵn
3. **Data Integrity**: Không tạo booking với hạng vé không tồn tại
4. **Scalability**: Dễ dàng thêm hạng vé mới vào enum
5. **Error Prevention**: Validation đầy đủ trước khi đặt vé

## Migration Notes

### Không cần migrate data

- Frontend tương thích ngược với dữ liệu cũ
- Chuyến bay có Economy/Business vẫn hiển thị bình thường
- Chuyến bay mới có thể có bất kỳ hạng vé nào trong enum

### Admin cần lưu ý

- Khi tạo chuyến bay mới, phải thêm ít nhất 1 FlightClass
- Tên className phải nằm trong enum: ['Economy', 'Premium Economy', 'Business', 'First Class']
- Mỗi chuyến bay có thể có 1-4 hạng vé

## Future Enhancements

1. Custom icon cho từng loại hạng vé
2. Thêm tooltip hiển thị amenities của từng hạng
3. Sort classes theo thứ tự: Economy → Premium Economy → Business → First Class
4. Filter chuyến bay theo hạng vé có sẵn
5. Bulk pricing display cho nhiều hạng vé

---

**Last Updated:** 2024
**Status:** ✅ Production Ready
