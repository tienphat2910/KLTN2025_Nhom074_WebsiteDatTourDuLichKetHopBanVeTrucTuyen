# Hướng dẫn cài đặt chức năng Xuất Excel và Báo cáo

## 📦 Cài đặt thư viện

Chạy lệnh sau trong thư mục `client`:

```bash
npm install xlsx
```

## ✨ Các chức năng đã thêm

### 1. Xuất Excel (handleExportExcel)

- **File**: `client/src/app/admin/bookings/page.tsx`
- **Chức năng**: Xuất danh sách bookings ra file Excel
- **Nội dung file Excel**:

  - **Sheet 1 - Bookings**: Danh sách chi tiết tất cả bookings

    - STT
    - Mã Booking
    - Khách hàng
    - Email
    - Số điện thoại
    - Loại booking
    - Trạng thái
    - Tổng tiền
    - Ngày đặt
    - Cập nhật

  - **Sheet 2 - Thống kê**: Tổng quan thống kê
    - Tổng booking
    - Chờ xác nhận
    - Đã xác nhận
    - Hoàn thành
    - Đã hủy
    - Tổng doanh thu

- **Tên file**: `Bookings_Report_YYYY-MM-DD.xlsx`
- **Icon**: Download
- **Màu**: Outline (trắng)

### 2. Tạo Báo cáo (handleGenerateReport)

- **File**: `client/src/app/admin/bookings/page.tsx`
- **Chức năng**: Tạo báo cáo phân tích chi tiết
- **Nội dung file báo cáo**:

  - **Sheet 1 - Tổng quan**:

    - Header báo cáo
    - Thống kê tổng quan
    - Phân tích:
      - Tỷ lệ hoàn thành
      - Tỷ lệ hủy
      - Doanh thu trung bình/booking

  - **Sheet 2 - Theo loại**:

    - Thống kê theo loại booking (Tour/Activity/Flight)
    - Số lượng, hoàn thành, doanh thu

  - **Sheet 3 - Theo trạng thái**:

    - Thống kê theo trạng thái
    - Số lượng và tỷ lệ phần trăm

  - **Sheet 4 - Chi tiết**:
    - Danh sách bookings đầy đủ

- **Tên file**: `Bao_Cao_Bookings_YYYY-MM-DD.xlsx`
- **Icon**: TrendingUp
- **Màu**: Primary (xanh)

## 🎯 Cách sử dụng

### 1. Xuất Excel nhanh

1. Vào trang Admin Bookings (`/admin/bookings`)
2. Lọc bookings theo ý muốn (status, type, search)
3. Click nút **"Xuất Excel"**
4. File Excel sẽ được tải xuống tự động

### 2. Tạo Báo cáo chi tiết

1. Vào trang Admin Bookings
2. Click nút **"Báo cáo"**
3. File báo cáo Excel với 4 sheets sẽ được tải xuống

## 🔧 Tính năng

### ✅ Đã implement:

- Dynamic import xlsx (chỉ load khi cần)
- Xuất bookings hiện tại (theo filter)
- Format tiền tệ VND
- Format ngày giờ Việt Nam
- Tự động set độ rộng cột
- Tạo nhiều sheets trong 1 file
- Phân tích thống kê tự động
- Tính tỷ lệ phần trăm
- Toast notifications

### 📊 Dữ liệu xuất ra:

- Tuân theo filter hiện tại (status, type, search)
- Định dạng tiếng Việt
- Bao gồm thống kê tổng quan
- Tính toán tự động các chỉ số

## 🎨 UI/UX

### Nút "Xuất Excel":

- Position: Header, bên phải
- Style: Outline button
- Icon: Download
- Tooltip: Hiện toast khi đang xuất và khi hoàn thành
- Filename: `Bookings_Report_2025-10-18.xlsx`

### Nút "Báo cáo":

- Position: Header, góc phải nhất
- Style: Primary button
- Icon: TrendingUp
- Tooltip: Hiện toast khi đang tạo và khi hoàn thành
- Filename: `Bao_Cao_Bookings_2025-10-18.xlsx`

## 📝 Lưu ý

1. **Thư viện xlsx**: Được import động, không làm tăng bundle size ban đầu
2. **Performance**: Xử lý nhanh ngay cả với nhiều bookings
3. **Responsive**: Hoạt động tốt trên mọi thiết bị
4. **Error handling**: Có try-catch và toast thông báo lỗi
5. **File naming**: Tự động thêm ngày vào tên file

## 🚀 Testing

1. Test xuất Excel với danh sách trống
2. Test xuất Excel với nhiều bookings
3. Test filter rồi xuất Excel
4. Test tạo báo cáo với đầy đủ data
5. Kiểm tra format trong Excel
6. Verify các công thức tính toán

## 💡 Mở rộng trong tương lai

- [ ] Thêm charts vào báo cáo (sử dụng exceljs)
- [ ] Export PDF
- [ ] Schedule tự động gửi báo cáo email
- [ ] Custom date range cho báo cáo
- [ ] Export theo template có sẵn
- [ ] Multi-language support
- [ ] Advanced filters trong báo cáo

## 🐛 Troubleshooting

### Lỗi: "Cannot find module 'xlsx'"

**Giải pháp**: Chạy `npm install xlsx` trong thư mục client

### Lỗi: File không tải xuống

**Giải pháp**:

1. Check browser console
2. Verify quyền write file trong browser
3. Thử browser khác

### Lỗi: Dữ liệu không đúng trong Excel

**Giải pháp**:

1. Reload trang và thử lại
2. Clear filters và export lại
3. Check console logs

## 📚 Tài liệu tham khảo

- [SheetJS Documentation](https://docs.sheetjs.com/)
- [xlsx npm package](https://www.npmjs.com/package/xlsx)
