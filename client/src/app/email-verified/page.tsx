"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

export default function EmailVerified() {
  const [isVisible, setIsVisible] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);

    // Check if there's an action code in the URL
    const actionCode = searchParams.get("oobCode");
    const mode = searchParams.get("mode");

    if (mode === "verifyEmail" && actionCode) {
      // Email verification was successful
      setVerificationStatus("success");
    } else if (mode === "verifyEmail") {
      // Email verification link but no code (might be expired)
      setVerificationStatus("error");
    } else {
      // Direct access to page
      setVerificationStatus("success");
    }
  }, [searchParams]);

  const handleContinue = () => {
    router.push("/login");
  };

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
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-3xl auth-pulse"></div>
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl auth-pulse"
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
          className="bg-black/15 border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl p-8 sm:p-10 relative overflow-hidden auth-glow text-center"
          style={{
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            background: "rgba(0, 0, 0, 0.15)"
          }}
        >
          {verificationStatus === "loading" && (
            <>
              {/* Loading State */}
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Đang xác thực email...
              </h1>
              <p className="text-white/70 text-sm sm:text-base">
                Vui lòng đợi trong giây lát
              </p>
            </>
          )}

          {verificationStatus === "success" && (
            <>
              {/* Success State */}
              <div className="mb-6">
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
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Email Đã Được Xác Thực!
              </h1>
              <p className="text-white/70 text-sm sm:text-base mb-8">
                Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể đăng
                nhập ngay bây giờ.
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Đăng Nhập Ngay
                </button>

                <Link
                  href="/"
                  className="block w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 text-center"
                >
                  Về Trang Chủ
                </Link>
              </div>
            </>
          )}

          {verificationStatus === "error" && (
            <>
              {/* Error State */}
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Lỗi Xác Thực Email
              </h1>
              <p className="text-white/70 text-sm sm:text-base mb-8">
                Liên kết xác thực email có thể đã hết hạn hoặc không hợp lệ. Vui
                lòng thử đăng ký lại.
              </p>

              <div className="space-y-4">
                <Link
                  href="/register"
                  className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl text-center"
                >
                  Đăng Ký Lại
                </Link>

                <Link
                  href="/"
                  className="block w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 text-center"
                >
                  Về Trang Chủ
                </Link>
              </div>
            </>
          )}

          {/* LuTrip Logo */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <Link href="/" className="inline-block">
              <span className="text-lg font-bold text-white/80">🌎 LuTrip</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
