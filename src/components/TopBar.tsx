import React from "react";
import { ChevronLeft, Search, Share2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type TopBarAction = "search" | "share" | "more";

interface TopBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: TopBarAction[];
  onAction?: (action: TopBarAction) => void;
  className?: string;
}

const actionIcons: Record<TopBarAction, React.ReactNode> = {
  search: <Search size={20} strokeWidth={2} />,
  share: <Share2 size={20} strokeWidth={2} />,
  more: <MoreHorizontal size={20} strokeWidth={2} />,
};

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showBack = true,
  onBack,
  actions = ["search", "more"],
  onAction,
  className,
}) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 glass border-b border-white/5",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-2">
        <div className="flex min-w-11 items-center">
          {showBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-white/70 transition-all duration-300 ease-out hover:bg-white/5 hover:text-white active:scale-95"
              aria-label="返回"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
          )}
        </div>

        <h1 className="flex-1 truncate text-center text-base font-semibold text-white">
          {title}
        </h1>

        <div className="flex min-w-11 items-center justify-end gap-0.5">
          {actions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => onAction?.(action)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-white/70 transition-all duration-300 ease-out hover:bg-white/5 hover:text-white active:scale-95"
              aria-label={action}
            >
              {actionIcons[action]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
