import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md"; // Button size
  variant?: "primary" | "outline"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Additional classes
  color?: "primary" | "success" | "error" | "warning" | "info"; // Button color theme
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  color = "primary",
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
  };

  // Variant & Color Classes
  const variantClasses = {
    primary: {
      primary: "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
      success: "bg-success-500 text-white shadow-theme-xs hover:bg-success-600 disabled:bg-success-300",
      error: "bg-error-500 text-white shadow-theme-xs hover:bg-error-600 disabled:bg-error-300",
      warning: "bg-warning-500 text-white shadow-theme-xs hover:bg-warning-600 disabled:bg-warning-300",
      info: "bg-blue-500 text-white shadow-theme-xs hover:bg-blue-600 disabled:bg-blue-300",
    },
    outline: {
      primary: "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
      success: "bg-white text-success-600 ring-1 ring-inset ring-success-200 hover:bg-success-50 dark:bg-gray-800 dark:text-success-400 dark:ring-success-900/30 dark:hover:bg-success-500/10",
      error: "bg-white text-error-600 ring-1 ring-inset ring-error-200 hover:bg-error-50 dark:bg-gray-800 dark:text-error-400 dark:ring-error-900/30 dark:hover:bg-error-500/10",
      warning: "bg-white text-warning-600 ring-1 ring-inset ring-warning-200 hover:bg-warning-50 dark:bg-gray-800 dark:text-warning-400 dark:ring-warning-900/30 dark:hover:bg-warning-500/10",
      info: "bg-white text-blue-600 ring-1 ring-inset ring-blue-200 hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:ring-blue-900/30 dark:hover:bg-blue-500/10",
    },
  };

  const finalVariantClasses = variantClasses[variant][color] || variantClasses[variant].primary;

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition ${className} ${
        sizeClasses[size]
      } ${finalVariantClasses} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
