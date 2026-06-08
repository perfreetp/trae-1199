import React from "react";
import {
  Inbox,
  SearchX,
  FileX,
  AlertCircle,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EmptyStateType = "default" | "search" | "data" | "error" | "network";

interface EmptyStateProps {
  type?: EmptyStateType;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const typeConfig: Record<EmptyStateType, { icon: LucideIcon; title: string; description: string }> = {
  default: {
    icon: Inbox,
    title: "暂无内容",
    description: "这里还没有任何数据，稍后再来看看吧",
  },
  search: {
    icon: SearchX,
    title: "未找到结果",
    description: "没有找到匹配的内容，请尝试其他关键词",
  },
  data: {
    icon: FileX,
    title: "暂无数据",
    description: "当前筛选条件下没有数据，请调整筛选条件",
  },
  error: {
    icon: AlertCircle,
    title: "加载失败",
    description: "数据加载出现问题，请稍后重试",
  },
  network: {
    icon: WifiOff,
    title: "网络异常",
    description: "请检查网络连接后重试",
  },
};

const sizeConfig = {
  sm: {
    icon: 40,
    title: "text-sm",
    desc: "text-xs",
    gap: "gap-2",
    padding: "py-6",
  },
  md: {
    icon: 56,
    title: "text-base",
    desc: "text-sm",
    gap: "gap-3",
    padding: "py-10",
  },
  lg: {
    icon: 72,
    title: "text-lg",
    desc: "text-sm",
    gap: "gap-4",
    padding: "py-16",
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = "default",
  icon: customIcon,
  title: customTitle,
  description: customDescription,
  actionText,
  onAction,
  size = "md",
  className,
}) => {
  const config = typeConfig[type];
  const sizeStyle = sizeConfig[size];
  const Icon = customIcon ?? config.icon;
  const title = customTitle ?? config.title;
  const description = customDescription ?? config.description;

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center text-center animate-fade-in",
        sizeStyle.padding,
        sizeStyle.gap,
        className,
      )}
    >
      <div className="flex items-center justify-center rounded-full bg-white/5 p-4">
        <Icon
          size={sizeStyle.icon}
          strokeWidth={1.5}
          className="text-white/25"
        />
      </div>

      <div className={cn("flex flex-col items-center gap-1", sizeStyle.gap)}>
        <h3 className={cn("font-semibold text-white/80", sizeStyle.title)}>
          {title}
        </h3>
        {description && (
          <p className={cn("text-white/40 max-w-xs", sizeStyle.desc)}>
            {description}
          </p>
        )}
      </div>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 min-h-10 rounded-xl bg-brand px-5 text-sm font-medium text-white transition-all duration-300 ease-out hover:bg-brand-600 active:scale-95 shadow-lg shadow-brand/20"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
