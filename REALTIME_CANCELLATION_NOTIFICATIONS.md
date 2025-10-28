# Fix Real-time Socket Notifications for Cancellation Requests

## Vấn đề

Admin không nhận được thông báo real-time khi user gửi yêu cầu hủy booking. Socket events được emit từ backend nhưng không được lắng nghe đúng cách ở frontend.

## Nguyên nhân

1. **Frontend**: Sử dụng `window.addEventListener` thay vì `socketService.on()`
2. **SocketService**: Thiếu listeners cho events `new_cancellation_request` và `cancellation_request_processed`
3. **Backend**: Sử dụng `io.emit()` (broadcast tới tất cả) thay vì `emitToAdmins()` (chỉ tới admin room)

## Giải pháp

### 1. Backend - Socket Handler Helper Functions

**File**: `server/utils/socketHandler.js`

Thêm 2 helper functions mới:

```javascript
const notifyCancellationRequestCreated = (requestData) => {
  console.log("📢 [socketHandler] notifyCancellationRequestCreated called");

  const userInfo =
    requestData.userId && typeof requestData.userId === "object"
      ? {
          _id: requestData.userId._id,
          fullName: requestData.userId.fullName,
          email: requestData.userId.email
        }
      : null;

  const eventData = {
    request: {
      _id: requestData._id,
      bookingId: requestData.bookingId,
      userId: requestData.userId,
      user: userInfo,
      bookingType: requestData.bookingType,
      reason: requestData.reason,
      status: requestData.status,
      createdAt: requestData.createdAt
    },
    message: `Yêu cầu hủy ${requestData.bookingType} mới từ ${
      userInfo?.fullName || "người dùng"
    }`,
    timestamp: new Date()
  };

  emitToAdmins("new_cancellation_request", eventData);
};

const notifyCancellationRequestProcessed = (requestData, processStatus) => {
  console.log("📢 [socketHandler] notifyCancellationRequestProcessed called");

  const userInfo =
    requestData.userId && typeof requestData.userId === "object"
      ? {
          _id: requestData.userId._id,
          fullName: requestData.userId.fullName,
          email: requestData.userId.email
        }
      : null;

  const eventData = {
    request: {
      _id: requestData._id,
      bookingId: requestData.bookingId,
      userId: requestData.userId,
      user: userInfo,
      bookingType: requestData.bookingType,
      reason: requestData.reason,
      status: requestData.status,
      adminNote: requestData.adminNote,
      processedAt: requestData.processedAt
    },
    status: processStatus,
    timestamp: new Date()
  };

  emitToAdmins("cancellation_request_processed", eventData);

  // Thông báo cho user đã gửi yêu cầu
  const userIdToNotify =
    typeof requestData.userId === "object"
      ? requestData.userId._id
      : requestData.userId;

  emitToUser(userIdToNotify, "cancellation_request_processed", eventData);
};
```

Export functions:

```javascript
module.exports = {
  // ... existing exports
  notifyCancellationRequestCreated,
  notifyCancellationRequestProcessed
};
```

### 2. Backend - Cập nhật Routes

**File**: `server/routes/cancellationrequests.js`

Import helper functions:

```javascript
const {
  notifyCancellationRequestCreated,
  notifyCancellationRequestProcessed
} = require("../utils/socketHandler");
```

**Route POST (Create request)**:

```javascript
// TRƯỚC (emit broadcast tất cả)
const io = req.app.get("io");
if (io) {
  io.emit("new_cancellation_request", {
    request: cancellationRequest,
    message: `Yêu cầu hủy ${booking.bookingType} mới từ ${
      req.user.fullName || "người dùng"
    }`
  });
}

// SAU (emit chỉ tới admin room)
notifyCancellationRequestCreated(cancellationRequest);
```

**Route PUT /approve**:

```javascript
// TRƯỚC
const io = req.app.get("io");
if (io) {
  io.emit("cancellation_request_processed", {
    request,
    status: "approved"
  });
}

// SAU
notifyCancellationRequestProcessed(request, "approved");
```

**Route PUT /reject**:

```javascript
// TRƯỚC
const io = req.app.get("io");
if (io) {
  io.emit("cancellation_request_processed", {
    request,
    status: "rejected"
  });
}

// SAU
notifyCancellationRequestProcessed(request, "rejected");
```

### 3. Frontend - Socket Service

**File**: `client/src/services/socketService.ts`

Thêm listeners cho cancellation events trong `setupEventListeners()`:

```typescript
// Cancellation request events
this.socket.on("new_cancellation_request", (data: any) => {
  console.log(
    "📩 [socketService] Received new_cancellation_request from server"
  );
  this.emit("new_cancellation_request", data);
});

this.socket.on("cancellation_request_processed", (data: any) => {
  console.log(
    "📩 [socketService] Received cancellation_request_processed from server"
  );
  this.emit("cancellation_request_processed", data);
});
```

### 4. Frontend - Admin Page

**File**: `client/src/app/admin/cancellation-requests/page.tsx`

**TRƯỚC** (sử dụng window events - KHÔNG HOẠT ĐỘNG):

```typescript
const { isConnected } = useSocket();

useEffect(() => {
  if (!isConnected) return;

  const handleNewRequest = () => {
    loadRequests();
    toast.info("Có yêu cầu hủy mới!");
  };

  window.addEventListener("new_cancellation_request", handleNewRequest);

  return () => {
    window.removeEventListener("new_cancellation_request", handleNewRequest);
  };
}, [isConnected]);
```

