# LuTrip - Travel Booking Platform

## Giới thiệu

**LuTrip** là hệ thống đặt tour, vé máy bay và vé giải trí cho du lịch Việt Nam. Dự án gồm 2 phần: **client** (Next.js + Tailwind CSS) và **server** (Node.js + Express + MongoDB).

---

## Cấu trúc thư mục

```
LuTrip/
├── client/      # Frontend Next.js
├── server/      # Backend Node.js/Express
├── .env         # (server) Biến môi trường
├── README.md    # Tài liệu hướng dẫn
```

---

## Yêu cầu hệ thống

- Node.js >= 18
- MongoDB Atlas (hoặc local)
- Tài khoản Cloudinary (để upload ảnh)
- Tài khoản Firebase (để xác thực email)

---

## Hướng dẫn cài đặt

### 1. Clone dự án

```bash
git clone https://github.com/tienphat2910/lutrip.git
cd lutrip
```

### 2. Cài đặt backend

```bash
cd server
npm install
```

#### Thiết lập biến môi trường

- Tạo file `.env` trong thư mục `server` (xem mẫu trong dự án).
- Điền thông tin MongoDB, Cloudinary, Firebase, Email...

### 3. Chạy backend

```bash
npm start
```
Hoặc (nếu dùng nodemon để tự động reload khi code thay đổi):
```bash
npm run dev
```
Server chạy tại: [http://localhost:5000](http://localhost:5000)

---

### 4. Cài đặt frontend

```bash
cd ../client
npm install
```

#### Thiết lập biến môi trường

- Tạo file `.env` trong thư mục `client` nếu cần (xem mẫu trong dự án).



## Các chức năng chính

- Đăng ký, đăng nhập, xác thực email (Firebase)
- Quản lý thông tin cá nhân, cập nhật avatar (Cloudinary)
- Đặt tour, vé máy bay, khách sạn, vé giải trí
- Tìm kiếm, lọc, xem chi tiết địa điểm/tour/khách sạn
- Giao diện responsive, tối ưu cho mobile


---

## Ghi chú

- Nếu gặp lỗi khi reload bị đăng xuất, kiểm tra lại cấu hình JWT, AuthContext và API backend.
- Đảm bảo các biến môi trường `.env` đã được điền đúng.
- Nếu upload ảnh không được, kiểm tra lại Cloudinary credentials.

---

Chúc bạn trải nghiệm hệ
