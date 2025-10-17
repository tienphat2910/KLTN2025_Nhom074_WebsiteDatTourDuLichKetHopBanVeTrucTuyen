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

module.exports = {
    generateOTP,
    sendOTPEmail,
    sendFirebaseVerificationEmail,
    sendPasswordResetEmailFirebase,
    sendCustomEmail
};
