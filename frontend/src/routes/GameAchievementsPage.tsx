import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Lock,
  Check,
  Trophy,
  FileQuestion,
} from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { api } from "@/lib/api";
import { steamProxyService } from "@/services/steamProxy";
import type { UserProfile } from "@/types/profile";
import { cn } from "@/lib/utils";
 
// Steam API response types
 
type SteamAchievementSchema = {
  name: string;        // API name (matches GetPlayerAchievements apiname)
  displayName: string;
  hidden: number;
  description?: string;
  icon: string;
  icongray: string;
};
 
type SteamSchemaResponse = {
  game?: {
    gameName: string;
    availableGameStats?: {
      achievements?: SteamAchievementSchema[];
    };
  };
};
 
type SteamPlayerAchievement = {
  apiname: string;
  achieved: number;   // 1 = unlocked, 0 = locked
  unlocktime: number; // Unix timestamp (0 if locked)
};
 
type SteamPlayerAchievementsResponse = {
  playerstats?: {
    steamID: string;
    gameName: string;
    achievements?: SteamPlayerAchievement[];
    error?: string;
  };
};
 
type SteamGlobalPercentagesResponse = {
  achievementpercentages?: {
    achievements?: { name: string; percent: number }[];
  };
};
 
// Display type 
 
type AchievementRow = {
  apiname: string;
  displayName: string;
  description?: string;
  icon: string;
  icongray: string;
  hidden: boolean;
  unlocked: boolean;
  unlockedAt?: Date;
  globalPercent?: number;
};
 
type SortOption = "newest" | "oldest" | "a-z" | "z-a" | "rarest" | "common";
type ShowFilter = "all" | "unlocked" | "locked";
 
//  Helpers 
 
const fallbackIcon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23334155'/%3E%3Cpath d='M14 34l8-9 6 7 4-5 6 7H14z' fill='%2394a3b8'/%3E%3Ccircle cx='18' cy='16' r='4' fill='%2394a3b8'/%3E%3C/svg%3E";
 
function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
 
// Sub-components
 
function CompletionBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full bg-app-border rounded-full h-2 overflow-hidden">
      <div
        className="bg-brand h-2 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
 
function GlobalPctBar({ pct, unlocked }: { pct: number; unlocked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-36 bg-app-border rounded-full h-1.5 overflow-hidden">
        <div
          className={cn("h-1.5 rounded-full", unlocked ? "bg-brand" : "bg-slate-600")}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs text-app-muted">{pct.toFixed(1)}% global</span>
    </div>
  );
}
 
function AchievementListRow({ row }: { row: AchievementRow }) {
  const isLocked = !row.unlocked;
  const isHidden = row.hidden && isLocked;
 
  return (
    <div
      className={cn(
        "flex items-start gap-4 px-5 py-4 transition-colors",
        isLocked ? "opacity-60 hover:opacity-80" : "hover:bg-app-panel2/40"
      )}
    >
      {/* Icon */}
      <div className={cn("flex-shrink-0 mt-0.5", isLocked && "grayscale")}>
        <img
          src={isHidden ? fallbackIcon : (row.icon || fallbackIcon)}
          alt={isHidden ? "Hidden achievement" : row.displayName}
          className="h-14 w-14 rounded-lg border border-app-border object-cover shadow-md shadow-app-border"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackIcon;
          }}
        />
      </div>
 
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className={cn(
                "font-semibold leading-snug",
                isLocked ? "text-app-muted" : "text-app-text"
              )}
            >
              {isHidden ? "???" : row.displayName}
            </h3>
            <p className="text-app-muted text-sm mt-0.5 leading-snug">
              {isHidden
                ? "Hidden achievement"
                : (row.description || "No description available.")}
            </p>
          </div>
 
          {/* Unlock status */}
          <div className="flex-shrink-0 mt-0.5">
            {row.unlocked ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 whitespace-nowrap">
                <Check className="h-3.5 w-3.5" />
                <span>{row.unlockedAt ? formatDate(row.unlockedAt) : "Unlocked"}</span>
              </div>
            ) : (
              <Lock className="h-4 w-4 text-app-muted" />
            )}
          </div>
        </div>
 
        {row.globalPercent !== undefined && (
          <div className="mt-2">
            <GlobalPctBar pct={row.globalPercent} unlocked={row.unlocked} />
          </div>
        )}
      </div>
    </div>
  );
}
 
// ─── Page ──
 
