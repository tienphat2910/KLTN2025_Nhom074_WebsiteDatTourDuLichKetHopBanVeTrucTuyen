"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import env from "@/config/env";

export default function VerifyEmail() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    setIsVisible(true);
    if (!email) {
      router.push("/register");
    }
  }, [email, router]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || success) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, success]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) {
      setResendDisabled(false);
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("");
    while (newOtp.length < 6) {
      newOtp.push("");
    }
    setOtp(newOtp.slice(0, 6));

    // Focus last filled input
    const lastFilledIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError("Vui lòng nhập đủ 6 số");
      return;
    }

    if (timeLeft <= 0) {
      setError("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${env.API_BASE_URL}/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          otp: otpCode
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Save token if returned
        if (data.data?.token) {
          localStorage.setItem("token", data.data.token);
        }
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.message || "Mã OTP không đúng");
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendDisabled) return;

    setResendDisabled(true);
    setResendCooldown(60); // 60 seconds cooldown
    setError("");

    try {
      const response = await fetch(`${env.API_BASE_URL}/auth/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setTimeLeft(600); // Reset timer to 10 minutes
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        alert("Mã OTP mới đã được gửi đến email của bạn");
      } else {
        setError(data.message || "Không thể gửi lại mã OTP");
        setResendDisabled(false);
        setResendCooldown(0);
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại");
      setResendDisabled(false);
      setResendCooldown(0);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
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
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl auth-pulse"></div>
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-purple-400/20 to-pink-400/20 rounded-full blur-3xl auth-pulse"
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
        {/* Glass Card */}
        <div
          className="bg-black/15 border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl p-8 sm:p-10 relative overflow-hidden auth-glow"
          style={{
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            background: "rgba(0, 0, 0, 0.15)"
          }}
        >
          {!success ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Xác Thực Email
                </h1>
                <p className="text-white/70 text-sm sm:text-base">
                  Chúng tôi đã gửi mã OTP đến email
                </p>
                <p className="text-white font-semibold text-sm sm:text-base mt-1">
                  {email}
                </p>
              </div>

              {/* OTP Form */}
              <form onSubmit={handleSubmit}>
                <div className="flex justify-center gap-2 mb-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-white/10 border-2 border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      disabled={loading || success}
                    />
                  ))}
                </div>

                {/* Timer */}
                <div className="text-center mb-4">
                  <p
                    className={`text-sm font-medium ${
                      timeLeft <= 60 ? "text-red-400" : "text-white/70"
                    }`}
                  >
                    {timeLeft > 0 ? (
                      <>
                        Mã có hiệu lực trong:{" "}
                        <span className="font-bold">
                          {formatTime(timeLeft)}
                        </span>
                      </>
                    ) : (
                      <span className="text-red-400 font-bold">
                        Mã OTP đã hết hạn
                      </span>
                    )}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-200 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || timeLeft <= 0}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Đang xác thực...
                    </span>
                  ) : (
                    "Xác Thực"
                  )}
                </button>

                {/* Resend Button */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendDisabled}
                    className="text-white/80 hover:text-white text-sm underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline transition-all"
                  >
                    {resendCooldown > 0
                      ? `Gửi lại mã sau ${resendCooldown}s`
                      : "Gửi lại mã OTP"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">
                  Xác Thực Thành Công!
                </h1>
                <p className="text-white/70 text-sm sm:text-base mb-6">
                  Email của bạn đã được xác thực. Đang chuyển hướng đến trang
                  đăng nhập...
                </p>
              </div>
            </>
          )}

          {/* LuTrip Logo */}
          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <Link href="/" className="inline-block">
              <span className="text-lg font-bold text-white/80">🌎 LuTrip</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
