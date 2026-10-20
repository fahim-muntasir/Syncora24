import React from "react";
import { cn } from "@/libs/utils";

type ButtonProps = {
  children: React.ReactNode;
  isDisabled: boolean;
  onHandler?: () => void;
  fullWidth?: boolean;
  variant?: "primary" | "secondary";
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "children">;

const Button: React.FC<ButtonProps> = ({
  children,
  isDisabled,
  type = "button",
  onHandler,
  fullWidth = false,
  variant = "primary",
  onClick,
  className,
  ...buttonProps
}) => {
  return (
    <button
      {...buttonProps}
      type={type}
      disabled={isDisabled}
      onClick={onClick ?? onHandler}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60 motion-reduce:transition-none",
        variant === "primary"
          ? "bg-green-500 text-white enabled:hover:bg-green-400"
          : "border border-white/[0.1] text-gray-200 enabled:hover:border-white/[0.2] enabled:hover:bg-white/[0.04]",
        fullWidth && "w-full",
        isDisabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
};

export default Button;