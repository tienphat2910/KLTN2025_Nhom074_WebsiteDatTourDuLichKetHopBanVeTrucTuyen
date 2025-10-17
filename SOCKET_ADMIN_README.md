# Socket Integration for Admin Panel

Hệ thống socket đã được tích hợp vào admin panel để cung cấp real-time updates và notifications.

## Tính năng

### 1. Real-time Notifications

- Thông báo khi có người dùng mới đăng ký
- Thông báo khi có đặt chỗ mới
- Thông báo khi thanh toán hoàn tất
- Thông báo khi trạng thái người dùng thay đổi
- Cảnh báo hệ thống

### 2. Live Dashboard Updates

- Thống kê người dùng cập nhật real-time
- Feed hoạt động real-time
- Connection status indicator

### 3. Admin Communication

- Gửi thông báo đến người dùng cụ thể
- Broadcast thông điệp hệ thống
- Tham gia phòng admin riêng

## Cách sử dụng

### Client Side

```typescript
import { socketService } from "@/services/socketService";

// Kết nối socket (tự động khi admin đăng nhập)
socketService.connect(token);

// Lắng nghe events
socketService.on("user_registered", (data) => {
  console.log("New user:", data.user);
});

// Gửi thông báo
socketService.sendNotificationToUser(userId, {
  title: "Thông báo",
  message: "Nội dung thông báo",
  type: "info"
});

// Broadcast message
socketService.broadcastSystemMessage("Hệ thống bảo trì", "warning");
```

### Server Side

Socket events được tự động emit từ các routes:

- `auth.js`: `notifyUserRegistered()` khi user đăng ký
- `users.js`: `notifyUserStatusChanged()` khi ban/unban user
- Các routes khác có thể thêm socket notifications tương tự

## Components

### AdminLayout

- Tích hợp socket connection
- Hiển thị notification dropdown
- Connection status indicator

### RecentActivities

- Component hiển thị hoạt động real-time
- Tự động cập nhật khi có events

### DashboardOverview

- Stats cập nhật real-time
- Sử dụng RecentActivities component

## Socket Events

### Client Events (từ server)

- `user_registered`: Người dùng mới đăng ký
- `booking_created`: Đặt chỗ mới
- `payment_completed`: Thanh toán hoàn tất
- `user_status_changed`: Trạng thái user thay đổi
- `system_alert`: Cảnh báo hệ thống
- `new_notification`: Thông báo cá nhân

### Server Events (từ client)

- `join_admin_room`: Tham gia phòng admin
- `leave_admin_room`: Rời phòng admin
- `send_notification`: Gửi thông báo đến user
- `broadcast_system_message`: Broadcast message

## Cấu trúc Files

```
server/
├── utils/
│   └── socketHandler.js          # Socket server logic
├── routes/
│   ├── auth.js                   # User registration notifications
│   └── users.js                  # User status change notifications

client/
├── services/
│   └── socketService.ts          # Socket client service
├── hooks/
│   └── useSocket.ts              # Socket hook
├── components/Admin/
│   ├── AdminLayout.tsx           # Main admin layout with notifications
│   ├── RecentActivities.tsx      # Real-time activity feed
│   └── DashboardOverview.tsx     # Dashboard with live updates
```

## Bảo mật

- JWT authentication cho socket connections
- Admin role verification
- User-specific rooms
- Admin-only broadcast permissions

## Performance

- Auto-reconnection với exponential backoff
- Connection status monitoring
- Event cleanup khi component unmount
- Limited notification history (50 items max)
