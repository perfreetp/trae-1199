import React from "react";
import { cn } from "@/lib/utils";

export type TimeRange = "day" | "week" | "month" | "quarter" | "year";

interface TimeRangeOption {
  key: TimeRange;
  label: string;
}

interface TimeRangePickerProps {
  value: TimeRange;
  onChange?: (value: TimeRange) => void;
  options?: TimeRangeOption[];
  className?: string;
}

const defaultOptions: TimeRangeOption[] = [
  { key: "day", label: "日" },
  { key: "week", label: "周" },
  { key: "month", label: "月" },
  { key: "quarter", label: "季" },
  { key: "year", label: "年" },
];

export const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  value,
  onChange,
  options = defaultOptions,
  className,
}) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl bg-background-card p-1",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange?.(option.key)}
            className={cn(
              "relative min-h-8 min-w-11 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300 ease-out",
              isActive
                ? "bg-brand text-white shadow-md shadow-brand/20"
                : "text-white/50 hover:text-white/80",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
