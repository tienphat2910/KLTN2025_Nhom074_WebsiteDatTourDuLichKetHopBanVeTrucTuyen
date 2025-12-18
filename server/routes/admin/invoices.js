const express = require('express');
const Tour = require('../../models/Tour');
const Activity = require('../../models/Activity');
const BookingTour = require('../../models/BookingTour');
const BookingActivity = require('../../models/BookingActivity');
const Booking = require('../../models/Booking');
const admin = require('../../middleware/admin');
const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');
const router = express.Router();

/**
 * Get all tours with booking statistics
 */
router.get('/tours', admin, async (req, res) => {
    try {
        // Get all tours with destination info
        const tours = await Tour.find().populate('destinationId', 'name').lean();

        // Calculate statistics for each tour
        const tourInvoices = await Promise.all(
            tours.map(async (tour) => {
                // Get all bookings for this tour
                const bookingTours = await BookingTour.find({ tourId: tour._id })
                    .populate({
                        path: 'bookingId',
                        select: 'status totalPrice'
                    })
                    .lean();

                const totalBookings = bookingTours.length;
                const activeBookings = bookingTours.filter(bt => 
                    bt.bookingId && ['pending', 'confirmed'].includes(bt.bookingId.status)
                ).length;
                const completedBookings = bookingTours.filter(bt => 
                    bt.bookingId && bt.bookingId.status === 'completed'
                ).length;
                const cancelledBookings = bookingTours.filter(bt => 
                    bt.bookingId && bt.bookingId.status === 'cancelled'
                ).length;

                // Calculate total revenue (excluding cancelled bookings)
                const totalRevenue = bookingTours.reduce((sum, bt) => {
                    if (bt.bookingId && bt.bookingId.status !== 'cancelled') {
                        return sum + (bt.subtotal || 0);
                    }
                    return sum;
                }, 0);

                return {
                    _id: tour._id,
                    title: tour.title,
                    image: tour.image,
                    price: tour.price,
                    duration: tour.duration,
                    destinationId: tour.destinationId,
                    totalBookings,
                    totalRevenue,
                    activeBookings,
                    completedBookings,
                    cancelledBookings
                };
            })
        );

        // Sort by total revenue descending
        tourInvoices.sort((a, b) => b.totalRevenue - a.totalRevenue);

        res.json({
            success: true,
            data: tourInvoices
        });
    } catch (error) {
        console.error('❌ Get tour invoices error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu hóa đơn tour'
        });
    }
});

/**
 * Get all activities with booking statistics
 */
router.get('/activities', admin, async (req, res) => {
    try {
        // Get all activities
        const activities = await Activity.find().lean();

        // Calculate statistics for each activity
        const activityInvoices = await Promise.all(
            activities.map(async (activity) => {
                // Get all bookings for this activity
                const bookingActivities = await BookingActivity.find({ activityId: activity._id })
                    .populate({
                        path: 'bookingId',
                        select: 'status totalPrice'
                    })
                    .lean();

                const totalBookings = bookingActivities.length;
                const activeBookings = bookingActivities.filter(ba => 
                    ba.bookingId && ['pending', 'confirmed'].includes(ba.bookingId.status)
                ).length;
                const completedBookings = bookingActivities.filter(ba => 
                    ba.bookingId && ba.bookingId.status === 'completed'
                ).length;
                const cancelledBookings = bookingActivities.filter(ba => 
                    ba.bookingId && ba.bookingId.status === 'cancelled'
                ).length;

                // Calculate total revenue (excluding cancelled bookings)
                const totalRevenue = bookingActivities.reduce((sum, ba) => {
                    if (ba.bookingId && ba.bookingId.status !== 'cancelled') {
                        return sum + (ba.subtotal || 0);
                    }
                    return sum;
                }, 0);

                return {
                    _id: activity._id,
                    name: activity.name,
                    image: activity.image,
                    price: activity.price,
                    location: activity.location,
                    totalBookings,
                    totalRevenue,
                    activeBookings,
                    completedBookings,
                    cancelledBookings
                };
            })
        );

        // Sort by total revenue descending
        activityInvoices.sort((a, b) => b.totalRevenue - a.totalRevenue);

        res.json({
            success: true,
            data: activityInvoices
        });
    } catch (error) {
        console.error('❌ Get activity invoices error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu hóa đơn hoạt động'
        });
    }
});