export function GameAchievementsPage() {
  const { handle, steamAppId } = useParams<{ handle: string; steamAppId: string }>();
  const { userProfile: currentUser } = useAuth();
 
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rows, setRows] = useState<AchievementRow[]>([]);
  const [gameName, setGameName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [show, setShow] = useState<ShowFilter>("all");
 
  useEffect(() => {
    if (!handle || !steamAppId) {
      setLoading(false);
      return;
    }
 
    const appId = parseInt(steamAppId, 10);
    if (isNaN(appId)) {
      setError("Invalid game ID.");
      setLoading(false);
      return;
    }
 
    async function load() {
      setLoading(true);
      setError(null);
 
      try {
        // 1. Load user profile (for their Steam ID and cached unlock data)
        let resolvedProfile: UserProfile | null = null;
 
        if (
          currentUser &&
          handle!.toLowerCase() === currentUser.handle.toLowerCase()
        ) {
          resolvedProfile = currentUser;
        } else {
          const res = await api.get<UserProfile>(
            `/api/users/by-handle/${handle}`
          );
          resolvedProfile = res.data;
        }
 
        setProfile(resolvedProfile);
 
        const steamId = resolvedProfile.steam?.steamId;
 
        // 2. Fetch the full achievement schema for this game
        const schemaRaw = await steamProxyService.getSchemaForGame({ appId });
        const schema = schemaRaw as SteamSchemaResponse;
        const schemaAchievements =
          schema.game?.availableGameStats?.achievements ?? [];
 
        setGameName(schema.game?.gameName ?? "");
 
        // 3. Fetch the player's achievement status (requires their Steam ID)
        const unlockMap = new Map<string, Date>();
        if (steamId) {
          try {
            const playerRaw = await steamProxyService.getPlayerAchievements({
              steamId,
              appId,
            });
            const playerData = playerRaw as SteamPlayerAchievementsResponse;
            for (const a of playerData.playerstats?.achievements ?? []) {
              if (a.achieved === 1) {
                unlockMap.set(
                  a.apiname,
                  new Date(a.unlocktime * 1000)
                );
              }
            }
          } catch {
            // Player achievements may be private — fall through with empty unlocks
          }
        }
 
        // 4. Fetch global achievement percentages
        const globalPctMap = new Map<string, number>();
        try {
          const globalRaw = await steamProxyService.getGlobalAchievementPercentages(
            { gameId: appId }
          );
          const globalData = globalRaw as SteamGlobalPercentagesResponse;
          for (const a of globalData.achievementpercentages?.achievements ?? []) {
            globalPctMap.set(a.name, a.percent);
          }
        } catch {
          // Non-fatal (page works fine without global percentages)
        }
 
        // 5. Merge into display rows
        const merged: AchievementRow[] = schemaAchievements.map((s) => ({
          apiname: s.name,
          displayName: s.displayName,
          description: s.description,
          icon: s.icon,
          icongray: s.icongray,
          hidden: s.hidden === 1,
          unlocked: unlockMap.has(s.name),
          unlockedAt: unlockMap.get(s.name),
          globalPercent: globalPctMap.get(s.name),
        }));
 
        setRows(merged);
      } catch (err) {
        setError("Failed to load achievements. The game may not support Steam achievements, or the player's profile is private.");
      } finally {
        setLoading(false);
      }
    }
 
    load();
  }, [handle, steamAppId, currentUser]);
 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-app-muted text-sm">
        Loading…
      </div>
    );
  }
 
  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <Trophy className="h-8 w-8 text-app-muted" />
        <p className="text-app-muted text-sm text-center max-w-sm">
          {error ?? "Profile not found."}
        </p>
      </div>
    );
  }
 
  // Derive game info from profile achievements (for icon/header image)
  const gameInfo = profile.achievements?.find(
    (pa) => pa.game.steamAppId === parseInt(steamAppId!, 10)
  )?.game;
 
  // Apply show filter
  let visible = rows;
  if (show === "unlocked") visible = rows.filter((r) => r.unlocked);
  if (show === "locked") visible = rows.filter((r) => !r.unlocked);
 
  // Apply sort
  visible = [...visible].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        if (a.unlockedAt && b.unlockedAt)
          return b.unlockedAt.getTime() - a.unlockedAt.getTime();
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return 0;
      case "oldest":
        if (a.unlockedAt && b.unlockedAt)
          return a.unlockedAt.getTime() - b.unlockedAt.getTime();
        if (a.unlocked && !b.unlocked) return 1;
        if (!a.unlocked && b.unlocked) return -1;
        return 0;
      case "a-z":
        return a.displayName.localeCompare(b.displayName);
      case "z-a":
        return b.displayName.localeCompare(a.displayName);
      case "rarest":
        return (a.globalPercent ?? 100) - (b.globalPercent ?? 100);
      case "common":
        return (b.globalPercent ?? 0) - (a.globalPercent ?? 0);
      default:
        return 0;
    }
  });
 
  const unlockedCount = rows.filter((r) => r.unlocked).length;
  const totalCount = rows.length;
  const completionPct = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
  const displayGameName = gameName || gameInfo?.name || "Unknown Game";
 
  const SHOW_OPTIONS: ShowFilter[] = ["all", "unlocked", "locked"];
 
  return (
    <div className="w-full max-w-[900px] mx-auto space-y-4 pb-8">
 
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-app-muted">
        <Link
          to={`/u/${handle}`}
          className="flex items-center gap-1 hover:text-app-text transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {profile.displayName}
        </Link>
        <span className="text-app-border">/</span>
        <span className="text-app-text font-medium">{displayGameName}</span>
      </div>
 
      {/* Game Header Card */}
      <div className="relative rounded-xl overflow-hidden bg-app-panel shadow-md shadow-app-border">
        {gameInfo?.headerImageUrl && (
          <>
            <img
              src={gameInfo.headerImageUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover opacity-15 select-none pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-app-panel via-app-panel/85 to-app-panel/40" />
          </>
        )}
 
        <div className="relative p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          {gameInfo?.iconUrl ? (
            <img
              src={gameInfo.iconUrl}
              alt={displayGameName}
              className="h-16 w-16 rounded-xl border border-app-border shadow-md flex-shrink-0 object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallbackIcon;
              }}
            />
          ) : (
            <div className="h-16 w-16 rounded-xl border border-app-border bg-app-bg flex items-center justify-center flex-shrink-0">
              <FileQuestion className="h-8 w-8 text-app-muted" />
            </div>
          )}
 
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-app-text">{displayGameName}</h1>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-app-muted">
                  {unlockedCount} / {totalCount} achievements
                </span>
                <span
                  className={cn(
                    "font-bold",
                    completionPct === 100
                      ? "text-yellow-400"
                      : completionPct > 0
                      ? "text-brand"
                      : "text-app-muted"
                  )}
                >
                  {completionPct.toFixed(1)}%
                </span>
              </div>
              <CompletionBar value={unlockedCount} max={totalCount} />
            </div>
          </div>
        </div>
      </div>
 
      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Unlocked", value: unlockedCount, color: "text-brand" },
          { label: "Locked", value: totalCount - unlockedCount, color: "text-app-muted" },
          {
            label: "Completion",
            value: `${completionPct.toFixed(1)}%`,
            color:
              completionPct === 100
                ? "text-yellow-400"
                : completionPct > 0
                ? "text-emerald-400"
                : "text-app-muted",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-app-panel rounded-lg p-3 text-center shadow-md shadow-app-border"
          >
            <div className={cn("text-xl font-bold", stat.color)}>{stat.value}</div>
            <div className="text-app-muted text-xs mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
 
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="ga-sort" className="text-app-muted text-sm whitespace-nowrap">
            Sort by:
          </label>
          <select
            id="ga-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-app-bg text-app-text border border-app-border rounded-md text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="a-z">A–Z</option>
            <option value="z-a">Z–A</option>
            <option value="rarest">Rarest</option>
            <option value="common">Most Common</option>
          </select>
        </div>
 
        <div className="flex rounded-lg border border-app-border overflow-hidden text-sm">
          {SHOW_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setShow(opt)}
              className={cn(
                "px-3 py-1.5 capitalize transition-colors",
                show === opt
                  ? "bg-brand text-white"
                  : "bg-app-bg text-app-muted hover:bg-app-panel2 hover:text-app-text"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
 
        <span className="text-app-muted text-sm ml-auto">
          {visible.length} achievement{visible.length !== 1 ? "s" : ""}
        </span>
      </div>
 
      {/* Achievement List */}
      <div className="bg-app-panel rounded-xl shadow-md shadow-app-border overflow-hidden">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-app-muted">
            <Trophy className="h-8 w-8" />
            <p className="text-sm">No achievements match this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-app-border">
            {visible.map((row) => (
              <AchievementListRow key={row.apiname} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
export default GameAchievementsPage;
