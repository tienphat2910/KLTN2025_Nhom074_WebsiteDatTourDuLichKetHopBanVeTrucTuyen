# Prevent Cancellation Request Spam

## Vấn đề

Người dùng có thể spam nhiều yêu cầu hủy cho cùng một booking, gây khó khăn cho admin trong việc xử lý.

## Giải pháp

Thêm logic kiểm tra và hiển thị trạng thái yêu cầu hủy pending để ngăn chặn spam.

## Thay đổi

### 1. Backend - Thêm API endpoint mới

**File**: `server/routes/cancellationrequests.js`

Thêm route mới để lấy yêu cầu hủy theo booking ID:

```javascript
/**
 * GET /api/cancellationrequests/booking/:bookingId
 * Get cancellation request by booking ID
 * Chỉ trả về yêu cầu pending (đang chờ xử lý)
 */
router.get("/booking/:bookingId", auth, async (req, res) => {
  try {
    const request = await CancellationRequest.findOne({
      bookingId: req.params.bookingId,
      status: "pending" // Chỉ lấy yêu cầu pending
    })
      .populate("bookingId")
      .populate("userId", "fullName email phone avatar")
      .populate("processedBy", "fullName email");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu hủy đang chờ xử lý"
      });
    }

    // Kiểm tra quyền truy cập
    if (
      request.userId._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem yêu cầu này"
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error("Get cancellation request by booking error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

**Lưu ý**: Route này phải được đặt **TRƯỚC** route `/:id` để tránh conflict.

### 2. Frontend Service - Thêm method mới

**File**: `client/src/services/cancellationRequestService.ts`

Thêm method `getByBookingId`:

```typescript
/**
 * Get cancellation request by booking ID
 * @param bookingId - ID của booking
 * @returns Promise<CancellationRequestResponse>
 */
async getByBookingId(bookingId: string): Promise<CancellationRequestResponse> {
  try {
    const response = await fetch(`${this.baseURL}/booking/${bookingId}`, {
      headers: await this.getAuthHeader()
    });

    return await this.handleResponse<CancellationRequestResponse>(response);
  } catch (error) {
    console.error("Get cancellation request by booking error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Không thể tải thông tin yêu cầu hủy"
    };
  }
}
```

### 3. Component - Cập nhật CancelBookingDialog

**File**: `client/src/components/Booking/CancelBookingDialog.tsx`

#### Thêm state mới:

```typescript
const [hasPendingRequest, setHasPendingRequest] = useState(false);
const [isCheckingRequest, setIsCheckingRequest] = useState(true);
```

#### Thêm useEffect để kiểm tra yêu cầu pending:

```typescript
useEffect(() => {
  checkPendingRequest();
}, [booking._id]);
```

#### Function kiểm tra yêu cầu pending:

```typescript
const checkPendingRequest = async () => {
  try {
    setIsCheckingRequest(true);
    const response = await cancellationRequestService.getByBookingId(
      booking._id
    );

    if (response.success && response.data) {
      // Kiểm tra nếu data là single request (không phải array) và có status pending
      if (!Array.isArray(response.data) && response.data.status === "pending") {
        setHasPendingRequest(true);
      }
    }
  } catch (error) {
    console.error("Check pending request error:", error);
  } finally {
    setIsCheckingRequest(false);
  }
};
```

#### Cập nhật render logic:

**Khi đang kiểm tra**:

```tsx
if (isCheckingRequest) {
  return (
    <Button variant="outline" size="sm" disabled>
      <Loader2 className="h-4 w-4 animate-spin" />
    </Button>
  );
}
```

**Khi đã có yêu cầu pending**:

```tsx
if (hasPendingRequest) {
  return (
    <Button variant="outline" size="sm" disabled className="gap-2">
      <CheckCircle className="h-4 w-4" />
      Đã gửi yêu cầu
    </Button>
  );
}
```

**Khi chưa có yêu cầu**:

- Hiển thị nút "Yêu cầu hủy" bình thường (màu đỏ, có thể click)

#### Cập nhật sau khi gửi thành công:

```typescript
if (response.success) {
  toast.success("Đã gửi yêu cầu hủy thành công");
  setOpen(false);
  setReason("");
  setHasPendingRequest(true); // Cập nhật state để hiển thị trạng thái pending
  if (onSuccess) {
    onSuccess();
  }
}
```

## Luồng hoạt động

1. **Khi component mount**:

   - Hiển thị nút loading
   - Gọi API kiểm tra xem booking này có yêu cầu hủy pending không

2. **Nếu có yêu cầu pending**:

   - Hiển thị nút "Đã gửi yêu cầu" (disabled, có icon checkmark)
   - Người dùng không thể gửi thêm yêu cầu

3. **Nếu chưa có yêu cầu**:

   - Hiển thị nút "Yêu cầu hủy" bình thường
   - Người dùng có thể click để mở dialog

4. **Sau khi gửi yêu cầu thành công**:
   - Nút tự động chuyển sang trạng thái "Đã gửi yêu cầu"
   - Không cần reload trang

## Lợi ích

✅ **Ngăn chặn spam**: Người dùng không thể gửi nhiều yêu cầu cho cùng một booking
✅ **UX tốt hơn**: Người dùng biết rõ trạng thái yêu cầu của mình
✅ **Giảm tải cho admin**: Admin không phải xử lý nhiều yêu cầu trùng lặp
✅ **Real-time feedback**: Trạng thái cập nhật ngay sau khi gửi, không cần reload

## Testing

### Test cases cần kiểm tra:

1. ✅ Booking chưa có yêu cầu hủy

   - Hiển thị nút "Yêu cầu hủy" màu đỏ
   - Click vào mở dialog bình thường

2. ✅ Booking đã có yêu cầu hủy pending

   - Hiển thị nút "Đã gửi yêu cầu" (disabled)
   - Không thể click để mở dialog

3. ✅ Gửi yêu cầu hủy mới

   - Sau khi gửi thành công, nút tự động chuyển sang "Đã gửi yêu cầu"
   - Không thể gửi lại

4. ✅ Admin xử lý yêu cầu (approve/reject)

   - Sau khi admin xử lý, yêu cầu không còn pending
   - Người dùng có thể gửi yêu cầu mới (nếu cần)

5. ✅ Error handling
   - Nếu API call fail, vẫn hiển thị nút bình thường
   - Không block người dùng

## Notes

- Backend route `/booking/:bookingId` phải đặt **trước** route `/:id` để tránh conflict
- Chỉ kiểm tra yêu cầu có status = `pending`, không tính approved/rejected
- Component tự động check lại khi booking.\_id thay đổi
- State được update sau khi submit thành công để tránh phải reload
