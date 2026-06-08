import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionSheetItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  description?: string;
}

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  items: ActionSheetItem[];
  onSelect?: (item: ActionSheetItem) => void;
  title?: string;
  description?: string;
  showCancel?: boolean;
  cancelText?: string;
  maskClosable?: boolean;
  className?: string;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  open,
  onClose,
  items,
  onSelect,
  title,
  description,
  showCancel = true,
  cancelText = "取消",
  maskClosable = true,
  className,
}) => {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  const handleSelect = (item: ActionSheetItem) => {
    if (item.disabled) return;
    onSelect?.(item);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => maskClosable && onClose()}
      />

      <div
        className={cn(
          "relative w-full max-w-md rounded-t-2xl bg-[#1A1F36] border-t border-white/5 animate-slide-up pb-safe",
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/10" />

        {(title || description) && (
          <div className="relative px-5 pb-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 transition-all duration-300 ease-out hover:bg-white/10 hover:text-white active:scale-95"
              aria-label="关闭"
            >
              <X size={18} strokeWidth={2} />
            </button>
            {title && (
              <h3 className="text-base font-semibold text-white pr-10">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-sm text-white/40 pr-10">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="divide-y divide-white/5">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              disabled={item.disabled}
              className={cn(
                "flex w-full min-h-[52px] items-center gap-3 px-5 py-3 text-left transition-all duration-300 ease-out",
                index === 0 && !(title || description) ? "rounded-t-xl" : "",
                item.disabled
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-white/5 active:bg-white/10",
                item.danger ? "text-danger" : "text-white",
              )}
            >
              {item.icon && (
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    item.danger ? "bg-danger/10" : "bg-white/5",
                  )}
                >
                  {item.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.label}</div>
                {item.description && (
                  <div className="text-xs text-white/40 mt-0.5 truncate">
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {showCancel && (
          <div className="px-3 pb-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex w-full min-h-11 items-center justify-center rounded-xl bg-white/5 text-sm font-medium text-white/80 transition-all duration-300 ease-out hover:bg-white/10 hover:text-white active:scale-[0.98]"
            >
              {cancelText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
