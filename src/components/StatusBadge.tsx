import React from "react";
import { Check, AlertTriangle, XCircle, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeStatus = "success" | "warning" | "danger" | "info" | "pending";
export type BadgeSize = "sm" | "md";

interface StatusBadgeProps {
  status: BadgeStatus;
  text: string;
  size?: BadgeSize;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  BadgeStatus,
  {
    bg: string;
    text: string;
    border: string;
    dot: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/20",
    dot: "bg-success",
    icon: <Check size={12} strokeWidth={2.5} />,
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/20",
    dot: "bg-warning",
    icon: <AlertTriangle size={12} strokeWidth={2.5} />,
  },
  danger: {
    bg: "bg-danger/10",
    text: "text-danger",
    border: "border-danger/20",
    dot: "bg-danger",
    icon: <XCircle size={12} strokeWidth={2.5} />,
  },
  info: {
    bg: "bg-brand/10",
    text: "text-brand",
    border: "border-brand/20",
    dot: "bg-brand",
    icon: <Info size={12} strokeWidth={2.5} />,
  },
  pending: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/20",
    dot: "bg-warning",
    icon: <Clock size={12} strokeWidth={2.5} />,
  },
};

const sizeConfig: Record<BadgeSize, { padding: string; text: string; gap: string }> = {
  sm: {
    padding: "px-2 py-0.5",
    text: "text-[11px]",
    gap: "gap-1",
  },
  md: {
    padding: "px-2.5 py-1",
    text: "text-xs",
    gap: "gap-1.5",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  size: badgeSize = "md",
  showIcon = true,
  className,
}) => {
  const config = statusConfig[status];
  const sizeStyle = sizeConfig[badgeSize];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium transition-all duration-300 ease-out",
        config.bg,
        config.text,
        config.border,
        sizeStyle.padding,
        sizeStyle.text,
        sizeStyle.gap,
        className,
      )}
    >
      {showIcon ? (
        config.icon
      ) : (
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      )}
      <span>{text}</span>
    </span>
  );
};
