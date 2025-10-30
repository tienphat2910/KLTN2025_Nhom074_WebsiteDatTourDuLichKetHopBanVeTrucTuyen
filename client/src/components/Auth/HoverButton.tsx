import React from "react";

interface HoverButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "cyan" | "purple";
}

const HoverButton: React.FC<HoverButtonProps> = ({
  children = "Hover me",
  onClick,
  disabled = false,
  type = "button",
  variant = "cyan"
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        group
        relative
        w-full
        px-8 py-3 sm:py-4
        border-2 ${variant === "cyan" ? "border-sky-500" : "border-purple-500"}
        rounded-md
        font-bold
        uppercase
        tracking-widest
        ${variant === "cyan" ? "text-sky-500" : "text-purple-500"}
        bg-transparent
        overflow-hidden
        transition-all duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)]
        hover:text-white
        hover:scale-102
        ${
          variant === "cyan"
            ? "hover:border-sky-400"
            : "hover:border-purple-400"
        }
        ${
          variant === "cyan"
            ? "hover:shadow-[4px_5px_17px_-4px_rgba(14,165,233,0.4)]"
            : "hover:shadow-[4px_5px_17px_-4px_rgba(168,85,247,0.4)]"
        }
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${
          variant === "cyan"
            ? "disabled:hover:text-sky-500"
            : "disabled:hover:text-purple-500"
        }
      `}
    >
      {/* Background slide effect - Cyan Gradient */}
      {variant === "cyan" && (
        <span
          className={`
            absolute
            left-[-50px] top-0
            h-full
            w-0
            bg-gradient-to-r from-sky-500 to-cyan-600
            skew-x-[45deg]
            transition-[width] duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)]
            ${disabled ? "" : "group-hover:w-[250%]"}
            -z-10
          `}
        />
      )}

      {/* Background slide effect - Purple Gradient */}
      {variant === "purple" && (
        <span
          className={`
            absolute
            left-[-50px] top-0
            h-full
            w-0
            bg-gradient-to-r from-purple-500 to-pink-600
            skew-x-[45deg]
            transition-[width] duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)]
            ${disabled ? "" : "group-hover:w-[250%]"}
            -z-10
          `}
        />
      )}

      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default HoverButton;
