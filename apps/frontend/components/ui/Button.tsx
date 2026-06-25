import React from "react";
import { cn } from "@/libs/utils";

type ButtonProps = {
  children: React.ReactNode;
  isDisabled: boolean;
  type?: "button" | "submit";
  onHandler?: () => void;
  fullWidth?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  children,
  isDisabled,
  type = "button",
  onHandler,
  fullWidth = false,
}) => {
  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onHandler}
      className={cn(
        "flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
        fullWidth && "w-full", // Add full width if fullWidth is true
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
};

export default Button;
