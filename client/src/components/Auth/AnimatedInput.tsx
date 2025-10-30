import React, { useState } from "react";
import { Mail, Eye, EyeOff, User } from "lucide-react";

interface AnimatedInputProps {
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  error?: string;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  name,
  label,
  type = "text",
  value,
  onChange,
  onPaste,
  error
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = type === "password";
  const isEmailField = type === "email" || name === "email";
  const isNameField = name === "fullName" || name === "name";
  const inputType = isPasswordField && showPassword ? "text" : type;

  return (
    <div className="relative w-full">
      <input
        type={inputType}
        name={name}
        value={value}
        onChange={onChange}
        onPaste={onPaste}
        autoComplete="off"
        className={`
          peer
          w-full
          border-2
          ${error ? "border-red-500" : "border-gray-400"}
          rounded-xl
          bg-transparent
          px-4 py-3
          ${isPasswordField || isEmailField || isNameField ? "pr-12" : "pr-4"}
          text-gray-900
          transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]
          focus:border-blue-500
          focus:outline-none
        `}
      />
      <label
        htmlFor={name}
        className={`
          absolute left-4
          ${error ? "text-red-500" : "text-gray-400"}
          pointer-events-none
          transform
          ${
            value
              ? "translate-y-[-0.75rem] scale-90 bg-white px-1"
              : "translate-y-3"
          }
          transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]
          peer-focus:translate-y-[-0.75rem]
          peer-focus:scale-90
          peer-focus:bg-white
          peer-focus:px-1
          ${error ? "peer-focus:text-red-500" : "peer-focus:text-blue-500"}
        `}
      >
        {label}
      </label>

      {/* Email Icon */}
      {isEmailField && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <Mail className="w-5 h-5" />
        </div>
      )}

      {/* Name Icon */}
      {isNameField && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <User className="w-5 h-5" />
        </div>
      )}

      {/* Password Toggle Icon */}
      {isPasswordField && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      )}

      {error && <p className="mt-1 text-xs sm:text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default AnimatedInput;
