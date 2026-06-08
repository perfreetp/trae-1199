import React from "react";
import { LayoutDashboard, Library, ClipboardList, CheckSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabKey = "dashboard" | "catalog" | "tickets" | "approval" | "favorites";

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange?: (key: TabKey) => void;
  className?: string;
}

const tabs: TabItem[] = [
  {
    key: "dashboard",
    label: "看板",
    icon: <LayoutDashboard size={22} strokeWidth={2} />,
  },
  {
    key: "catalog",
    label: "口径库",
    icon: <Library size={22} strokeWidth={2} />,
  },
  {
    key: "tickets",
    label: "工单",
    icon: <ClipboardList size={22} strokeWidth={2} />,
  },
  {
    key: "approval",
    label: "审批",
    icon: <CheckSquare size={22} strokeWidth={2} />,
  },
  {
    key: "favorites",
    label: "我的",
    icon: <User size={22} strokeWidth={2} />,
  },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 glass",
        className,
      )}
    >
      <div className="mx-auto flex max-w-md items-end justify-around px-2 pb-safe pt-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange?.(tab.key)}
              className={cn(
                "flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-300 ease-out",
                isActive
                  ? "text-[#1E5EFF]"
                  : "text-white/40 hover:text-white/70",
              )}
            >
              <div
                className={cn(
                  "transition-all duration-300 ease-out",
                  isActive && "scale-110",
                )}
              >
                {tab.icon}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium transition-all duration-300 ease-out",
                  isActive && "font-semibold",
                )}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="h-1 w-1 rounded-full bg-[#1E5EFF]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
