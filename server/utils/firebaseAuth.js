const { auth } = require('../config/firebase');
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, deleteUser } = require('firebase/auth');

// Create user in Firebase
const createFirebaseUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return {
            success: true,
            user: userCredential.user,
            uid: userCredential.user.uid
        };
    } catch (error) {
        console.error('Firebase create user error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Sign in Firebase user
const signInFirebaseUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return {
            success: true,
            user: userCredential.user,
            uid: userCredential.user.uid,
            emailVerified: userCredential.user.emailVerified
        };
    } catch (error) {
        console.error('Firebase sign in error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Send email verification
const sendFirebaseEmailVerification = async (user) => {
    try {
        const actionCodeSettings = {
            url: process.env.CLIENT_URL + '/email-verified',
            handleCodeInApp: false
        };

        await sendEmailVerification(user, actionCodeSettings);
        console.log(`✅ Verification email sent to: ${user.email}`);
        return { success: true };
    } catch (error) {
        console.error('Firebase send email verification error:', error);
        return { success: false, error: error.message };
    }
};

// Delete Firebase user
const deleteFirebaseUser = async (user) => {
    try {
        await deleteUser(user);
        return { success: true };
    } catch (error) {
        console.error('Firebase delete user error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    createFirebaseUser,
    signInFirebaseUser,
    sendFirebaseEmailVerification,
    deleteFirebaseUser
};