/**
 * Get booking details for a specific tour
 */
router.get('/tours/:tourId', admin, async (req, res) => {
    try {
        const { tourId } = req.params;

        // Get tour info
        const tour = await Tour.findById(tourId).populate('destinationId', 'name').lean();
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tour'
            });
        }

        // Get all booking tours with user info
        const bookingTours = await BookingTour.find({ tourId })
            .populate({
                path: 'bookingId',
                populate: {
                    path: 'userId',
                    select: 'fullName email phone avatar'
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        // Format booking details
        const bookings = bookingTours
            .filter(bt => bt.bookingId && bt.bookingId.userId)
            .map(bt => ({
                _id: bt._id,
                bookingId: bt.bookingId._id,
                user: bt.bookingId.userId,
                bookingDate: bt.bookingId.bookingDate,
                status: bt.bookingId.status,
                paymentStatus: bt.bookingId.paymentStatus,
                totalPrice: bt.subtotal || bt.bookingId.totalPrice,
                numAdults: bt.numAdults,
                numChildren: bt.numChildren,
                numInfants: bt.numInfants,
                passengers: bt.passengers,
                note: bt.note,
                createdAt: bt.createdAt
            }));

        res.json({
            success: true,
            data: {
                tour: {
                    _id: tour._id,
                    title: tour.title,
                    image: tour.image,
                    price: tour.price,
                    duration: tour.duration,
                    destinationId: tour.destinationId
                },
                bookings
            }
        });
    } catch (error) {
        console.error('❌ Get tour bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu đặt tour'
        });
    }
});

/**
 * Get booking details for a specific activity
 */
router.get('/activities/:activityId', admin, async (req, res) => {
    try {
        const { activityId } = req.params;

        // Get activity info
        const activity = await Activity.findById(activityId).lean();
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hoạt động'
            });
        }

        // Get all booking activities with user info
        const bookingActivities = await BookingActivity.find({ activityId })
            .populate({
                path: 'bookingId',
                populate: {
                    path: 'userId',
                    select: 'fullName email phone avatar'
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        // Format booking details
        const bookings = bookingActivities
            .filter(ba => ba.bookingId && ba.bookingId.userId)
            .map(ba => ({
                _id: ba._id,
                bookingId: ba.bookingId._id,
                user: ba.bookingId.userId,
                bookingDate: ba.bookingId.bookingDate,
                status: ba.bookingId.status,
                paymentStatus: ba.bookingId.paymentStatus,
                totalPrice: ba.subtotal || ba.bookingId.totalPrice,
                quantity: ba.quantity,
                participants: ba.participants,
                note: ba.note,
                createdAt: ba.createdAt
            }));

        res.json({
            success: true,
            data: {
                activity: {
                    _id: activity._id,
                    name: activity.name,
                    image: activity.image,
                    price: activity.price,
                    location: activity.location
                },
                bookings
            }
        });
    } catch (error) {
        console.error('❌ Get activity bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu đặt hoạt động'
        });
    }
});

/**
 * Export Tour Customer List to PDF
 */
