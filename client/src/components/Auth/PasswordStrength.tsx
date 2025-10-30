"use client";

import { useEffect, useState } from "react";

interface PasswordStrengthProps {
  password: string;
  show?: boolean;
}

interface PasswordRequirements {
  hasMinLength: boolean;
  hasLowerCase: boolean;
  hasUpperCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export function PasswordStrength({
  password,
  show = true
}: PasswordStrengthProps) {
  const [strength, setStrength] = useState<"weak" | "medium" | "strong">(
    "weak"
  );
  const [requirements, setRequirements] = useState<PasswordRequirements>({
    hasMinLength: false,
    hasLowerCase: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  useEffect(() => {
    if (!password) {
      setStrength("weak");
      setRequirements({
        hasMinLength: false,
        hasLowerCase: false,
        hasUpperCase: false,
        hasNumber: false,
        hasSpecialChar: false
      });
      return;
    }

    // Check requirements
    const newRequirements = {
      hasMinLength: password.length >= 6,
      hasLowerCase: /[a-z]/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?]/.test(password)
    };

    setRequirements(newRequirements);

    // Calculate strength
    let score = 0;
    if (newRequirements.hasMinLength) score++;
    if (newRequirements.hasLowerCase) score++;
    if (newRequirements.hasUpperCase) score++;
    if (newRequirements.hasNumber) score++;
    if (newRequirements.hasSpecialChar) score++;

    if (score >= 5) {
      setStrength("strong");
    } else if (score >= 3) {
      setStrength("medium");
    } else {
      setStrength("weak");
    }
  }, [password]);

  if (!show || !password) {
    return null;
  }

  const getStrengthColor = () => {
    switch (strength) {
      case "strong":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "weak":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStrengthWidth = () => {
    switch (strength) {
      case "strong":
        return "w-full";
      case "medium":
        return "w-2/3";
      case "weak":
        return "w-1/3";
      default:
        return "w-0";
    }
  };

  const getStrengthText = () => {
    switch (strength) {
      case "strong":
        return "Mạnh";
      case "medium":
        return "Trung bình";
      case "weak":
        return "Yếu";
      default:
        return "";
    }
  };

  const getStrengthTextColor = () => {
    switch (strength) {
      case "strong":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "weak":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Độ mạnh mật khẩu:</span>
          <span className={`text-xs font-medium ${getStrengthTextColor()}`}>
            {getStrengthText()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${getStrengthColor()} ${getStrengthWidth()} h-2 rounded-full transition-all duration-300`}
          ></div>
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
        <p className="text-xs font-medium text-gray-700 mb-2">
          Yêu cầu mật khẩu:
        </p>

        <RequirementItem
          met={requirements.hasMinLength}
          text="Ít nhất 6 ký tự"
        />
        <RequirementItem
          met={requirements.hasLowerCase}
          text="Chứa chữ thường (a-z)"
        />
        <RequirementItem
          met={requirements.hasUpperCase}
          text="Chứa chữ hoa (A-Z)"
        />
        <RequirementItem met={requirements.hasNumber} text="Chứa số (0-9)" />
        <RequirementItem
          met={requirements.hasSpecialChar}
          text="Chứa ký tự đặc biệt (!@#$%...)"
        />
      </div>
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <div className="flex items-center space-x-2">
      {met ? (
        <svg
          className="w-4 h-4 text-green-500 flex-shrink-0"
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
      ) : (
        <svg
          className="w-4 h-4 text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
        </svg>
      )}
      <span className={`text-xs ${met ? "text-green-700" : "text-gray-600"}`}>
        {text}
      </span>
    </div>
  );
}
