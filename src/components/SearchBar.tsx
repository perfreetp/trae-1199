import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: (value: string) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value: controlledValue,
  onChange,
  placeholder = "搜索...",
  onClear,
  onSubmit,
  className,
}) => {
  const [internalValue, setInternalValue] = useState("");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue("");
    }
    onChange?.("");
    onClear?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit?.(value);
    }
  };

  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2 rounded-xl bg-background-card px-3 transition-all duration-300 ease-out focus-within:ring-2 focus-within:ring-brand/50",
        className,
      )}
    >
      <Search
        size={18}
        strokeWidth={2}
        className="shrink-0 text-white/40"
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="flex min-h-7 min-w-7 items-center justify-center rounded-full bg-white/5 text-white/40 transition-all duration-300 ease-out hover:bg-white/10 hover:text-white/70 active:scale-95"
          aria-label="清除"
        >
          <X size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  );
};
