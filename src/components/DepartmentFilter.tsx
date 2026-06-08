import React, { useRef, useEffect, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DepartmentOption {
  id: string;
  name: string;
  count?: number;
}

interface DepartmentFilterProps {
  options: DepartmentOption[];
  activeId?: string;
  onChange?: (id: string) => void;
  showScrollIndicators?: boolean;
  className?: string;
}

export const DepartmentFilter: React.FC<DepartmentFilterProps> = ({
  options,
  activeId,
  onChange,
  showScrollIndicators = true,
  className,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [options]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative", className)}>
      {showScrollIndicators && canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 flex h-10 w-8 -translate-y-1/2 items-center justify-center bg-gradient-to-r from-[#0F1326] via-[#0F1326]/95 to-transparent text-white/60 transition-all duration-300 ease-out hover:text-white"
          aria-label="向左滚动"
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
      )}

      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-2 overflow-x-auto px-1 py-1 scroll-smooth"
      >
        {options.map((option) => {
          const isActive = activeId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange?.(option.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ease-out",
                "min-h-9",
                isActive
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
                  : "bg-background-card text-white/60 hover:bg-white/5 hover:text-white/80",
              )}
            >
              <span>{option.name}</span>
              {option.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    isActive ? "bg-white/20 text-white" : "bg-white/5 text-white/40",
                  )}
                >
                  {option.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showScrollIndicators && canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 flex h-10 w-8 -translate-y-1/2 items-center justify-center bg-gradient-to-l from-[#0F1326] via-[#0F1326]/95 to-transparent text-white/60 transition-all duration-300 ease-out hover:text-white"
          aria-label="向右滚动"
        >
          <ChevronRight size={20} strokeWidth={2} />
        </button>
      )}
    </div>
  );
};
