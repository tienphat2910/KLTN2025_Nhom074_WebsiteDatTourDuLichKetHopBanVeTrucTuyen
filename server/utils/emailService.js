const nodemailer = require('nodemailer');
const { auth } = require('../config/firebase');
const { sendEmailVerification, sendPasswordResetEmail } = require('firebase/auth');

// Create nodemailer transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email using nodemailer
const sendOTPEmail = async (email, otp, type = 'verification') => {
    try {
        const transporter = createTransporter();

        const subject = type === 'verification'
            ? 'Mã xác thực email - LuTrip'
            : 'Mã đặt lại mật khẩu - LuTrip';

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f4f6f9;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        .header img {
            width: 120px;
            margin-bottom: 15px;
        }
        .header h1 {
            margin: 0;
            font-size: 26px;
        }
        .content {
            padding: 30px 25px;
            color: #333;
        }
        .content h2 {
            margin-top: 0;
            color: #444;
        }
        .otp-box {
            background: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 6px;
        }
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
        }
        .footer {
            background: #667eea;
            text-align: center;
            color: white;
            padding: 15px;
            font-size: 14px;
        }
        .footer a {
            color: #ffd369;
            text-decoration: none;
            font-weight: 500;
        }
        @media screen and (max-width: 600px) {
            .container {
                margin: 15px;
            }
            .content {
                padding: 20px;
            }
            .otp-code {
                font-size: 28px;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <img src="https://res.cloudinary.com/de5rurcwt/image/upload/v1760700010/logo-lutrip_vdnkd3.png" alt="LuTrip Logo" />
            <h1>LuTrip</h1>
            <p>${type === 'verification' ? 'Xác thực email của bạn' : 'Đặt lại mật khẩu'}</p>
        </div>

        <!-- Content -->
        <div class="content">
            <h2>Xin chào!</h2>
            <p>${type === 'verification'
                ? 'Cảm ơn bạn đã đăng ký tài khoản LuTrip. Để hoàn tất quá trình đăng ký, vui lòng nhập mã OTP bên dưới:'
                : 'Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhập mã OTP bên dưới để tiếp tục:'
            }</p>

            <div class="otp-box">
                <p style="margin:0; color:#666;">Mã OTP của bạn là:</p>
                <div class="otp-code">${otp}</div>
                <p style="margin:0; color:#666; font-size: 14px;">Mã có hiệu lực trong 10 phút</p>
            </div>

            <div class="warning">
                <strong>⚠️ Lưu ý:</strong>
                <ul style="margin:10px 0 0 0; padding-left:18px;">
                    <li>Không chia sẻ mã này với bất kỳ ai</li>
                    <li>LuTrip sẽ không bao giờ yêu cầu mã OTP qua điện thoại hoặc email</li>
                    <li>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này</li>
                </ul>
            </div>

            <p>Nếu bạn gặp bất kỳ vấn đề gì, vui lòng liên hệ với chúng tôi.</p>
            <p>Trân trọng,<br><strong>Đội ngũ LuTrip</strong></p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>© ${new Date().getFullYear()} LuTrip - Khám phá Việt Nam</p>
            <p><a href="${process.env.CLIENT_URL}">Truy cập website</a></p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `"LuTrip" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent to: ${email}`);
        return true;
    } catch (error) {
        console.error('Send OTP email error:', error);
        console.log(`\n🔐 OTP for ${email}: ${otp} (${type})`);
        console.log(`⏰ Valid for 10 minutes\n`);
        return false;
    }
};

// Send verification email using Firebase Auth (legacy - kept for compatibility)
const sendFirebaseVerificationEmail = async (user) => {
    try {
        const actionCodeSettings = {
            url: process.env.CLIENT_URL + '/email-verified',
            handleCodeInApp: false
        };

        await sendEmailVerification(user, actionCodeSettings);
        console.log(`✅ Verification email sent to: ${user.email}`);
        return true;
    } catch (error) {
        console.error('Firebase verification email error:', error);
        return false;
    }
};

// Send password reset email using Firebase Auth (legacy - kept for compatibility)
const sendPasswordResetEmailFirebase = async (email) => {
    try {
        const actionCodeSettings = {
            url: process.env.CLIENT_URL + '/reset-password',
            handleCodeInApp: false
        };

        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        console.log(`✅ Password reset email sent to: ${email}`);
        return true;
    } catch (error) {
        console.error('Firebase password reset email error:', error);
        return false;
    }
};

// Custom email logging function (for dev only)
const sendCustomEmail = async (email, subject, htmlContent) => {
    try {
        console.log(`\n===== CUSTOM EMAIL =====`);
        console.log(`To: ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content: ${htmlContent}`);
        console.log(`========================\n`);

        return true;
    } catch (error) {
        console.error('Custom email send error:', error);
        return false;
    }
};

// Format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

