import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  Bug,
  Calendar,
  Eye,
  EyeOff,
  GitBranch,
  Package,
  Repeat,
  Share2,
  Shuffle,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GameDetailsAchievement } from "@/types/game";
import { AchievementFlagBadge } from "./AchievementFlagBadge";
 
type FlagDef = {
  key: keyof GameDetailsAchievement;
  icon: LucideIcon;
  label: string;
  description: string;
  colorClass: string;
};
 
const FLAG_DEFS: FlagDef[] = [
  {
    key: "isUnobtainable",
    icon: Ban,
    label: "Unobtainable",
    description: "This achievement cannot currently be obtained",
    colorClass: "text-red-400",
  },
  {
    key: "isBuggy",
    icon: Bug,
    label: "Buggy",
    description: "This achievement has known bugs that may affect obtainability",
    colorClass: "text-orange-400",
  },
  {
    key: "isMissable",
    icon: AlertTriangle,
    label: "Missable",
    description: "This achievement can be permanently missed",
    colorClass: "text-yellow-400",
  },
  {
    key: "isConditionallyObtainable",
    icon: GitBranch,
    label: "Conditional",
    description: "Only obtainable under specific conditions",
    colorClass: "text-yellow-300",
  },
  {
    key: "isMultiplayer",
    icon: Users,
    label: "Multiplayer",
    description: "Requires multiplayer to unlock",
    colorClass: "text-blue-400",
  },
  {
    key: "isGrind",
    icon: Repeat,
    label: "Grind",
    description: "Requires significant repetitive effort",
    colorClass: "text-purple-400",
  },
  {
    key: "isRandom",
    icon: Shuffle,
    label: "RNG",
    description: "Has random or luck-based elements",
    colorClass: "text-pink-400",
  },
  {
    key: "isDateSpecific",
    icon: Calendar,
    label: "Date Specific",
    description: "Must be unlocked at a specific date or time",
    colorClass: "text-cyan-400",
  },
  {
    key: "isViral",
    icon: Share2,
    label: "Viral",
    description: "Community or viral achievement",
    colorClass: "text-green-400",
  },
  {
    key: "isDLC",
    icon: Package,
    label: "DLC",
    description: "Requires downloadable content",
    colorClass: "text-indigo-400",
  },
  {
    key: "isWorldRecord",
    icon: Trophy,
    label: "World Record",
    description: "Requires world record-level performance",
    colorClass: "text-yellow-500",
  },
  {
    key: "isHidden",
    icon: EyeOff,
    label: "Hidden",
    description: "This achievement is hidden in-game",
    colorClass: "text-slate-400",
  },
];
 
const fallbackIcon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23334155'/%3E%3Cpath d='M14 34l8-9 6 7 4-5 6 7H14z' fill='%2394a3b8'/%3E%3Ccircle cx='18' cy='16' r='4' fill='%2394a3b8'/%3E%3C/svg%3E";
 
type GameAchievementRowProps = {
  achievement: GameDetailsAchievement;
  showDescription: boolean;
};
 
export function GameAchievementRow({ achievement, showDescription }: GameAchievementRowProps) {
  const [localShow, setLocalShow] = useState(false);
  const descriptionVisible = showDescription || localShow;
 
  const activeFlags = FLAG_DEFS.filter((f) => achievement[f.key] === true);
  const isUnlocked = achievement.isUnlocked === true;
  const isAuthenticated = achievement.isUnlocked !== null;
 
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-lg px-3 py-3 transition-colors hover:bg-app-panel2 ${
        isAuthenticated && !isUnlocked ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={achievement.iconUrl ?? undefined}
          alt={achievement.name}
          className="h-12 w-12 shrink-0 rounded-md border border-app-border object-cover shadow-md shadow-app-border"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackIcon;
          }}
        />
 
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="app-heading text-sm truncate">{achievement.name}</span>
          </div>
          {activeFlags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFlags.map((f) => (
                <AchievementFlagBadge
                  key={f.key as string}
                  icon={f.icon}
                  label={f.label}
                  description={f.description}
                  colorClass={f.colorClass}
                />
              ))}
            </div>
          )}
        </div>
 
        <div className="flex items-center gap-3 shrink-0">
          {achievement.globalPercentage != null && (
            <span className="text-xs text-app-muted tabular-nums hidden sm:block">
              {achievement.globalPercentage.toFixed(1)}%
            </span>
          )}
          <span className="text-sm font-semibold text-brand tabular-nums">
            {achievement.points} pts
          </span>
          <button
            type="button"
            onClick={() => setLocalShow((v) => !v)}
            className="text-app-muted hover:text-app-text transition-colors"
            aria-label={descriptionVisible ? "Hide description" : "Show description"}
          >
            {descriptionVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
 
      {descriptionVisible && (
        <p className="text-app-muted text-xs leading-relaxed pl-15 ml-[60px]">
          {achievement.description ?? <em>No description available.</em>}
        </p>
      )}
    </div>
  );
}
