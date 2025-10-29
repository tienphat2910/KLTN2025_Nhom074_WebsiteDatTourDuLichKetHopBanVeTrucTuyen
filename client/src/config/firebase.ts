import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBKVgtLLmDq87BODyVV5ejHM_CoZiRcO60",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "lutrip-29.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "lutrip-29",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "lutrip-29.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "852910477653",
  appId: process.env.FIREBASE_APP_ID || "1:852910477653:web:8fed9b883c56867cfe9fdc",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-0TM3XVVK99"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, auth, googleProvider };