router.get('/tours/:tourId/export/pdf', admin, async (req, res) => {
    try {
        const { tourId } = req.params;

        // Get tour info
        const tour = await Tour.findById(tourId).populate('destinationId', 'name').lean();
        if (!tour) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tour' });
        }

        // Get all booking tours with user info
        const bookingTours = await BookingTour.find({ tourId })
            .populate({
                path: 'bookingId',
                populate: {
                    path: 'userId',
                    select: 'fullName displayName email phone'
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        const bookings = bookingTours.filter(bt => bt.bookingId && bt.bookingId.userId);

        // Generate HTML content
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'DejaVu Sans', Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #2563eb; margin-bottom: 10px; }
        h2 { text-align: center; color: #475569; margin-bottom: 30px; font-size: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #2563eb; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .status-confirmed { color: #059669; font-weight: bold; }
        .status-pending { color: #d97706; font-weight: bold; }
        .status-completed { color: #6366f1; font-weight: bold; }
        .status-cancelled { color: #dc2626; font-weight: bold; }
        .total { font-weight: bold; font-size: 16px; margin-top: 20px; text-align: right; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <h1>DANH SÁCH KHÁCH HÀNG</h1>
    <h2>${tour.title}</h2>
    <p><strong>Điểm đến:</strong> ${tour.destinationId?.name || 'N/A'}</p>
    <p><strong>Thời gian:</strong> ${tour.duration || 'N/A'}</p>
    <p><strong>Giá tour:</strong> ${tour.price.toLocaleString('vi-VN')} VND</p>
    <p><strong>Tổng số đặt chỗ:</strong> ${bookings.length}</p>
    
    <table>
        <thead>
            <tr>
                <th>STT</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Người lớn</th>
                <th>Trẻ em</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
            </tr>
        </thead>
        <tbody>
            ${bookings.map((bt, idx) => {
                const status = bt.bookingId.status;
                const statusClass = `status-${status}`;
                const statusText = {
                    pending: 'Chờ xử lý',
                    confirmed: 'Đã xác nhận',
                    completed: 'Hoàn thành',
                    cancelled: 'Đã hủy'
                }[status] || status;
                
                return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${bt.bookingId.userId.fullName || bt.bookingId.userId.displayName || 'N/A'}</td>
                    <td>${bt.bookingId.userId.email}</td>
                    <td>${bt.bookingId.userId.phone || 'N/A'}</td>
                    <td>${bt.numAdults || 0}</td>
                    <td>${bt.numChildren || 0}</td>
                    <td>${(bt.subtotal || 0).toLocaleString('vi-VN')} VND</td>
                    <td class="${statusClass}">${statusText}</td>
                </tr>
                `;
            }).join('')}
        </tbody>
    </table>
    
    <div class="total">
        Tổng doanh thu: ${bookings.reduce((sum, bt) => {
            if (bt.bookingId.status !== 'cancelled') {
                return sum + (bt.subtotal || 0);
            }
            return sum;
        }, 0).toLocaleString('vi-VN')} VND
    </div>
    
    <div class="footer">
        <p>Ngày xuất: ${new Date().toLocaleString('vi-VN')}</p>
    </div>
</body>
</html>
        `;

        // Generate PDF using Puppeteer (optimized)
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'domcontentloaded' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=DanhSachKhachHang_${tour.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('❌ Export tour PDF error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xuất PDF' });
    }
});

/**
 * Export Tour Customer List to Excel
 */
router.get('/tours/:tourId/export/excel', admin, async (req, res) => {
    try {
        const { tourId } = req.params;

        // Get tour info
        const tour = await Tour.findById(tourId).populate('destinationId', 'name').lean();
        if (!tour) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tour' });
        }

        // Get all booking tours with user info
        const bookingTours = await BookingTour.find({ tourId })
            .populate({
                path: 'bookingId',
                populate: {
                    path: 'userId',
                    select: 'fullName displayName email phone'
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        const bookings = bookingTours.filter(bt => bt.bookingId && bt.bookingId.userId);

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách khách hàng');

        // Add title
        worksheet.mergeCells('A1:H1');
        worksheet.getCell('A1').value = 'DANH SÁCH KHÁCH HÀNG';
        worksheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF2563eb' } };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;

        // Add tour info
        worksheet.mergeCells('A2:H2');
        worksheet.getCell('A2').value = tour.title;
        worksheet.getCell('A2').font = { size: 14, bold: true };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        worksheet.getCell('A3').value = `Điểm đến: ${tour.destinationId?.name || 'N/A'}`;
        worksheet.getCell('A4').value = `Thời gian: ${tour.duration || 'N/A'}`;
        worksheet.getCell('A5').value = `Giá tour: ${tour.price.toLocaleString('vi-VN')} VND`;
        worksheet.getCell('A6').value = `Tổng số đặt chỗ: ${bookings.length}`;

        // Add headers
        const headerRow = worksheet.getRow(8);
        headerRow.values = ['STT', 'Họ tên', 'Email', 'Điện thoại', 'Người lớn', 'Trẻ em', 'Tổng tiền', 'Trạng thái'];
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563eb' }
        };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.height = 25;

        // Add data
        bookings.forEach((bt, idx) => {
            const status = bt.bookingId.status;
            const statusText = {
                pending: 'Chờ xử lý',
                confirmed: 'Đã xác nhận',
                completed: 'Hoàn thành',
                cancelled: 'Đã hủy'
            }[status] || status;

            const row = worksheet.addRow([
                idx + 1,
                bt.bookingId.userId.fullName || bt.bookingId.userId.displayName || 'N/A',
                bt.bookingId.userId.email,
                bt.bookingId.userId.phone || 'N/A',
                bt.numAdults || 0,
                bt.numChildren || 0,
                bt.subtotal || 0,
                statusText
            ]);

            row.alignment = { vertical: 'middle' };
            if (idx % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF8FAFC' }
                };
            }
        });

        // Format currency column
        worksheet.getColumn(7).numFmt = '#,##0 "VND"';

        // Auto-fit columns
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            column.width = maxLength < 10 ? 10 : maxLength + 2;
        });

        // Add total
        const totalRow = worksheet.addRow([]);
        totalRow.getCell(6).value = 'Tổng doanh thu:';
        totalRow.getCell(6).font = { bold: true };
        totalRow.getCell(6).alignment = { horizontal: 'right' };
        totalRow.getCell(7).value = bookings.reduce((sum, bt) => {
            if (bt.bookingId.status !== 'cancelled') {
                return sum + (bt.subtotal || 0);
            }
            return sum;
        }, 0);
        totalRow.getCell(7).font = { bold: true };
        totalRow.getCell(7).numFmt = '#,##0 "VND"';

        // Add borders
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 8) {
                row.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=DanhSachKhachHang_${tour.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
        res.send(buffer);
    } catch (error) {
        console.error('❌ Export tour Excel error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xuất Excel' });
    }
});

/**
 * Export Activity Customer List to PDF
 */
router.get('/activities/:activityId/export/pdf', admin, async (req, res) => {
    try {
        const { activityId } = req.params;

        // Get activity info
        const activity = await Activity.findById(activityId).lean();
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hoạt động' });
        }

        // Get all booking activities with user info
        const bookingActivities = await BookingActivity.find({ activityId })
            .populate({
                path: 'bookingId',
                populate: {
                    path: 'userId',
                    select: 'fullName displayName email phone'
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        const bookings = bookingActivities.filter(ba => ba.bookingId && ba.bookingId.userId);

        const locationText = typeof activity.location === 'string' 
            ? activity.location 
            : activity.location?.name || activity.location?.address || 'N/A';

        const priceValue = typeof activity.price === 'number' 
            ? activity.price 
            : activity.price?.retail?.adult || 0;

        // Generate HTML content
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'DejaVu Sans', Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #2563eb; margin-bottom: 10px; }
        h2 { text-align: center; color: #475569; margin-bottom: 30px; font-size: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #2563eb; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .status-confirmed { color: #059669; font-weight: bold; }
        .status-pending { color: #d97706; font-weight: bold; }
        .status-completed { color: #6366f1; font-weight: bold; }
        .status-cancelled { color: #dc2626; font-weight: bold; }
        .total { font-weight: bold; font-size: 16px; margin-top: 20px; text-align: right; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <h1>DANH SÁCH KHÁCH HÀNG</h1>
    <h2>${activity.name}</h2>
    <p><strong>Địa điểm:</strong> ${locationText}</p>
    <p><strong>Giá:</strong> ${priceValue.toLocaleString('vi-VN')} VND</p>
    <p><strong>Tổng số đặt chỗ:</strong> ${bookings.length}</p>
    
    <table>
        <thead>
            <tr>
                <th>STT</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Số lượng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
            </tr>
        </thead>
        <tbody>
            ${bookings.map((ba, idx) => {
                const status = ba.bookingId.status;
                const statusClass = `status-${status}`;
                const statusText = {
                    pending: 'Chờ xử lý',
                    confirmed: 'Đã xác nhận',
                    completed: 'Hoàn thành',
                    cancelled: 'Đã hủy'
                }[status] || status;
                
                return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${ba.bookingId.userId.fullName || ba.bookingId.userId.displayName || 'N/A'}</td>
                    <td>${ba.bookingId.userId.email}</td>
                    <td>${ba.bookingId.userId.phone || 'N/A'}</td>
                    <td>${ba.quantity || 1}</td>
                    <td>${(ba.subtotal || 0).toLocaleString('vi-VN')} VND</td>
                    <td class="${statusClass}">${statusText}</td>
                </tr>
                `;
            }).join('')}
        </tbody>
    </table>
    
    <div class="total">
        Tổng doanh thu: ${bookings.reduce((sum, ba) => {
            if (ba.bookingId.status !== 'cancelled') {
                return sum + (ba.subtotal || 0);
            }
            return sum;
        }, 0).toLocaleString('vi-VN')} VND
    </div>
    
    <div class="footer">
        <p>Ngày xuất: ${new Date().toLocaleString('vi-VN')}</p>
    </div>
</body>
</html>
        `;

        // Generate PDF using Puppeteer (optimized)
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'domcontentloaded' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=DanhSachKhachHang_${activity.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('❌ Export activity PDF error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xuất PDF' });
    }
});

/**
 * Export Activity Customer List to Excel
 */
router.get('/activities/:activityId/export/excel', admin, async (req, res) => {
    try {
        const { activityId } = req.params;

        // Get activity info
        const activity = await Activity.findById(activityId).lean();
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hoạt động' });
        }

        // Get all booking activities with user info
        const bookingActivities = await BookingActivity.find({ activityId })
            .populate({
                path: 'bookingId',
                populate: {
                    path: 'userId',
                    select: 'fullName displayName email phone'
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        const bookings = bookingActivities.filter(ba => ba.bookingId && ba.bookingId.userId);

        const locationText = typeof activity.location === 'string' 
            ? activity.location 
            : activity.location?.name || activity.location?.address || 'N/A';

        const priceValue = typeof activity.price === 'number' 
            ? activity.price 
            : activity.price?.retail?.adult || 0;

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách khách hàng');

        // Add title
        worksheet.mergeCells('A1:G1');
        worksheet.getCell('A1').value = 'DANH SÁCH KHÁCH HÀNG';
        worksheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF2563eb' } };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;

        // Add activity info
        worksheet.mergeCells('A2:G2');
        worksheet.getCell('A2').value = activity.name;
        worksheet.getCell('A2').font = { size: 14, bold: true };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        worksheet.getCell('A3').value = `Địa điểm: ${locationText}`;
        worksheet.getCell('A4').value = `Giá: ${priceValue.toLocaleString('vi-VN')} VND`;
        worksheet.getCell('A5').value = `Tổng số đặt chỗ: ${bookings.length}`;

        // Add headers
        const headerRow = worksheet.getRow(7);
        headerRow.values = ['STT', 'Họ tên', 'Email', 'Điện thoại', 'Số lượng', 'Tổng tiền', 'Trạng thái'];
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563eb' }
        };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.height = 25;

        // Add data
        bookings.forEach((ba, idx) => {
            const status = ba.bookingId.status;
            const statusText = {
                pending: 'Chờ xử lý',
                confirmed: 'Đã xác nhận',
                completed: 'Hoàn thành',
                cancelled: 'Đã hủy'
            }[status] || status;

            const row = worksheet.addRow([
                idx + 1,
                ba.bookingId.userId.fullName || ba.bookingId.userId.displayName || 'N/A',
                ba.bookingId.userId.email,
                ba.bookingId.userId.phone || 'N/A',
                ba.quantity || 1,
                ba.subtotal || 0,
                statusText
            ]);

            row.alignment = { vertical: 'middle' };
            if (idx % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF8FAFC' }
                };
            }
        });

        // Format currency column
        worksheet.getColumn(6).numFmt = '#,##0 "VND"';

        // Auto-fit columns
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            column.width = maxLength < 10 ? 10 : maxLength + 2;
        });

        // Add total
        const totalRow = worksheet.addRow([]);
        totalRow.getCell(5).value = 'Tổng doanh thu:';
        totalRow.getCell(5).font = { bold: true };
        totalRow.getCell(5).alignment = { horizontal: 'right' };
        totalRow.getCell(6).value = bookings.reduce((sum, ba) => {
            if (ba.bookingId.status !== 'cancelled') {
                return sum + (ba.subtotal || 0);
            }
            return sum;
        }, 0);
        totalRow.getCell(6).font = { bold: true };
        totalRow.getCell(6).numFmt = '#,##0 "VND"';

        // Add borders
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 7) {
                row.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=DanhSachKhachHang_${activity.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
        res.send(buffer);
    } catch (error) {
        console.error('❌ Export activity Excel error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xuất Excel' });
    }
});

module.exports = router;