**SAU** (sử dụng socketService - HOẠT ĐỘNG):

```typescript
const { isConnected, socketService } = useSocket();

useEffect(() => {
  if (!isConnected || !socketService) return;

  const handleNewRequest = (data: any) => {
    console.log("🎉 New cancellation request received:", data);
    loadRequests();
    toast.info("Có yêu cầu hủy mới!", {
      description: data.message || "Vui lòng kiểm tra và xử lý"
    });
  };

  const handleRequestProcessed = (data: any) => {
    console.log("✅ Cancellation request processed:", data);
    loadRequests();
  };

  // Listen to socket events
  socketService.on("new_cancellation_request", handleNewRequest);
  socketService.on("cancellation_request_processed", handleRequestProcessed);

  return () => {
    socketService.off("new_cancellation_request", handleNewRequest);
    socketService.off("cancellation_request_processed", handleRequestProcessed);
  };
}, [isConnected, socketService]);
```

### 5. Frontend - Admin Sidebar

**File**: `client/src/components/Admin/AdminSidebar.tsx`

Cập nhật tương tự như admin page:

```typescript
const { isConnected, socketService } = useSocket();

useEffect(() => {
  if (!isConnected || !socketService) return;

  const handleNewRequest = (data: any) => {
    console.log("🔔 AdminSidebar: New cancellation request:", data);
    loadPendingCount();
  };

  const handleRequestProcessed = (data: any) => {
    console.log("🔔 AdminSidebar: Request processed:", data);
    loadPendingCount();
  };

  socketService.on("new_cancellation_request", handleNewRequest);
  socketService.on("cancellation_request_processed", handleRequestProcessed);

  return () => {
    socketService.off("new_cancellation_request", handleNewRequest);
    socketService.off("cancellation_request_processed", handleRequestProcessed);
  };
}, [isConnected, socketService]);
```

## Luồng hoạt động

### Khi user gửi yêu cầu hủy:

1. **User** → POST `/api/cancellationrequests`
2. **Backend** → Lưu vào DB → Populate data
3. **Backend** → `notifyCancellationRequestCreated(request)`
4. **Socket** → `emitToAdmins('new_cancellation_request', eventData)`
5. **All Admins** → Nhận event qua socketService
6. **Admin Page** → Reload requests + Show toast
7. **Admin Sidebar** → Update badge count

### Khi admin xử lý yêu cầu:

1. **Admin** → PUT `/api/cancellationrequests/:id/approve` hoặc `/reject`
2. **Backend** → Update DB → Populate data
3. **Backend** → `notifyCancellationRequestProcessed(request, status)`
4. **Socket** →
   - `emitToAdmins('cancellation_request_processed', eventData)`
   - `emitToUser(userId, 'cancellation_request_processed', eventData)`
5. **All Admins** → Reload requests
6. **Specific User** → Nhận thông báo (nếu online)

## Debugging

### Backend logs:

- `📢 [socketHandler] notifyCancellationRequestCreated called`
- `📤 [socketHandler] Emitting new_cancellation_request to admin_room`

### Frontend logs (socketService):

- `📩 [socketService] Received new_cancellation_request from server`
- `🔔 [socketService] Emitting new_cancellation_request to X listeners`

### Frontend logs (components):

- `🎉 New cancellation request received: {...}`
- `🔔 AdminSidebar: New cancellation request: {...}`

## Testing

### Test case 1: User gửi yêu cầu hủy

1. Mở 2 tabs: User page + Admin page
2. User: Gửi yêu cầu hủy booking
3. **Kỳ vọng**: Admin page hiển thị toast "Có yêu cầu hủy mới!"
4. **Kỳ vọng**: Admin sidebar badge counter tăng lên
5. **Kỳ vọng**: Request mới xuất hiện ở top của list

### Test case 2: Admin xử lý yêu cầu

1. Admin: Approve hoặc Reject request
2. **Kỳ vọng**: Request tự động update status
3. **Kỳ vọng**: Sidebar badge counter giảm xuống
4. **Kỳ vọng**: User (nếu online) nhận notification

### Test case 3: Multiple admins

1. Mở 2 tabs admin khác nhau
2. User gửi yêu cầu hủy
3. **Kỳ vọng**: CẢ 2 admin tabs đều nhận notification
4. Admin 1 approve request
5. **Kỳ vọng**: CẢ 2 admin tabs đều update

## Lưu ý

- ✅ Socket events chỉ emit tới `admin_room`, không broadcast tất cả
- ✅ Admin tự động join `admin_room` khi connect (trong socketHandler)
- ✅ Frontend phải dùng `socketService.on()`, KHÔNG dùng `window.addEventListener()`
- ✅ Luôn destructure `socketService` từ `useSocket()` hook
- ✅ Check `isConnected && socketService` trước khi setup listeners
- ✅ Cleanup listeners trong useEffect return function

## Benefits

🎯 **Real-time notifications**: Admin nhận thông báo ngay lập tức
🎯 **Auto-refresh**: Data tự động reload không cần F5
🎯 **Better UX**: Toast notifications + Badge counter
🎯 **Scalable**: Hoạt động với nhiều admin cùng lúc
🎯 **Clean code**: Sử dụng helper functions, dễ maintain
