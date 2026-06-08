import React from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AvatarItem {
  id: string;
  src?: string;
  name?: string;
  fallbackColor?: string;
}

export type AvatarSize = "sm" | "md" | "lg";

interface AvatarGroupProps {
  avatars: AvatarItem[];
  max?: number;
  size?: AvatarSize;
  overlap?: number;
  className?: string;
}

const sizeConfig: Record<AvatarSize, { size: string; font: string; border: string; icon: number }> = {
  sm: {
    size: "h-7 w-7",
    font: "text-[10px]",
    border: "border-2",
    icon: 14,
  },
  md: {
    size: "h-9 w-9",
    font: "text-xs",
    border: "border-2",
    icon: 18,
  },
  lg: {
    size: "h-11 w-11",
    font: "text-sm",
    border: "border-2",
    icon: 22,
  },
};

const fallbackColors = [
  "bg-brand",
  "bg-success",
  "bg-warning",
  "bg-danger",
  "bg-purple-500",
  "bg-pink-500",
  "bg-cyan-500",
];

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 5,
  size = "md",
  overlap,
  className,
}) => {
  const config = sizeConfig[size];
  const displayCount = Math.min(avatars.length, max);
  const remaining = avatars.length - displayCount;
  const displayAvatars = avatars.slice(0, displayCount);
  const overlapValue = overlap ?? (size === "sm" ? -8 : size === "md" ? -10 : -12);

  return (
    <div className={cn("flex items-center", className)}>
      {displayAvatars.map((avatar, index) => {
        const colorIndex = avatar.fallbackColor
          ? fallbackColors.indexOf(avatar.fallbackColor as any)
          : hashString(avatar.id) % fallbackColors.length;
        const bgColor = avatar.fallbackColor ?? fallbackColors[colorIndex] ?? fallbackColors[0];
        const initials = avatar.name ? getInitials(avatar.name) : "";

        return (
          <div
            key={avatar.id}
            className={cn(
              "relative shrink-0 rounded-full overflow-hidden ring-1 ring-background-card transition-all duration-300 ease-out hover:z-10 hover:scale-110",
              config.size,
              config.border,
              "border-background-card",
              index > 0 ? "" : "",
            )}
            style={{ marginLeft: index > 0 ? `${overlapValue}px` : undefined, zIndex: displayAvatars.length - index }}
            title={avatar.name}
          >
            {avatar.src ? (
              <img
                src={avatar.src}
                alt={avatar.name ?? avatar.id}
                className="h-full w-full object-cover"
              />
            ) : avatar.name ? (
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center font-semibold text-white",
                  bgColor,
                  config.font,
                )}
              >
                {initials}
              </div>
            ) : (
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center text-white/80",
                  "bg-white/10",
                )}
              >
                <User size={config.icon} strokeWidth={2} />
              </div>
            )}
          </div>
        );
      })}

      {remaining > 0 && (
        <div
          className={cn(
            "relative shrink-0 flex items-center justify-center rounded-full font-semibold text-white/70 bg-white/10 ring-1 ring-background-card transition-all duration-300 ease-out hover:z-10 hover:scale-110",
            config.size,
            config.border,
            "border-background-card",
            config.font,
          )}
          style={{ marginLeft: `${overlapValue}px`, zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
