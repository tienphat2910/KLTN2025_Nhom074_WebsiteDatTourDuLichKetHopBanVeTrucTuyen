"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { useLoading } from "@/contexts/LoadingContext";
import { LoadingSpinner } from "@/components/Loading";
import {
  GoogleSignInButton,
  PasswordStrength,
  AnimatedInput,
  HoverButton
} from "@/components/Auth";
import { validateRegistration } from "@/lib/validation";

export default function Register() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
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
    if (name === "password") {
      setShowPasswordStrength(value.length > 0);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const validation = validateRegistration(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setError("Vui lòng kiểm tra lại thông tin");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: "Mật khẩu không khớp!" });
      setError("Mật khẩu không khớp!");
      return;
    }

    setIsLoading(true);
    startLoading("auth");
    setError("");
    setFieldErrors({});

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
        // Handle server validation errors
        if (result.errors && Array.isArray(result.errors)) {
          const errors: Record<string, string> = {};
          result.errors.forEach((err: any) => {
            if (err.field) {
              errors[err.field] = err.message;
            }
          });
          setFieldErrors(errors);
        }
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
      // Validate step 1 fields before moving to next step
      const errors: Record<string, string> = {};

      // Import validation functions
      const { validateFullName, validateEmail } = require("@/lib/validation");

      // Validate full name
      const fullNameValidation = validateFullName(formData.fullName);
      if (!fullNameValidation.isValid) {
        errors.fullName = fullNameValidation.message;
      }

      // Validate email
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        errors.email = emailValidation.message;
      }

      // If there are errors, show them and don't proceed
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        toast.error("Vui lòng kiểm tra lại thông tin", {
          description: "Họ tên và email chưa đúng định dạng",
          duration: 3000
        });
        return;
      }

      // Clear errors and proceed to next step
      setFieldErrors({});
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
                    <div className="w-full flex-shrink-0 space-y-4 sm:space-y-6 pt-2">
                      <AnimatedInput
                        name="fullName"
                        label="Họ và tên (VD: Nguyễn A)"
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                        error={fieldErrors.fullName}
                      />

                      <AnimatedInput
                        name="email"
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={fieldErrors.email}
                      />

                      <HoverButton
                        type="button"
                        onClick={nextStep}
                        variant="purple"
                      >
                        Tiếp theo
                      </HoverButton>
                    </div>

                    {/* Step 2: Password */}
                    <div className="w-full flex-shrink-0 space-y-4 sm:space-y-6 pt-2">
                      <div>
                        <AnimatedInput
                          name="password"
                          label="Mật khẩu"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          error={fieldErrors.password}
                        />
                        {/* Password Strength Indicator */}
                        <PasswordStrength
                          password={formData.password}
                          show={showPasswordStrength}
                        />
                      </div>

                      <AnimatedInput
                        name="confirmPassword"
                        label="Xác nhận mật khẩu"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onPaste={(e) => e.preventDefault()}
                        error={fieldErrors.confirmPassword}
                      />

                      <div className="flex space-x-3 sm:space-x-4">
                        <button
                          type="button"
                          onClick={prevStep}
                          className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-all duration-300 text-sm sm:text-base"
                        >
                          Quay lại
                        </button>
                        <div className="flex-1">
                          <HoverButton
                            type="submit"
                            disabled={isLoading}
                            variant="purple"
                          >
                            {isLoading ? "Đang đăng ký..." : "Đăng Ký"}
                          </HoverButton>
                        </div>
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
              <GoogleSignInButton mode="register" />
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
