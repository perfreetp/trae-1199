import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export interface TrendDataPoint {
  label: string;
  value: number;
  compareValue?: number;
  [key: string]: string | number | undefined;
}

export type ChartType = "line" | "area";

interface TrendChartProps {
  data: TrendDataPoint[];
  type?: ChartType;
  showCompare?: boolean;
  valueKey?: string;
  compareKey?: string;
  labelKey?: string;
  color?: string;
  compareColor?: string;
  height?: number;
  showGrid?: boolean;
  className?: string;
  formatValue?: (value: number) => string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string | number;
    value: number | string;
    color: string;
    dataKey?: string | number;
  }>;
  label?: string | number;
  formatValue?: (value: number) => string;
  showCompare?: boolean;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatValue,
  showCompare,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl bg-[#1A1F36] border border-white/10 px-3 py-2.5 shadow-xl shadow-black/30">
      <p className="text-xs font-medium text-white/50 mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const dataKeyStr = String(entry.dataKey ?? "");
          const numericValue = typeof entry.value === "number" ? entry.value : Number(entry.value);
          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-white/60">
                  {dataKeyStr === "value" ? "本期" : showCompare ? "同期" : "数值"}
                </span>
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: entry.color }}
              >
                {formatValue ? formatValue(numericValue) : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  type = "area",
  showCompare = false,
  valueKey = "value",
  compareKey = "compareValue",
  labelKey = "label",
  color = "#1E5EFF",
  compareColor = "#00C48C",
  height = 240,
  showGrid = true,
  className,
  formatValue,
}) => {
  const gradientId = useMemo(() => `trend-gradient-${Math.random().toString(36).slice(2, 8)}`, []);
  const ChartComponent = type === "area" ? AreaChart : LineChart;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.06)"
            />
          )}

          <XAxis
            dataKey={labelKey}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "rgba(255,255,255,0.4)",
              fontSize: 11,
            }}
            interval="preserveStartEnd"
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "rgba(255,255,255,0.3)",
              fontSize: 11,
            }}
            width={40}
            tickFormatter={(value) => formatValue ? formatValue(value) : value}
          />

          <Tooltip
            content={(props: any) => (
              <CustomTooltip
                {...(props as CustomTooltipProps)}
                formatValue={formatValue}
                showCompare={showCompare}
              />
            )}
            cursor={{
              stroke: "rgba(255,255,255,0.1)",
              strokeWidth: 1,
            }}
          />

          {type === "area" ? (
            <>
              <Area
                type="monotone"
                dataKey={valueKey}
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: color,
                  stroke: "#0F1326",
                  strokeWidth: 2,
                }}
                animationDuration={600}
              />
              {showCompare && (
                <Line
                  type="monotone"
                  dataKey={compareKey}
                  stroke={compareColor}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: compareColor,
                    stroke: "#0F1326",
                    strokeWidth: 2,
                  }}
                  animationDuration={600}
                />
              )}
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey={valueKey}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: color,
                  stroke: "#0F1326",
                  strokeWidth: 2,
                }}
                animationDuration={600}
              />
              {showCompare && (
                <Line
                  type="monotone"
                  dataKey={compareKey}
                  stroke={compareColor}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: compareColor,
                    stroke: "#0F1326",
                    strokeWidth: 2,
                  }}
                  animationDuration={600}
                />
              )}
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};
