"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import { authService } from "@/services/authService";

interface GoogleSignInButtonProps {
  mode?: "login" | "register";
}

export function GoogleSignInButton({
  mode = "login"
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { startLoading, stopLoading } = useLoading();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    startLoading("auth");

    try {
      // Dynamically import Firebase to avoid SSR issues
      const { auth, googleProvider } = await import("@/config/firebase");
      const { signInWithPopup } = await import("firebase/auth");

      // Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider);

      // Get ID token from Firebase
      const idToken = await result.user.getIdToken();

      console.log("🔐 Google Sign In - User:", result.user.email);
      console.log("🔑 Token length:", idToken.length);
      console.log(
        "📋 Token (for debugging):",
        idToken.substring(0, 50) + "..."
      );

      // For testing - uncomment to see full token
      // console.log("Full token:", idToken);

      // Send token to backend
      const response = await authService.googleSignIn(idToken);

      console.log("📡 Server response:", response);

      if (response.success && response.data?.user && response.data?.token) {
        const userData = {
          _id: response.data.user._id,
          id: response.data.user._id,
          email: response.data.user.email!,
          fullName: response.data.user.fullName!,
          avatar: response.data.user.avatar,
          phone: response.data.user.phone,
          role: response.data.user.role,
          isVerified: response.data.user.isVerified,
          firebaseUid: response.data.user.firebaseUid,
          lastLogin: response.data.user.lastLogin,
          createdAt: response.data.user.createdAt,
          updatedAt: response.data.user.updatedAt
        };

        login(userData, response.data.token);

        toast.success(response.message || "Đăng nhập thành công!", {
          description: `Chào mừng ${userData.fullName}!`,
          duration: 3000
        });

        // Redirect based on role
        if (userData.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
        toast.error("Đăng nhập thất bại", {
          description: response.message || "Vui lòng thử lại",
          duration: 3000
        });
      }
    } catch (error: any) {
      console.error("Google sign in error:", error);

      // Handle specific Firebase errors
      if (error.code === "auth/popup-closed-by-user") {
        toast.error("Đã hủy đăng nhập", {
          description: "Bạn đã đóng cửa sổ đăng nhập Google",
          duration: 2000
        });
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Popup bị chặn", {
          description: "Vui lòng cho phép popup trên trình duyệt",
          duration: 3000
        });
      } else {
        toast.error("Đăng nhập thất bại", {
          description: error.message || "Có lỗi xảy ra, vui lòng thử lại",
          duration: 3000
        });
      }
    } finally {
      setIsLoading(false);
      stopLoading();
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full bg-white border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 flex items-center justify-center space-x-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <div className="h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span>Đang xử lý...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>
            {mode === "login" ? "Đăng nhập với Google" : "Đăng ký với Google"}
          </span>
        </>
      )}
    </button>
  );
}
