const { auth } = require('../config/firebase');
const { sendEmailVerification, sendPasswordResetEmail } = require('firebase/auth');

// Generate OTP (for internal tracking, but we'll use Firebase's email verification)
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email using Firebase Auth
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

// Send password reset email using Firebase Auth
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

// For development: Log OTP to console (Firebase handles actual email)
const sendOTPEmail = async (email, otp, type = 'verification') => {
    try {
        // Log to console for development
        console.log(`\n🔐 OTP for ${email}: ${otp} (${type})`);
        console.log(`⏰ Valid for 10 minutes\n`);
        return true;
    } catch (error) {
        console.error('OTP logging error:', error);
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
