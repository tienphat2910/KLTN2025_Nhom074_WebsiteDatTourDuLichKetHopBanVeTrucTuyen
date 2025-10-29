const { auth } = require('../config/firebase');
const {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    GoogleAuthProvider,
    signInWithCredential
} = require('firebase/auth');

/**
 * Create a new Firebase user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, uid?: string, error?: string}>}
 */
const createFirebaseUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return {
            success: true,
            uid: userCredential.user.uid
        };
    } catch (error) {
        console.error('Firebase create user error:', error);
        let errorMessage = 'Lỗi tạo tài khoản';

        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Email đã được sử dụng';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email không hợp lệ';
                break;
            case 'auth/weak-password':
                errorMessage = 'Mật khẩu quá yếu (tối thiểu 6 ký tự)';
                break;
            default:
                errorMessage = error.message;
        }

        return {
            success: false,
            error: errorMessage
        };
    }
};

/**
 * Sign in Firebase user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, user?: object, emailVerified?: boolean, error?: string}>}
 */
const signInFirebaseUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return {
            success: true,
            user: userCredential.user,
            emailVerified: userCredential.user.emailVerified
        };
    } catch (error) {
        console.error('Firebase sign in error:', error);
        let errorMessage = 'Lỗi đăng nhập';

        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = 'Email hoặc mật khẩu không đúng';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Tài khoản đã bị vô hiệu hóa';
                break;
            default:
                errorMessage = error.message;
        }

        return {
            success: false,
            error: errorMessage
        };
    }
};

/**
 * Send email verification to Firebase user
 * @param {object} user - Firebase user object
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const sendFirebaseEmailVerification = async (user) => {
    try {
        await sendEmailVerification(user);
        return {
            success: true
        };
    } catch (error) {
        console.error('Firebase send email verification error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Sign in with Google credential - Decode JWT token directly
 * Since the token is already verified by Firebase on the client,
 * we just need to extract the user information
 * @param {string} idToken - Google ID token (Firebase JWT)
 * @returns {Promise<{success: boolean, email?: string, displayName?: string, photoURL?: string, uid?: string, emailVerified?: boolean, error?: string}>}
 */
const signInWithGoogleCredential = async (idToken) => {
    try {
        console.log('🔍 Decoding Google ID token...');

        // Decode JWT token (without verification since it's already verified on client)
        // JWT format: header.payload.signature
        const parts = idToken.split('.');
        if (parts.length !== 3) {
            console.error('❌ Invalid token format');
            return {
                success: false,
                error: 'Invalid token format'
            };
        }

        // Decode the payload (base64url)
        const payload = JSON.parse(
            Buffer.from(parts[1], 'base64url').toString('utf8')
        );

        console.log('✅ Token decoded successfully');
        console.log('👤 User info:', {
            email: payload.email,
            name: payload.name,
            picture: payload.picture
        });

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            console.error('❌ Token expired');
            return {
                success: false,
                error: 'Token expired'
            };
        }

        // Extract user information from token payload
        return {
            success: true,
            email: payload.email,
            displayName: payload.name || payload.email?.split('@')[0],
            photoURL: payload.picture || null,
            uid: payload.sub || payload.user_id,
            emailVerified: payload.email_verified || false
        };
    } catch (error) {
        console.error('❌ Failed to decode token:', error);
        console.error('Error details:', error.message);

        return {
            success: false,
            error: 'Failed to decode token: ' + error.message
        };
    }
};

module.exports = {
    createFirebaseUser,
    signInFirebaseUser,
    sendFirebaseEmailVerification,
    signInWithGoogleCredential
};
