import React from "react";
import { cn } from "@/lib/utils";

export type SpinnerSize = "sm" | "md" | "lg" | "xl";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: string;
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeConfig: Record<SpinnerSize, { size: string; border: string }> = {
  sm: {
    size: "h-5 w-5",
    border: "border-2",
  },
  md: {
    size: "h-8 w-8",
    border: "border-2",
  },
  lg: {
    size: "h-12 w-12",
    border: "border-3",
  },
  xl: {
    size: "h-16 w-16",
    border: "border-4",
  },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "#1E5EFF",
  label,
  fullScreen = false,
  className,
}) => {
  const style = sizeConfig[size];

  const spinner = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "rounded-full border-solid animate-spin-slow",
          style.size,
          style.border,
        )}
        style={{
          borderColor: `${color}20`,
          borderTopColor: color,
          borderRightColor: color,
        }}
      />
      {label && (
        <span className="text-sm font-medium text-white/50 animate-pulse">
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1326]/80 backdrop-blur-sm animate-fade-in">
        {spinner}
      </div>
    );
  }

  return spinner;
};
