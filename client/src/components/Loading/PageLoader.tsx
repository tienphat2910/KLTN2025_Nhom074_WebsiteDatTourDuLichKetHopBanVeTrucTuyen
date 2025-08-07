"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface PageLoaderProps {
  isLoading: boolean;
  type?: "fullscreen" | "overlay" | "inline";
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export default function PageLoader({
  isLoading,
  type = "fullscreen",
  message = "Đang tải trang...",
  progress = 0,
  showProgress = false
}: PageLoaderProps) {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Đang khởi tạo...");

  useEffect(() => {
    if (!isLoading) return;

    const messages = [
      "Đang khởi tạo...",
      "Đang kết nối...",
      "Đang tải dữ liệu...",
      "Sắp hoàn thành..."
    ];

    let messageIndex = 0;
    let progressValue = 0;

    const interval = setInterval(() => {
      progressValue += Math.random() * 15;
      if (progressValue > 90) progressValue = 90;

      setCurrentProgress(progressValue);
      setLoadingText(
        messages[Math.floor(progressValue / 25)] ||
          messages[messages.length - 1]
      );
    }, 200);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  const renderContent = () => (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      {/* Logo Animation */}
      <div className="text-4xl font-bold text-blue-600 animate-pulse">
        🌎 LuTrip
      </div>

      {/* Main Loading Animation */}
      <div className="relative">
        <LoadingSpinner type="travel" size="xl" />
      </div>

      {/* Loading Text */}
      <div className="text-center space-y-2">
        <div className="text-lg font-medium text-gray-700">{loadingText}</div>
        <div className="text-sm text-gray-500">{message}</div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Tiến độ</span>
            <span>{Math.round(progress || currentProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress || currentProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 text-2xl animate-float opacity-30">
          ✈️
        </div>
        <div
          className="absolute top-1/3 right-1/4 text-xl animate-float opacity-20"
          style={{ animationDelay: "1s" }}
        >
          🏨
        </div>
        <div
          className="absolute bottom-1/3 left-1/3 text-lg animate-float opacity-25"
          style={{ animationDelay: "2s" }}
        >
          🎭
        </div>
        <div
          className="absolute bottom-1/4 right-1/3 text-xl animate-float opacity-30"
          style={{ animationDelay: "0.5s" }}
        >
          🏖️
        </div>
      </div>
    </div>
  );

  switch (type) {
    case "fullscreen":
      return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="relative">{renderContent()}</div>
        </div>
      );

    case "overlay":
      return (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl relative max-w-md w-full mx-4">
            {renderContent()}
          </div>
        </div>
      );

    case "inline":
      return <div className="w-full py-12">{renderContent()}</div>;

    default:
      return null;
  }
}
