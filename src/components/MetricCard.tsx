import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export type TrendDirection = "up" | "down" | "flat";
export type GradientPreset = "blue" | "green" | "orange" | "purple" | "red";

interface SparklinePoint {
  value: number;
}

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  changeRate?: number;
  trend?: TrendDirection;
  sparklineData?: SparklinePoint[];
  gradient?: GradientPreset;
  onClick?: () => void;
  className?: string;
}

const gradientColors: Record<
  GradientPreset,
  { from: string; to: string; stroke: string; fill: string }
> = {
  blue: {
    from: "from-[#1E5EFF]/20",
    to: "to-[#1E5EFF]/0",
    stroke: "#1E5EFF",
    fill: "#1E5EFF",
  },
  green: {
    from: "from-[#00C48C]/20",
    to: "to-[#00C48C]/0",
    stroke: "#00C48C",
    fill: "#00C48C",
  },
  orange: {
    from: "from-[#FFAB00]/20",
    to: "to-[#FFAB00]/0",
    stroke: "#FFAB00",
    fill: "#FFAB00",
  },
  purple: {
    from: "from-[#8B5CF6]/20",
    to: "to-[#8B5CF6]/0",
    stroke: "#8B5CF6",
    fill: "#8B5CF6",
  },
  red: {
    from: "from-[#FF4D4F]/20",
    to: "to-[#FF4D4F]/0",
    stroke: "#FF4D4F",
    fill: "#FF4D4F",
  },
};

const trendIconColors: Record<TrendDirection, string> = {
  up: "text-success",
  down: "text-danger",
  flat: "text-white/40",
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  changeRate,
  trend,
  sparklineData,
  gradient = "blue",
  onClick,
  className,
}) => {
  const colors = gradientColors[gradient];
  const direction: TrendDirection =
    trend ??
    (changeRate !== undefined
      ? changeRate > 0
        ? "up"
        : changeRate < 0
          ? "down"
          : "flat"
      : "flat");

  const TrendIcon =
    direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-gradient-to-br p-4 transition-all duration-300 ease-out",
        colors.from,
        colors.to,
        "bg-background-card",
        onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60",
          colors.from,
          colors.to,
        )}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/50">{title}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight text-white">
                {value}
              </span>
              {unit && (
                <span className="text-xs font-medium text-white/50">{unit}</span>
              )}
            </div>
          </div>

          {changeRate !== undefined && (
            <div
              className={cn(
                "flex shrink-0 items-center gap-0.5 rounded-full bg-white/5 px-2 py-1",
                trendIconColors[direction],
              )}
            >
              <TrendIcon size={14} strokeWidth={2} />
              <span className="text-xs font-semibold">
                {direction === "flat" ? "" : direction === "up" ? "+" : ""}
                {changeRate.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-3 h-12 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`spark-${gradient}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.fill} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={colors.fill} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={colors.stroke}
                  strokeWidth={2}
                  fill={`url(#spark-${gradient})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
