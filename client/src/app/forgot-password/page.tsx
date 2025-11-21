"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { LoadingSpinner } from "@/components/Loading";
import {
  AnimatedInput,
  HoverButton,
  PasswordStrength
} from "@/components/Auth";
import { validateEmail, validatePassword } from "@/lib/validation";

type Step = "email" | "otp" | "success";

export default function ForgotPassword() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError("");
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Show password strength when user starts typing password
    if (name === "newPassword") {
      setShowPasswordStrength(value.length > 0);
    }
    // Real-time password matching validation
    if (name === "confirmPassword" || name === "newPassword") {
      if (
        name === "confirmPassword" &&
        formData.newPassword &&
        value !== formData.newPassword
      ) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: "Mật khẩu xác nhận không khớp"
        }));
      } else if (
        name === "newPassword" &&
        formData.confirmPassword &&
        value !== formData.confirmPassword
      ) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: "Mật khẩu xác nhận không khớp"
        }));
      } else if (name === "confirmPassword" && value === formData.newPassword) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!formData.email.trim()) {
      setFieldErrors({ email: "Email là bắt buộc" });
      return;
    }

    if (!validateEmail(formData.email)) {
      setFieldErrors({ email: "Email không hợp lệ" });
      return;
    }

    setIsLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const result = await authService.forgotPassword(formData.email);

      if (result.success) {
        toast.success("Mã OTP đã được gửi!", {
          description: "Vui lòng kiểm tra email của bạn",
          duration: 4000
        });
        setCurrentStep("otp");
      } else {
        setError(result.message || "Có lỗi xảy ra khi gửi mã OTP");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!formData.otp.trim()) {
      setFieldErrors({ otp: "Mã OTP là bắt buộc" });
      return;
    }

    // Validate password using the same validation as registration
    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      setFieldErrors({ newPassword: passwordValidation.message });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: "Mật khẩu xác nhận không khớp" });
      return;
    }

    setIsLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const result = await authService.resetPassword({
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });

      if (result.success) {
        toast.success("Mật khẩu đã được đặt lại thành công!", {
          description: "Bạn có thể đăng nhập với mật khẩu mới",
          duration: 4000
        });
        setCurrentStep("success");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(result.message || "Có lỗi xảy ra khi đặt lại mật khẩu");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await authService.forgotPassword(formData.email);

      if (result.success) {
        toast.success("Mã OTP mới đã được gửi!", {
          description: "Vui lòng kiểm tra email của bạn",
          duration: 4000
        });
      } else {
        setError(result.message || "Có lỗi xảy ra khi gửi mã OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep("email");
    setFormData({
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: ""
    });
    setError("");
    setFieldErrors({});
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
              <div className="flex items-center justify-center gap-2">
                <img
                  src="/images/logo/logo-lutrip.png"
                  alt="LuTrip Logo"
                  className="w-10 h-10 sm:w-12 sm:h-12"
                />
                <span className="text-2xl sm:text-3xl font-bold text-gray-800">
                  LuTrip
                </span>
              </div>
            </Link>

            {currentStep === "email" && (
              <>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                  Quên Mật Khẩu
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Nhập email của bạn để nhận mã OTP đặt lại mật khẩu
                </p>
              </>
            )}

            {currentStep === "otp" && (
              <>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                  Đặt Lại Mật Khẩu
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Nhập mã OTP và mật khẩu mới
                </p>
              </>
            )}

            {currentStep === "success" && (
              <>
                <h1 className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
                  Thành Công!
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Mật khẩu của bạn đã được đặt lại thành công
                </p>
              </>
            )}
          </div>

          {/* Step Indicator */}
          {currentStep !== "success" && (
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "email"
                      ? "bg-sky-600 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  1
                </div>
                <div
                  className={`w-8 h-1 ${
                    currentStep === "otp" ? "bg-sky-600" : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "otp"
                      ? "bg-sky-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  2
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Email Step */}
          {currentStep === "email" && (
            <form
              onSubmit={handleEmailSubmit}
              className="space-y-4 sm:space-y-6"
            >
              <div
                className="auth-slide-left"
                style={{ animationDelay: "0.1s" }}
              >
                <AnimatedInput
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={fieldErrors.email}
                />
              </div>

              <HoverButton type="submit" disabled={isLoading}>
                {isLoading ? "Đang gửi..." : "Gửi Mã OTP"}
              </HoverButton>
            </form>
          )}

          {/* OTP Step */}
          {currentStep === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4 sm:space-y-6">
              <div
                className="auth-slide-left"
                style={{ animationDelay: "0.1s" }}
              >
                <AnimatedInput
                  name="otp"
                  label="Mã OTP"
                  type="text"
                  value={formData.otp}
                  onChange={handleChange}
                  error={fieldErrors.otp}
                />
              </div>

              <div
                className="auth-slide-right"
                style={{ animationDelay: "0.2s" }}
              >
                <div>
                  <AnimatedInput
                    name="newPassword"
                    label="Mật Khẩu Mới"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    error={fieldErrors.newPassword}
                  />
                  {/* Password Strength Indicator */}
                  <PasswordStrength
                    password={formData.newPassword}
                    show={showPasswordStrength}
                  />
                </div>
              </div>

              <div
                className="auth-slide-left"
                style={{ animationDelay: "0.3s" }}
              >
                <AnimatedInput
                  name="confirmPassword"
                  label="Xác Nhận Mật Khẩu"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={fieldErrors.confirmPassword}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
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
                </button>
                <HoverButton type="submit" disabled={isLoading}>
                  {isLoading ? "Đang xử lý..." : "Đặt Lại Mật Khẩu"}
                </HoverButton>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sky-600 hover:text-sky-700 text-sm underline disabled:opacity-50"
                >
                  Gửi lại mã OTP
                </button>
              </div>
            </form>
          )}

          {/* Success Step */}
          {currentStep === "success" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-gray-600">
                Bạn sẽ được chuyển hướng đến trang đăng nhập trong vài giây...
              </p>
              <Link
                href="/login"
                className="inline-block bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Đăng Nhập Ngay
              </Link>
            </div>
          )}

          {/* Login Link */}
          {currentStep !== "success" && (
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-gray-600 text-xs sm:text-sm">
                Nhớ mật khẩu?{" "}
                <Link
                  href="/login"
                  className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <LoadingSpinner type="travel" size="lg" text="Đang xử lý..." />
          </div>
        </div>
      )}
    </div>
  );
}