// Format date
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatDateOnly = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Send Tour Booking Confirmation Email
const sendTourBookingEmail = async (userEmail, bookingData) => {
    try {
        const transporter = createTransporter();

        // Debug log
        console.log('📧 Tour booking email data:', {
            tourTitle: bookingData.tourBooking.tourId?.title || bookingData.tourBooking.tourId?.name,
            destination: bookingData.tourBooking.tourId?.destinationId?.name || bookingData.tourBooking.tourId?.destination?.name,
            duration: bookingData.tourBooking.tourId?.duration,
            paymentMethod: bookingData.tourBooking.paymentMethod
        });

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
        .container { max-width: 650px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; color: white; }
        .header img { width: 100px; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .success-icon { text-align: center; padding: 20px; }
        .success-icon svg { width: 80px; height: 80px; }
        .content { padding: 0 30px 30px; color: #333; }
        .booking-id { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .booking-id strong { color: #667eea; font-size: 18px; }
        .info-section { margin: 25px 0; }
        .info-section h3 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 8px; margin-bottom: 15px; }
        .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .info-label { flex: 0 0 40%; color: #666; font-weight: 500; }
        .info-value { flex: 1; color: #333; }
        .total-price { background: #f0f9ff; border: 2px solid #667eea; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
        .total-price .label { color: #666; font-size: 14px; margin-bottom: 5px; }
        .total-price .amount { color: #667eea; font-size: 28px; font-weight: bold; }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-confirmed { background: #d1ecf1; color: #0c5460; }
        .participant-item { background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #667eea; }
        .footer { background: #667eea; text-align: center; color: white; padding: 20px; font-size: 14px; }
        .footer a { color: #ffd369; text-decoration: none; }
        @media screen and (max-width: 600px) {
            .container { margin: 15px; }
            .content { padding: 0 20px 20px; }
            .info-row { flex-direction: column; }
            .info-label { margin-bottom: 5px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/de5rurcwt/image/upload/v1760700010/logo-lutrip_vdnkd3.png" alt="LuTrip Logo" />
            <h1>LuTrip - Khám phá Việt Nam</h1>
            <p>Xác nhận đặt tour thành công</p>
        </div>

        <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        </div>

        <div class="content">
            <h2 style="text-align: center; color: #28a745;">Đặt tour thành công!</h2>
            <p style="text-align: center; color: #666;">Cảm ơn bạn đã đặt tour tại LuTrip. Dưới đây là chi tiết đơn hàng của bạn:</p>

            <div class="booking-id">
                <div>Mã đặt tour: <strong>#${bookingData.booking._id.toString().slice(-8).toUpperCase()}</strong></div>
                <div style="margin-top: 8px;">Trạng thái: <span class="status-badge status-${bookingData.booking.status}">${bookingData.booking.status === 'pending' ? 'Chờ xác nhận' : bookingData.booking.status === 'confirmed' ? 'Đã xác nhận' : 'Hoàn thành'}</span></div>
            </div>

            <div class="info-section">
                <h3>📍 Thông tin Tour</h3>
                <div class="info-row">
                    <div class="info-label">Tên tour:</div>
                    <div class="info-value"><strong>${bookingData.tourBooking.tourId.title || bookingData.tourBooking.tourId.name || 'N/A'}</strong></div>
                </div>
                <div class="info-row">
                    <div class="info-label">Điểm đến:</div>
                    <div class="info-value">${bookingData.tourBooking.tourId.destinationId?.name || bookingData.tourBooking.tourId.destination?.name || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Thời gian:</div>
                    <div class="info-value">${bookingData.tourBooking.tourId.duration || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Ngày khởi hành:</div>
                    <div class="info-value">${formatDateOnly(bookingData.tourBooking.departureDate)}</div>
                </div>
                ${bookingData.tourBooking.tourId.tourGuide ? `
                <div class="info-row">
                    <div class="info-label">Hướng dẫn viên:</div>
                    <div class="info-value">${bookingData.tourBooking.tourId.tourGuide}</div>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h3>👥 Thông tin Khách hàng</h3>
                <div class="info-row">
                    <div class="info-label">Họ tên:</div>
                    <div class="info-value">${bookingData.user.fullName}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${bookingData.user.email}</div>
                </div>
                ${bookingData.user.phone ? `
                <div class="info-row">
                    <div class="info-label">Số điện thoại:</div>
                    <div class="info-value">${bookingData.user.phone}</div>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h3>👨‍👩‍👧‍👦 Danh sách Người tham gia (${bookingData.tourBooking.numAdults + bookingData.tourBooking.numChildren})</h3>
                <div class="info-row">
                    <div class="info-label">Người lớn:</div>
                    <div class="info-value">${bookingData.tourBooking.numAdults} người × ${formatCurrency(bookingData.tourBooking.pricePerAdult)}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Trẻ em:</div>
                    <div class="info-value">${bookingData.tourBooking.numChildren} người × ${formatCurrency(bookingData.tourBooking.pricePerChild)}</div>
                </div>
                ${bookingData.tourBooking.participants && bookingData.tourBooking.participants.length > 0 ? `
                <div style="margin-top: 15px;">
                    <strong>Chi tiết người tham gia:</strong>
                    ${bookingData.tourBooking.participants.map((p, idx) => `
                    <div class="participant-item">
                        <strong>${idx + 1}. ${p.fullName}</strong> - ${p.age} tuổi
                        ${p.note ? `<div style="margin-top: 5px; color: #666; font-size: 13px;">Ghi chú: ${p.note}</div>` : ''}
                    </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h3>💰 Thông tin Thanh toán</h3>
                <div class="info-row">
                    <div class="info-label">Phương thức:</div>
                    <div class="info-value">${bookingData.tourBooking.paymentMethod === 'momo' ? 'MoMo' :
                bookingData.tourBooking.paymentMethod === 'zalopay' ? 'ZaloPay' :
                    bookingData.tourBooking.paymentMethod === 'cash' ? 'Tiền mặt' :
                        bookingData.tourBooking.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
                            'Chưa xác định'
            }</div>
                </div>
                ${bookingData.tourBooking.note ? `
                <div class="info-row">
                    <div class="info-label">Ghi chú:</div>
                    <div class="info-value">${bookingData.tourBooking.note}</div>
                </div>
                ` : ''}
            </div>

            <div class="total-price">
                <div class="label">Tổng tiền</div>
                <div class="amount">${formatCurrency(bookingData.booking.totalPrice)}</div>
            </div>

            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong>📌 Lưu ý quan trọng:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 18px; line-height: 1.6;">
                    <li>Vui lòng mang theo CMND/CCCD khi tham gia tour</li>
                    <li>Có mặt đúng giờ tại điểm khởi hành</li>
                    <li>Liên hệ hotline nếu cần hỗ trợ: <strong>1900-xxxx</strong></li>
                </ul>
            </div>

            <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL}/profile/booking" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Xem chi tiết đơn hàng</a>
            </p>
        </div>

        <div class="footer">
            <p>© ${new Date().getFullYear()} LuTrip - Khám phá Việt Nam</p>
            <p><a href="${process.env.CLIENT_URL}">Truy cập website</a> | <a href="${process.env.CLIENT_URL}/support">Hỗ trợ</a></p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `"LuTrip" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `✅ Xác nhận đặt tour #${bookingData.booking._id.toString().slice(-8).toUpperCase()} - LuTrip`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Tour booking confirmation email sent to: ${userEmail}`);
        return true;
    } catch (error) {
        console.error('Send tour booking email error:', error);
        return false;
    }
};

// Send Activity Booking Confirmation Email
const sendActivityBookingEmail = async (userEmail, bookingData) => {
    try {
        const transporter = createTransporter();

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
        .container { max-width: 650px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px 20px; text-align: center; color: white; }
        .header img { width: 100px; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .success-icon { text-align: center; padding: 20px; }
        .success-icon svg { width: 80px; height: 80px; }
        .content { padding: 0 30px 30px; color: #333; }
        .booking-id { background: #f8f9fa; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .booking-id strong { color: #f97316; font-size: 18px; }
        .info-section { margin: 25px 0; }
        .info-section h3 { color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 8px; margin-bottom: 15px; }
        .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .info-label { flex: 0 0 40%; color: #666; font-weight: 500; }
        .info-value { flex: 1; color: #333; }
        .total-price { background: #fff7ed; border: 2px solid #f97316; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
        .total-price .label { color: #666; font-size: 14px; margin-bottom: 5px; }
        .total-price .amount { color: #f97316; font-size: 28px; font-weight: bold; }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-confirmed { background: #d1ecf1; color: #0c5460; }
        .footer { background: #f97316; text-align: center; color: white; padding: 20px; font-size: 14px; }
        .footer a { color: #ffd369; text-decoration: none; }
        @media screen and (max-width: 600px) {
            .container { margin: 15px; }
            .content { padding: 0 20px 20px; }
            .info-row { flex-direction: column; }
            .info-label { margin-bottom: 5px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/de5rurcwt/image/upload/v1760700010/logo-lutrip_vdnkd3.png" alt="LuTrip Logo" />
            <h1>LuTrip - Khám phá Việt Nam</h1>
            <p>Xác nhận đặt hoạt động thành công</p>
        </div>

        <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        </div>

        <div class="content">
            <h2 style="text-align: center; color: #28a745;">Đặt hoạt động thành công!</h2>
            <p style="text-align: center; color: #666;">Cảm ơn bạn đã đặt hoạt động tại LuTrip. Dưới đây là chi tiết đơn hàng của bạn:</p>

            <div class="booking-id">
                <div>Mã đặt hoạt động: <strong>#${bookingData.booking._id.toString().slice(-8).toUpperCase()}</strong></div>
                <div style="margin-top: 8px;">Trạng thái: <span class="status-badge status-${bookingData.activityBooking.status}">${bookingData.activityBooking.status === 'pending' ? 'Chờ xác nhận' : bookingData.activityBooking.status === 'confirmed' ? 'Đã xác nhận' : 'Hoàn thành'}</span></div>
            </div>

            <div class="info-section">
                <h3>🎯 Thông tin Hoạt động</h3>
                <div class="info-row">
                    <div class="info-label">Tên hoạt động:</div>
                    <div class="info-value"><strong>${bookingData.activityBooking.activityId.name}</strong></div>
                </div>
                <div class="info-row">
                    <div class="info-label">Địa điểm:</div>
                    <div class="info-value">${bookingData.activityBooking.activityId.destinationId?.name || bookingData.activityBooking.activityId.destination?.name || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Ngày tham gia:</div>
                    <div class="info-value">${formatDateOnly(bookingData.activityBooking.scheduledDate)}</div>
                </div>
                ${typeof bookingData.activityBooking.activityId.location === 'object' && bookingData.activityBooking.activityId.location.address ? `
                <div class="info-row">
                    <div class="info-label">Địa chỉ:</div>
                    <div class="info-value">${bookingData.activityBooking.activityId.location.address}</div>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h3>👥 Thông tin Khách hàng</h3>
                <div class="info-row">
                    <div class="info-label">Họ tên:</div>
                    <div class="info-value">${bookingData.user.fullName}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${bookingData.user.email}</div>
                </div>
                ${bookingData.user.phone ? `
                <div class="info-row">
                    <div class="info-label">Số điện thoại:</div>
                    <div class="info-value">${bookingData.user.phone}</div>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h3>👨‍👩‍👧‍👦 Số lượng Vé</h3>
                <div class="info-row">
                    <div class="info-label">Người lớn:</div>
                    <div class="info-value">${bookingData.activityBooking.numAdults} vé</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Trẻ em:</div>
                    <div class="info-value">${bookingData.activityBooking.numChildren} vé</div>
                </div>
                ${bookingData.activityBooking.numSeniors > 0 ? `
                <div class="info-row">
                    <div class="info-label">Người cao tuổi:</div>
                    <div class="info-value">${bookingData.activityBooking.numSeniors} vé</div>
                </div>
                ` : ''}
                ${bookingData.activityBooking.numBabies > 0 ? `
                <div class="info-row">
                    <div class="info-label">Em bé:</div>
                    <div class="info-value">${bookingData.activityBooking.numBabies} vé</div>
                </div>
                ` : ''}
                <div class="info-row" style="border-top: 2px solid #f97316; margin-top: 10px; padding-top: 10px;">
                    <div class="info-label"><strong>Tổng số vé:</strong></div>
                    <div class="info-value"><strong>${bookingData.activityBooking.numAdults + bookingData.activityBooking.numChildren + bookingData.activityBooking.numSeniors + bookingData.activityBooking.numBabies} vé</strong></div>
                </div>
            </div>

            <div class="info-section">
                <h3>💰 Thông tin Thanh toán</h3>
                <div class="info-row">
                    <div class="info-label">Phương thức:</div>
                    <div class="info-value">${bookingData.activityBooking.paymentMethod === 'momo' ? 'MoMo' :
                bookingData.activityBooking.paymentMethod === 'zalopay' ? 'ZaloPay' :
                    bookingData.activityBooking.paymentMethod === 'cash' ? 'Tiền mặt' :
                        bookingData.activityBooking.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
                            'Chưa xác định'
            }</div>
                </div>
                ${bookingData.activityBooking.price?.retail?.adult > 0 ? `
                <div class="info-row">
                    <div class="info-label">Giá người lớn:</div>
                    <div class="info-value">${formatCurrency(bookingData.activityBooking.price.retail.adult)}</div>
                </div>
                ` : ''}
                ${bookingData.activityBooking.price?.retail?.child > 0 ? `
                <div class="info-row">
                    <div class="info-label">Giá trẻ em:</div>
                    <div class="info-value">${formatCurrency(bookingData.activityBooking.price.retail.child)}</div>
                </div>
                ` : ''}
                ${bookingData.activityBooking.note ? `
                <div class="info-row">
                    <div class="info-label">Ghi chú:</div>
                    <div class="info-value">${bookingData.activityBooking.note}</div>
                </div>
                ` : ''}
            </div>

            <div class="total-price">
                <div class="label">Tổng tiền</div>
                <div class="amount">${formatCurrency(bookingData.activityBooking.subtotal)}</div>
            </div>

            ${bookingData.activityBooking.qrCode ? `
            <div class="info-section" style="text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h3 style="margin-bottom: 15px;">🎫 Mã QR Check-in</h3>
                <img src="${bookingData.activityBooking.qrCode}" alt="QR Code" style="width: 200px; height: 200px; margin: 10px auto; display: block; border: 2px solid #ddd; border-radius: 8px; padding: 10px; background: white;">
                <p style="margin-top: 10px; color: #666; font-size: 14px;">Vui lòng xuất trình mã QR này khi check-in</p>
                <p style="color: #666; font-size: 13px;">Mã booking: <strong>${bookingData.booking._id.toString().slice(-8).toUpperCase()}</strong></p>
            </div>
            ` : ''}

            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong>📌 Lưu ý quan trọng:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 18px; line-height: 1.6;">
                    <li>Vui lòng mang theo CMND/CCCD và email xác nhận này</li>
                    <li>Có mặt trước 15 phút để làm thủ tục</li>
                    <li>Liên hệ hotline nếu cần hỗ trợ: <strong>1900-xxxx</strong></li>
                </ul>
            </div>

            <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL}/profile/booking" style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Xem chi tiết đơn hàng</a>
            </p>
        </div>

        <div class="footer">
            <p>© ${new Date().getFullYear()} LuTrip - Khám phá Việt Nam</p>
            <p><a href="${process.env.CLIENT_URL}">Truy cập website</a> | <a href="${process.env.CLIENT_URL}/support">Hỗ trợ</a></p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `"LuTrip" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `✅ Xác nhận đặt hoạt động #${bookingData.booking._id.toString().slice(-8).toUpperCase()} - LuTrip`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Activity booking confirmation email sent to: ${userEmail}`);
        return true;
    } catch (error) {
        console.error('Send activity booking email error:', error);
        return false;
    }
};

// Send Flight Booking Confirmation Email
const sendFlightBookingEmail = async (userEmail, bookingData) => {
    try {
        const transporter = createTransporter();

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
        .container { max-width: 650px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; color: white; }
        .header img { width: 100px; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .success-icon { text-align: center; padding: 20px; }
        .success-icon svg { width: 80px; height: 80px; }
        .content { padding: 0 30px 30px; color: #333; }
        .booking-id { background: #f8f9fa; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .booking-id strong { color: #10b981; font-size: 18px; }
        .flight-route { background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .flight-route .airports { display: flex; justify-content: space-around; align-items: center; margin: 15px 0; }
        .flight-route .airport { flex: 1; }
        .flight-route .airport-code { font-size: 32px; font-weight: bold; color: #10b981; }
        .flight-route .airport-name { color: #666; font-size: 14px; margin-top: 5px; }
        .flight-route .arrow { flex: 0 0 60px; color: #10b981; font-size: 24px; }
        .info-section { margin: 25px 0; }
        .info-section h3 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-bottom: 15px; }
        .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .info-label { flex: 0 0 40%; color: #666; font-weight: 500; }
        .info-value { flex: 1; color: #333; }
        .total-price { background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
        .total-price .label { color: #666; font-size: 14px; margin-bottom: 5px; }
        .total-price .amount { color: #10b981; font-size: 28px; font-weight: bold; }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-confirmed { background: #d1ecf1; color: #0c5460; }
        .passenger-item { background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #10b981; }
        .footer { background: #10b981; text-align: center; color: white; padding: 20px; font-size: 14px; }
        .footer a { color: #ffd369; text-decoration: none; }
        @media screen and (max-width: 600px) {
            .container { margin: 15px; }
            .content { padding: 0 20px 20px; }
            .info-row { flex-direction: column; }
            .info-label { margin-bottom: 5px; }
            .flight-route .airports { flex-direction: column; }
            .flight-route .arrow { transform: rotate(90deg); margin: 10px 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/de5rurcwt/image/upload/v1760700010/logo-lutrip_vdnkd3.png" alt="LuTrip Logo" />
            <h1>LuTrip - Khám phá Việt Nam</h1>
            <p>Xác nhận đặt vé máy bay thành công</p>
        </div>

        <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        </div>

        <div class="content">
            <h2 style="text-align: center; color: #28a745;">Đặt vé máy bay thành công!</h2>
            <p style="text-align: center; color: #666;">Cảm ơn bạn đã đặt vé tại LuTrip. Dưới đây là chi tiết đơn hàng của bạn:</p>

            <div class="booking-id">
                <div>Mã đặt vé: <strong>#${bookingData.booking._id.toString().slice(-8).toUpperCase()}</strong></div>
                <div style="margin-top: 8px;">Trạng thái: <span class="status-badge status-${bookingData.flightBooking.status}">${bookingData.flightBooking.status === 'pending' ? 'Chờ xác nhận' : bookingData.flightBooking.status === 'confirmed' ? 'Đã xác nhận' : 'Hoàn thành'}</span></div>
            </div>

            <div class="flight-route">
                <div><strong>Thông tin chuyến bay</strong></div>
                <div class="airports">
                    <div class="airport">
                        <div class="airport-code">${bookingData.flightBooking.flightId.departureAirport.iata}</div>
                        <div class="airport-name">${bookingData.flightBooking.flightId.departureAirport.city}</div>
                        <div style="margin-top: 10px; font-size: 16px; font-weight: 500;">${formatDate(bookingData.flightBooking.flightId.departureTime)}</div>
                    </div>
                    <div class="arrow">✈️</div>
                    <div class="airport">
                        <div class="airport-code">${bookingData.flightBooking.flightId.arrivalAirport.iata}</div>
                        <div class="airport-name">${bookingData.flightBooking.flightId.arrivalAirport.city}</div>
                        <div style="margin-top: 10px; font-size: 16px; font-weight: 500;">${formatDate(bookingData.flightBooking.flightId.arrivalTime)}</div>
                    </div>
                </div>
                <div style="color: #666; font-size: 14px; margin-top: 10px;">
                    Thời gian bay: ${bookingData.flightBooking.flightId.duration}
                </div>
            </div>

            <div class="info-section">
                <h3>✈️ Chi tiết Chuyến bay</h3>
                <div class="info-row">
                    <div class="info-label">Số hiệu:</div>
                    <div class="info-value"><strong>${bookingData.flightBooking.flightId.flightCode}</strong></div>
                </div>
                <div class="info-row">
                    <div class="info-label">Hãng bay:</div>
                    <div class="info-value">${bookingData.flightBooking.flightId.airline.name}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Hạng vé:</div>
                    <div class="info-value">${bookingData.flightBooking.flightClassId.className}</div>
                </div>
                ${bookingData.flightBooking.flightId.aircraft ? `
                <div class="info-row">
                    <div class="info-label">Loại máy bay:</div>
                    <div class="info-value">${bookingData.flightBooking.flightId.aircraft}</div>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h3>👥 Thông tin Khách hàng</h3>
                <div class="info-row">
                    <div class="info-label">Họ tên:</div>
                    <div class="info-value">${bookingData.user.fullName}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${bookingData.user.email}</div>
                </div>
                ${bookingData.user.phone ? `
                <div class="info-row">
                    <div class="info-label">Số điện thoại:</div>
                    <div class="info-value">${bookingData.user.phone}</div>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h3>👨‍👩‍👧‍👦 Danh sách Hành khách (${bookingData.flightBooking.passengers?.length || bookingData.flightBooking.numTickets})</h3>
                <div class="info-row">
                    <div class="info-label">Số lượng vé:</div>
                    <div class="info-value">${bookingData.flightBooking.numTickets} vé × ${formatCurrency(bookingData.flightBooking.pricePerTicket)}</div>
                </div>
                ${bookingData.flightBooking.passengers && bookingData.flightBooking.passengers.length > 0 ? `
                <div style="margin-top: 15px;">
                    <strong>Chi tiết hành khách:</strong>
                    ${bookingData.flightBooking.passengers.map((p, idx) => `
                    <div class="passenger-item">
                        <strong>${idx + 1}. ${p.fullName}</strong>
                        <div style="margin-top: 5px; color: #666; font-size: 13px;">
                            Ngày sinh: ${formatDateOnly(p.dateOfBirth)} | Giới tính: ${p.gender === 'male' || p.gender === 'Male' || p.gender === 'Nam' ? 'Nam' : 'Nữ'}
                            ${p.passportNumber ? ` | Hộ chiếu: ${p.passportNumber}` : ''}
                            ${p.seatNumber ? ` | Ghế: ${p.seatNumber}` : ''}
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h3>💰 Thông tin Thanh toán</h3>
                <div class="info-row">
                    <div class="info-label">Phương thức:</div>
                    <div class="info-value">${bookingData.flightBooking.paymentMethod === 'momo' ? 'MoMo' :
                bookingData.flightBooking.paymentMethod === 'zalopay' ? 'ZaloPay' :
                    bookingData.flightBooking.paymentMethod === 'cash' ? 'Tiền mặt' :
                        bookingData.flightBooking.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
                            'Chưa xác định'
            }</div>
                </div>
                ${bookingData.flightBooking.discountAmount > 0 ? `
                <div class="info-row">
                    <div class="info-label">Giảm giá:</div>
                    <div class="info-value" style="color: #dc2626;">-${formatCurrency(bookingData.flightBooking.discountAmount)}</div>
                </div>
                ` : ''}
                ${bookingData.flightBooking.note ? `
                <div class="info-row">
                    <div class="info-label">Ghi chú:</div>
                    <div class="info-value">${bookingData.flightBooking.note}</div>
                </div>
                ` : ''}
            </div>

            <div class="total-price">
                <div class="label">Tổng tiền</div>
                <div class="amount">${formatCurrency(bookingData.flightBooking.totalFlightPrice)}</div>
            </div>

            ${bookingData.flightBooking.qrCode ? `
            <div class="info-section" style="text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h3 style="margin-bottom: 15px;">🎫 Mã QR Boarding Pass</h3>
                <img src="${bookingData.flightBooking.qrCode}" alt="QR Code" style="width: 200px; height: 200px; margin: 10px auto; display: block; border: 2px solid #ddd; border-radius: 8px; padding: 10px; background: white;">
                <p style="margin-top: 10px; color: #666; font-size: 14px;">Vui lòng xuất trình mã QR này khi check-in</p>
                <p style="color: #666; font-size: 13px;">Mã chuyến bay: <strong>${bookingData.flightBooking.flightCode}</strong></p>
            </div>
            ` : ''}

            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong>📌 Lưu ý quan trọng:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 18px; line-height: 1.6;">
                    <li>Có mặt tại sân bay trước 2 giờ (chuyến quốc tế) hoặc 1.5 giờ (chuyến nội địa)</li>
                    <li>Mang theo CMND/CCCD hoặc hộ chiếu hợp lệ</li>
                    <li>In hoặc lưu email xác nhận này để làm thủ tục</li>
                    <li>Liên hệ hotline nếu cần hỗ trợ: <strong>1900-xxxx</strong></li>
                </ul>
            </div>

            <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL}/profile/booking" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Xem chi tiết đơn hàng</a>
            </p>
        </div>

        <div class="footer">
            <p>© ${new Date().getFullYear()} LuTrip - Khám phá Việt Nam</p>
            <p><a href="${process.env.CLIENT_URL}">Truy cập website</a> | <a href="${process.env.CLIENT_URL}/support">Hỗ trợ</a></p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `"LuTrip" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `✈️ Xác nhận đặt vé máy bay #${bookingData.booking._id.toString().slice(-8).toUpperCase()} - LuTrip`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Flight booking confirmation email sent to: ${userEmail}`);
        return true;
    } catch (error) {
        console.error('Send flight booking email error:', error);
        return false;
    }
};

// Send Cancellation Request Submitted Email
const sendCancellationRequestSubmittedEmail = async (userEmail, requestData) => {
    try {
        const transporter = createTransporter();

        const bookingTypeLabel =
            requestData.bookingType === 'tour' ? 'Tour du lịch' :
                requestData.bookingType === 'activity' ? 'Hoạt động' :
                    requestData.bookingType === 'flight' ? 'Chuyến bay' : 'Đơn hàng';

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
        .container { max-width: 650px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px 20px; text-align: center; color: white; }
        .header img { width: 100px; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .icon { text-align: center; padding: 20px; }
        .icon svg { width: 80px; height: 80px; }
        .content { padding: 0 30px 30px; color: #333; }
        .request-id { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .request-id strong { color: #d97706; font-size: 18px; }
        .info-section { margin: 25px 0; }
        .info-section h3 { color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-bottom: 15px; }
        .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .info-label { flex: 0 0 40%; color: #666; font-weight: 500; }
        .info-value { flex: 1; color: #333; }
        .reason-box { background: #f8f9fa; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .footer { background: #f59e0b; text-align: center; color: white; padding: 20px; font-size: 14px; }
        .footer a { color: #ffd369; text-decoration: none; }
        @media screen and (max-width: 600px) {
            .container { margin: 15px; }
            .content { padding: 0 20px 20px; }
            .info-row { flex-direction: column; }
            .info-label { margin-bottom: 5px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/de5rurcwt/image/upload/v1760700010/logo-lutrip_vdnkd3.png" alt="LuTrip Logo" />
            <h1>LuTrip - Khám phá Việt Nam</h1>
            <p>Yêu cầu hủy đơn hàng</p>
        </div>

        <div class="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        </div>

        <div class="content">
            <h2 style="text-align: center; color: #f59e0b;">Yêu cầu hủy đã được gửi</h2>
            <p style="text-align: center; color: #666;">Chúng tôi đã nhận được yêu cầu hủy đơn hàng của bạn và sẽ xử lý trong thời gian sớm nhất.</p>

            <div class="request-id">
                <div>Mã yêu cầu: <strong>#${requestData._id.toString().slice(-8).toUpperCase()}</strong></div>
                <div style="margin-top: 8px;">Loại: <strong>${bookingTypeLabel}</strong></div>
                <div style="margin-top: 8px;">Trạng thái: <strong style="color: #f59e0b;">Đang chờ xử lý</strong></div>
            </div>

            <div class="info-section">
                <h3>📋 Thông tin yêu cầu</h3>
                <div class="info-row">
                    <div class="info-label">Mã đơn hàng:</div>
                    <div class="info-value"><strong>#${requestData.bookingId._id ? requestData.bookingId._id.toString().slice(-8).toUpperCase() : 'N/A'}</strong></div>
                </div>
                <div class="info-row">
                    <div class="info-label">Loại đơn hàng:</div>
                    <div class="info-value">${bookingTypeLabel}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Ngày gửi yêu cầu:</div>
                    <div class="info-value">${formatDate(requestData.createdAt)}</div>
                </div>
                ${requestData.bookingId && requestData.bookingId.totalPrice ? `
                <div class="info-row">
                    <div class="info-label">Giá trị đơn hàng:</div>
                    <div class="info-value"><strong>${formatCurrency(requestData.bookingId.totalPrice)}</strong></div>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h3>💬 Lý do hủy</h3>
                <div class="reason-box">
                    ${requestData.reason}
                </div>
            </div>

            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong>ℹ️ Thông tin quan trọng:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 18px; line-height: 1.6;">
                    <li>Yêu cầu của bạn sẽ được xem xét và xử lý trong vòng 24-48 giờ làm việc</li>
                    <li>Chúng tôi sẽ gửi email thông báo kết quả xử lý đến bạn</li>
                    <li>Nếu được chấp nhận, số tiền sẽ được hoàn lại theo chính sách hoàn tiền của LuTrip</li>
                    <li>Liên hệ hotline <strong>1900-xxxx</strong> nếu cần hỗ trợ thêm</li>
                </ul>
            </div>

            <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL}/profile/booking" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Xem đơn hàng của tôi</a>
            </p>

            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
            <p>Trân trọng,<br><strong>Đội ngũ LuTrip</strong></p>
        </div>

        <div class="footer">
            <p>© ${new Date().getFullYear()} LuTrip - Khám phá Việt Nam</p>
            <p><a href="${process.env.CLIENT_URL}">Truy cập website</a> | <a href="${process.env.CLIENT_URL}/support">Hỗ trợ</a></p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `"LuTrip" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `📨 Đã nhận yêu cầu hủy #${requestData._id.toString().slice(-8).toUpperCase()} - LuTrip`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Cancellation request submitted email sent to: ${userEmail}`);
        return true;
    } catch (error) {
        console.error('Send cancellation request submitted email error:', error);
        return false;
    }
};

// Send Cancellation Request Approved Email
const sendCancellationRequestApprovedEmail = async (userEmail, requestData) => {
    try {
        const transporter = createTransporter();

        const bookingTypeLabel =
            requestData.bookingType === 'tour' ? 'Tour du lịch' :
                requestData.bookingType === 'activity' ? 'Hoạt động' :
                    requestData.bookingType === 'flight' ? 'Chuyến bay' : 'Đơn hàng';

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
        .container { max-width: 650px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; color: white; }
        .header img { width: 100px; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .success-icon { text-align: center; padding: 20px; }
        .success-icon svg { width: 80px; height: 80px; }
        .content { padding: 0 30px 30px; color: #333; }
        .request-id { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .request-id strong { color: #059669; font-size: 18px; }
        .info-section { margin: 25px 0; }
        .info-section h3 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-bottom: 15px; }
        .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .info-label { flex: 0 0 40%; color: #666; font-weight: 500; }
        .info-value { flex: 1; color: #333; }
        .note-box { background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .footer { background: #10b981; text-align: center; color: white; padding: 20px; font-size: 14px; }
        .footer a { color: #ffd369; text-decoration: none; }
        @media screen and (max-width: 600px) {
            .container { margin: 15px; }
            .content { padding: 0 20px 20px; }
            .info-row { flex-direction: column; }
            .info-label { margin-bottom: 5px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/de5rurcwt/image/upload/v1760700010/logo-lutrip_vdnkd3.png" alt="LuTrip Logo" />
            <h1>LuTrip - Khám phá Việt Nam</h1>
            <p>Yêu cầu hủy đã được chấp nhận</p>
        </div>

        <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        </div>

        <div class="content">
            <h2 style="text-align: center; color: #10b981;">Yêu cầu hủy đã được chấp nhận!</h2>
            <p style="text-align: center; color: #666;">Yêu cầu hủy đơn hàng của bạn đã được xem xét và chấp nhận. Đơn hàng đã được hủy thành công.</p>

            <div class="request-id">
                <div>Mã yêu cầu: <strong>#${requestData._id.toString().slice(-8).toUpperCase()}</strong></div>
                <div style="margin-top: 8px;">Loại: <strong>${bookingTypeLabel}</strong></div>
                <div style="margin-top: 8px;">Trạng thái: <strong style="color: #10b981;">✓ Đã chấp nhận</strong></div>
            </div>

            <div class="info-section">
                <h3>📋 Thông tin yêu cầu</h3>
                <div class="info-row">
                    <div class="info-label">Mã đơn hàng:</div>
                    <div class="info-value"><strong>#${requestData.bookingId._id ? requestData.bookingId._id.toString().slice(-8).toUpperCase() : 'N/A'}</strong></div>
                </div>
                <div class="info-row">
                    <div class="info-label">Loại đơn hàng:</div>
                    <div class="info-value">${bookingTypeLabel}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Ngày gửi yêu cầu:</div>
                    <div class="info-value">${formatDate(requestData.createdAt)}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Ngày xử lý:</div>
                    <div class="info-value">${formatDate(requestData.processedAt)}</div>
                </div>
                ${requestData.bookingId && requestData.bookingId.totalPrice ? `
                <div class="info-row">
                    <div class="info-label">Giá trị đơn hàng:</div>
                    <div class="info-value"><strong>${formatCurrency(requestData.bookingId.totalPrice)}</strong></div>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h3>💬 Lý do hủy của bạn</h3>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 3px solid #10b981;">
                    ${requestData.reason}
                </div>
            </div>

            ${requestData.adminNote ? `
            <div class="info-section">
                <h3>📝 Ghi chú từ LuTrip</h3>
                <div class="note-box">
                    ${requestData.adminNote}
                </div>
            </div>
            ` : ''}

            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong>💰 Thông tin hoàn tiền:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 18px; line-height: 1.6;">
                    <li>Số tiền sẽ được hoàn lại theo chính sách hoàn tiền của LuTrip</li>
                    <li>Thời gian hoàn tiền: 7-14 ngày làm việc tùy theo phương thức thanh toán</li>
                    <li>Bạn sẽ nhận được thông báo khi giao dịch hoàn tiền hoàn tất</li>
                    <li>Liên hệ hotline <strong>1900-xxxx</strong> nếu cần hỗ trợ</li>
                </ul>
            </div>

            <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL}/profile/booking" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Xem đơn hàng của tôi</a>
            </p>

            <p>Cảm ơn bạn đã sử dụng dịch vụ của LuTrip. Chúng tôi hy vọng được phục vụ bạn trong tương lai!</p>
            <p>Trân trọng,<br><strong>Đội ngũ LuTrip</strong></p>
        </div>

        <div class="footer">
            <p>© ${new Date().getFullYear()} LuTrip - Khám phá Việt Nam</p>
            <p><a href="${process.env.CLIENT_URL}">Truy cập website</a> | <a href="${process.env.CLIENT_URL}/support">Hỗ trợ</a></p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `"LuTrip" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `✅ Yêu cầu hủy đã được chấp nhận #${requestData._id.toString().slice(-8).toUpperCase()} - LuTrip`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Cancellation request approved email sent to: ${userEmail}`);
        return true;
    } catch (error) {
        console.error('Send cancellation request approved email error:', error);
        return false;
    }
};

// Send Cancellation Request Rejected Email
const sendCancellationRequestRejectedEmail = async (userEmail, requestData) => {
    try {
        const transporter = createTransporter();

        const bookingTypeLabel =
            requestData.bookingType === 'tour' ? 'Tour du lịch' :
                requestData.bookingType === 'activity' ? 'Hoạt động' :
                    requestData.bookingType === 'flight' ? 'Chuyến bay' : 'Đơn hàng';

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
        .container { max-width: 650px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 20px; text-align: center; color: white; }
        .header img { width: 100px; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .icon { text-align: center; padding: 20px; }
        .icon svg { width: 80px; height: 80px; }
        .content { padding: 0 30px 30px; color: #333; }
        .request-id { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .request-id strong { color: #dc2626; font-size: 18px; }
        .info-section { margin: 25px 0; }
        .info-section h3 { color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 8px; margin-bottom: 15px; }
        .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .info-label { flex: 0 0 40%; color: #666; font-weight: 500; }
        .info-value { flex: 1; color: #333; }
        .note-box { background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .footer { background: #ef4444; text-align: center; color: white; padding: 20px; font-size: 14px; }
        .footer a { color: #ffd369; text-decoration: none; }
        @media screen and (max-width: 600px) {
            .container { margin: 15px; }
            .content { padding: 0 20px 20px; }
            .info-row { flex-direction: column; }
            .info-label { margin-bottom: 5px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/de5rurcwt/image/upload/v1760700010/logo-lutrip_vdnkd3.png" alt="LuTrip Logo" />
            <h1>LuTrip - Khám phá Việt Nam</h1>
            <p>Yêu cầu hủy đã bị từ chối</p>
        </div>

        <div class="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        </div>

        <div class="content">
            <h2 style="text-align: center; color: #ef4444;">Yêu cầu hủy đã bị từ chối</h2>
            <p style="text-align: center; color: #666;">Rất tiếc, yêu cầu hủy đơn hàng của bạn không được chấp nhận. Vui lòng xem lý do bên dưới.</p>

            <div class="request-id">
                <div>Mã yêu cầu: <strong>#${requestData._id.toString().slice(-8).toUpperCase()}</strong></div>
                <div style="margin-top: 8px;">Loại: <strong>${bookingTypeLabel}</strong></div>
                <div style="margin-top: 8px;">Trạng thái: <strong style="color: #ef4444;">✗ Đã từ chối</strong></div>
            </div>

            <div class="info-section">
                <h3>📋 Thông tin yêu cầu</h3>
                <div class="info-row">
                    <div class="info-label">Mã đơn hàng:</div>
                    <div class="info-value"><strong>#${requestData.bookingId._id ? requestData.bookingId._id.toString().slice(-8).toUpperCase() : 'N/A'}</strong></div>
                </div>
                <div class="info-row">
                    <div class="info-label">Loại đơn hàng:</div>
                    <div class="info-value">${bookingTypeLabel}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Ngày gửi yêu cầu:</div>
                    <div class="info-value">${formatDate(requestData.createdAt)}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Ngày xử lý:</div>
                    <div class="info-value">${formatDate(requestData.processedAt)}</div>
                </div>
                ${requestData.bookingId && requestData.bookingId.totalPrice ? `
                <div class="info-row">
                    <div class="info-label">Giá trị đơn hàng:</div>
                    <div class="info-value"><strong>${formatCurrency(requestData.bookingId.totalPrice)}</strong></div>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h3>💬 Lý do hủy của bạn</h3>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 3px solid #6b7280;">
                    ${requestData.reason}
                </div>
            </div>

            <div class="info-section">
                <h3>📝 Lý do từ chối</h3>
                <div class="note-box">
                    <strong>${requestData.adminNote || 'Yêu cầu hủy không đáp ứng chính sách hoàn hủy của LuTrip.'}</strong>
                </div>
            </div>

            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong>ℹ️ Thông tin quan trọng:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 18px; line-height: 1.6;">
                    <li>Đơn hàng của bạn vẫn còn hiệu lực và chưa bị hủy</li>
                    <li>Vui lòng kiểm tra chính sách hủy và hoàn tiền của LuTrip</li>
                    <li>Nếu bạn có thắc mắc, vui lòng liên hệ bộ phận chăm sóc khách hàng</li>
                    <li>Hotline hỗ trợ: <strong>1900-xxxx</strong> (24/7)</li>
                </ul>
            </div>

            <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL}/profile/booking" style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Xem đơn hàng của tôi</a>
            </p>

            <p>Cảm ơn bạn đã sử dụng dịch vụ của LuTrip. Chúng tôi rất tiếc vì sự bất tiện này.</p>
            <p>Trân trọng,<br><strong>Đội ngũ LuTrip</strong></p>
        </div>

        <div class="footer">
            <p>© ${new Date().getFullYear()} LuTrip - Khám phá Việt Nam</p>
            <p><a href="${process.env.CLIENT_URL}">Truy cập website</a> | <a href="${process.env.CLIENT_URL}/support">Hỗ trợ</a></p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `"LuTrip" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `❌ Yêu cầu hủy đã bị từ chối #${requestData._id.toString().slice(-8).toUpperCase()} - LuTrip`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Cancellation request rejected email sent to: ${userEmail}`);
        return true;
    } catch (error) {
        console.error('Send cancellation request rejected email error:', error);
        return false;
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail,
    sendFirebaseVerificationEmail,
    sendPasswordResetEmailFirebase,
    sendCustomEmail,
    sendTourBookingEmail,
    sendActivityBookingEmail,
    sendFlightBookingEmail,
    sendCancellationRequestSubmittedEmail,
    sendCancellationRequestApprovedEmail,
    sendCancellationRequestRejectedEmail
};
