"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import { LoadingSpinner } from "@/components/Loading";

export default function Login() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();
  const { startLoading, stopLoading } = useLoading();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
        router.push("/");
      } else {
        setError(
          result.message ||
            "Đăng nhập không thành công - Thiếu thông tin bắt buộc"
        );
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
            <button className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="hidden sm:inline">Đăng nhập với Google</span>
              <span className="sm:hidden">Google</span>
            </button>
            <button className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="hidden sm:inline">Đăng nhập với Facebook</span>
              <span className="sm:hidden">Facebook</span>
            </button>
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
