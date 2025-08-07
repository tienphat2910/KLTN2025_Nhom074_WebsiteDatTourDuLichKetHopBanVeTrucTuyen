"use client";

import { useEffect, useState } from "react";

interface LoadingSpinnerProps {
  type?: "default" | "plane" | "dots" | "pulse" | "orbit" | "travel";
  size?: "sm" | "md" | "lg" | "xl";
  color?: "blue" | "green" | "purple" | "gradient";
  text?: string;
  showText?: boolean;
}

export default function LoadingSpinner({
  type = "default",
  size = "md",
  color = "blue",
  text = "Đang tải...",
  showText = true
}: LoadingSpinnerProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const colorClasses = {
    blue: "text-blue-500 border-blue-500",
    green: "text-green-500 border-green-500",
    purple: "text-purple-500 border-purple-500",
    gradient: "text-blue-500 border-blue-500"
  };

  const renderSpinner = () => {
    const baseClasses = `${sizeClasses[size]} ${colorClasses[color]}`;

    switch (type) {
      case "plane":
        return (
          <div className="relative">
            <div className={`${baseClasses} animate-plane-fly`}>✈️</div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 border-2 border-blue-200 border-dashed rounded-full animate-spin-slow"></div>
            </div>
          </div>
        );

      case "dots":
        return (
          <div className="flex space-x-1">
            <div
              className={`w-3 h-3 bg-blue-500 rounded-full animate-bounce`}
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className={`w-3 h-3 bg-blue-500 rounded-full animate-bounce`}
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className={`w-3 h-3 bg-blue-500 rounded-full animate-bounce`}
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        );

      case "pulse":
        return (
          <div className="relative">
            <div
              className={`${baseClasses} bg-blue-500 rounded-full animate-ping absolute opacity-75`}
            ></div>
            <div
              className={`${baseClasses} bg-blue-600 rounded-full relative`}
            ></div>
          </div>
        );

      case "orbit":
        return (
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute top-1 left-1/2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1/2 animate-orbit"></div>
          </div>
        );

      case "travel":
        return (
          <div className="relative w-20 h-12">
            <div className="absolute bottom-0 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-travel-progress"></div>
            </div>
            <div className="absolute bottom-1 left-0 text-2xl animate-travel-move">
              🧳
            </div>
            <div className="absolute top-0 left-8 text-lg animate-float">
              🌎
            </div>
          </div>
        );

      default:
        return (
          <div
            className={`${baseClasses} border-4 border-t-transparent rounded-full animate-spin`}
          ></div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {renderSpinner()}
      {showText && (
        <div className="text-gray-600 text-sm font-medium">
          {text}
          {dots}
        </div>
      )}
    </div>
  );
}
