import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { GameDetailsAchievement } from "@/types/game";
import { GameAchievementRow } from "./GameAchievementRow";
import { TooltipProvider } from "@/components/ui/tooltip";
 
type SortOption = "points-asc" | "points-desc" | "a-z" | "z-a" | "rarest" | "common";
 
const SORT_LABELS: Record<SortOption, string> = {
  "points-asc": "Points (Low → High)",
  "points-desc": "Points (High → Low)",
  "a-z": "A → Z",
  "z-a": "Z → A",
  rarest: "Rarest First",
  common: "Most Common First",
};
 
type GameAchievementListProps = {
  achievements: GameDetailsAchievement[];
};
 
export function GameAchievementList({ achievements }: GameAchievementListProps) {
  const [sort, setSort] = useState<SortOption>("points-asc");
  const [showAllDescriptions, setShowAllDescriptions] = useState(false);
 
  const sorted = useMemo(() => {
    const copy = [...achievements];
    const compareName = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: "base" });
 
    copy.sort((a, b) => {
      switch (sort) {
        case "points-asc":
          return a.points - b.points;
        case "points-desc":
          return b.points - a.points;
        case "a-z":
          return compareName(a.name, b.name);
        case "z-a":
          return compareName(b.name, a.name);
        case "rarest":
          return (a.globalPercentage ?? Infinity) - (b.globalPercentage ?? Infinity);
        case "common":
          return (b.globalPercentage ?? -Infinity) - (a.globalPercentage ?? -Infinity);
        default:
          return 0;
      }
    });
 
    return copy;
  }, [achievements, sort]);
 
  return (
    <TooltipProvider>
      <div className="rounded-xl bg-app-panel shadow-md shadow-app-border">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-app-border flex-wrap">
          <span className="app-heading text-sm">
            {achievements.length} Achievements
          </span>
 
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="text-xs rounded-md border border-app-border bg-app-bg text-app-text px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <option key={opt} value={opt}>
                  {SORT_LABELS[opt]}
                </option>
              ))}
            </select>
 
            <button
              type="button"
              onClick={() => setShowAllDescriptions((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-app-border bg-app-bg px-3 py-1.5 text-xs text-app-muted hover:text-app-text hover:border-brand transition-colors"
              title={showAllDescriptions ? "Hide all descriptions" : "Reveal all descriptions"}
            >
              {showAllDescriptions ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Hide descriptions</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span>Reveal descriptions</span>
                </>
              )}
            </button>
          </div>
        </div>
 
        <div className="divide-y divide-app-border/50 px-1">
          {sorted.map((achievement) => (
            <GameAchievementRow
              key={achievement.achievementId}
              achievement={achievement}
              showDescription={showAllDescriptions}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
