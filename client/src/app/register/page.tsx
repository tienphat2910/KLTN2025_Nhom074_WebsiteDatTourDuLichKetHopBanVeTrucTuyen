"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { useLoading } from "@/contexts/LoadingContext";
import { LoadingSpinner } from "@/components/Loading";

export default function Register() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp!");
      return;
    }

    setIsLoading(true);
    startLoading("auth");
    setError("");

    try {
      const result = await authService.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        toast.success("Đăng ký thành công!", {
          description: "Đang chuyển đến trang xác thực...",
          duration: 2000
        });
        // Redirect to verify-email page with email parameter
        setTimeout(() => {
          router.push(
            `/verify-email?email=${encodeURIComponent(formData.email)}`
          );
        }, 1000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
      stopLoading();
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    startLoading("auth");
    try {
      const result = await authService.resendVerification(
        formData.email,
        formData.password
      );
      if (result.success) {
        setSuccess("Email xác thực đã được gửi lại!");
        toast.success("Email đã được gửi lại!", {
          description: "Vui lòng kiểm tra hộp thư của bạn.",
          duration: 3000
        });
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
      stopLoading();
    }
  };

  const nextStep = () => {
    if (currentStep < 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl auth-pulse"></div>
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-pink-400/20 to-red-400/20 rounded-full blur-3xl auth-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl auth-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white/10 rounded-full blur-xl auth-bounce"
          style={{ animationDelay: "0.7s" }}
        ></div>
      </div>

      <div
        className={`w-full max-w-sm sm:max-w-md auth-transition-slow relative z-20 ${
          isVisible ? "auth-fade-in" : "opacity-0"
        }`}
      >
        {/* White Card - Solid Background */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 relative z-10">
            <Link href="/" className="inline-block mb-4 sm:mb-6">
              <span className="text-2xl sm:text-3xl font-bold text-gray-800">
                🌎 LuTrip
              </span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {emailSent ? "Kiểm Tra Email" : "Đăng Ký"}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {emailSent
                ? "Chúng tôi đã gửi email xác thực đến địa chỉ của bạn"
                : "Tạo tài khoản mới để bắt đầu"}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Email Sent State */}
          {emailSent ? (
            <div className="relative z-10 text-center space-y-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Email đã được gửi!
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Chúng tôi đã gửi email xác thực đến:
                </p>
                <p className="text-gray-800 font-medium">{userEmail}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm mb-3">
                  📧 Vui lòng kiểm tra hộp thư (cả thư mục spam) và nhấp vào
                  liên kết xác thực để kích hoạt tài khoản.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-all duration-300 text-sm sm:text-base disabled:opacity-50"
                >
                  {isLoading ? "Đang gửi..." : "Gửi lại email"}
                </button>

                <Link
                  href="/login"
                  className="block w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-all duration-300 shadow-lg text-sm sm:text-base text-center"
                >
                  Đi đến đăng nhập
                </Link>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <>
              {/* Progress Bar */}
              <div className="mb-4 sm:mb-6 relative z-10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 text-xs sm:text-sm">
                    Bước {currentStep + 1}/2
                  </span>
                  <span className="text-gray-600 text-xs sm:text-sm">
                    {Math.round(((currentStep + 1) / 2) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / 2) * 100}%` }}
                  ></div>
                </div>
              </div>

              <form
                onSubmit={
                  currentStep === 1 ? handleRegister : (e) => e.preventDefault()
                }
                className="relative z-10"
              >
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-300"
                    style={{ transform: `translateX(-${currentStep * 100}%)` }}
                  >
                    {/* Step 1: Personal Info */}
                    <div className="w-full flex-shrink-0 space-y-4 sm:space-y-6">
                      <div className="relative">
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Họ và tên"
                          required
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-sm sm:text-base"
                        />
                      </div>

                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Email"
                          required
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-sm sm:text-base"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={nextStep}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-all duration-300 shadow-lg text-sm sm:text-base"
                      >
                        Tiếp theo
                      </button>
                    </div>

                    {/* Step 2: Password */}
                    <div className="w-full flex-shrink-0 space-y-4 sm:space-y-6">
                      <div className="relative">
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Mật khẩu"
                          required
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-sm sm:text-base"
                        />
                      </div>

                      <div className="relative">
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Xác nhận mật khẩu"
                          required
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-sm sm:text-base"
                        />
                      </div>

                      <div className="flex space-x-3 sm:space-x-4">
                        <button
                          type="button"
                          onClick={prevStep}
                          className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-all duration-300 text-sm sm:text-base"
                        >
                          Quay lại
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-all duration-300 shadow-lg text-sm sm:text-base disabled:opacity-50"
                        >
                          {isLoading ? "Đang đăng ký..." : "Đăng Ký"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}

          {/* Divider */}
          <div className="my-4 sm:my-6 flex items-center relative z-10">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 sm:px-4 text-gray-500 text-xs sm:text-sm">
              hoặc
            </span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Social Register */}
          {!emailSent && (
            <div className="space-y-2 sm:space-y-3 relative z-10">
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
                <span className="hidden sm:inline">Đăng ký với Google</span>
                <span className="sm:hidden">Google</span>
              </button>
            </div>
          )}

          {/* Login Link */}
          <div className="mt-4 sm:mt-6 text-center relative z-10">
            <p className="text-gray-600 text-xs sm:text-sm">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Add loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <LoadingSpinner
              type="travel"
              size="lg"
              text={emailSent ? "Đang gửi email..." : "Đang đăng ký..."}
            />
          </div>
        </div>
      )}
    </div>
  );
}
