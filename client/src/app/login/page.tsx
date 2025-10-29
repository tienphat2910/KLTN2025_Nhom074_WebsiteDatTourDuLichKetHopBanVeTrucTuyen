"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import { LoadingSpinner } from "@/components/Loading";
import { GoogleSignInButton } from "@/components/Auth";

export default function Login() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { startLoading, stopLoading } = useLoading();

  // Get redirect parameter
  const redirectPath = searchParams.get("redirect");
  const tokenExpired = searchParams.get("expired");

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    setIsVisible(true);

    // Show toast if token expired
    if (tokenExpired === "true") {
      toast.error("Phiên đăng nhập đã hết hạn", {
        description: "Vui lòng đăng nhập lại để tiếp tục",
        duration: 4000
      });
    }
  }, [tokenExpired]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    startLoading("auth");
    setError("");

    try {
      const result = await authService.login({
        email: formData.email,
        password: formData.password
      });

      if (
        result.success &&
        result.data &&
        result.data.user &&
        result.data.token &&
        result.data.user.email &&
        result.data.user.fullName
      ) {
        // Ensure required fields are present and properly typed
        const userData = {
          _id: result.data.user._id,
          id: result.data.user._id,
          email: result.data.user.email,
          fullName: result.data.user.fullName,
          avatar: result.data.user.avatar,
          phone: result.data.user.phone,
          role: result.data.user.role,
          isVerified: result.data.user.isVerified,
          firebaseUid: result.data.user.firebaseUid,
          lastLogin: result.data.user.lastLogin,
          createdAt: result.data.user.createdAt,
          updatedAt: result.data.user.updatedAt,
          dateOfBirth: result.data.user.dateOfBirth,
          address: result.data.user.address,
          bio: result.data.user.bio
        };

        login(userData, result.data.token);
        toast.success("Đăng nhập thành công!", {
          description: `Chào mừng ${result.data.user.fullName} trở lại!`,
          duration: 3000
        });

        // Redirect based on user role
        let targetPath = redirectPath;
        if (!targetPath) {
          switch (result.data.user.role) {
            case "admin":
              targetPath = "/admin";
              break;
            case "staff":
              targetPath = "/staff";
              break;
            case "user":
            default:
              targetPath = "/";
              break;
          }
        }
        router.push(decodeURIComponent(targetPath));
      } else {
        // Check if error is EMAIL_NOT_VERIFIED
        if (result.code === "EMAIL_NOT_VERIFIED") {
          toast.error("Email chưa được xác thực", {
            description: "Đang chuyển đến trang xác thực...",
            duration: 2000
          });
          setTimeout(() => {
            router.push(
              `/verify-email?email=${encodeURIComponent(formData.email)}`
            );
          }, 1000);
        } else {
          setError(
            result.message ||
              "Đăng nhập không thành công - Thiếu thông tin bắt buộc"
          );
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
      stopLoading();
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-3 py-2 sm:px-4 rounded-lg transition-all duration-300 flex items-center space-x-1 sm:space-x-2 hover:scale-105 text-sm sm:text-base"
      >
        <svg
          className="w-3 h-3 sm:w-4 sm:h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span className="hidden sm:inline">Quay lại trang chủ</span>
        <span className="sm:hidden">Trang chủ</span>
      </Link>

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/auth/vietnam-background.jpg')"
          }}
        ></div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-sky-300/20 to-cyan-300/20 rounded-full blur-3xl auth-pulse"></div>
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-cyan-300/20 to-blue-300/20 rounded-full blur-3xl auth-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      <div
        className={`w-full max-w-sm sm:max-w-md auth-transition-slow relative z-20 ${
          isVisible ? "auth-fade-in" : "opacity-0"
        }`}
      >
        {/* White Card - Solid Background */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 relative">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <Link href="/" className="inline-block mb-4 sm:mb-6">
              <span className="text-2xl sm:text-3xl font-bold text-gray-800">
                🌎 LuTrip
              </span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Đăng Nhập
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Chào mừng bạn trở lại!
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div
              className="relative auth-slide-left"
              style={{ animationDelay: "0.1s" }}
            >
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-sm sm:text-base"
              />
            </div>

            {/* Password Field */}
            <div
              className="relative auth-slide-right"
              style={{ animationDelay: "0.2s" }}
            >
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mật khẩu"
                required
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-sm sm:text-base"
              />
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                href="#"
                className="text-gray-600 hover:text-gray-800 text-xs sm:text-sm transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg shadow-lg text-sm sm:text-base disabled:opacity-50 transition-all duration-300"
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng Nhập"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-4 sm:my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 sm:px-4 text-gray-500 text-xs sm:text-sm">
              hoặc
            </span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Social Login */}
          <div className="space-y-2 sm:space-y-3">
            <GoogleSignInButton mode="login" />
          </div>

          {/* Register Link */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-gray-600 text-xs sm:text-sm">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Add loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <LoadingSpinner type="travel" size="lg" text="Đang đăng nhập..." />
          </div>
        </div>
      )}
    </div>
  );
}
