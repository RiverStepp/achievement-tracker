import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { leaderboardService, type LeaderboardEntry } from "@/services/leaderboard";

const PAGE_SIZE = 25;

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-bold text-yellow-400">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-400/20 text-sm font-bold text-slate-300">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700/20 text-sm font-bold text-amber-600">
        3
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center text-sm font-medium text-app-muted">
      {rank}
    </span>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-semibold text-app-text">{value.toLocaleString()}</span>
      <span className="text-xs text-app-muted">{label}</span>
    </div>
  );
}

function EntryRow({ entry }: { entry: LeaderboardEntry }) {
  const displayName = entry.personaName ?? "Unknown";
  const initials = displayName.charAt(0).toUpperCase();

  const nameContent = (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={entry.avatarUrl ?? undefined} alt={`${displayName} avatar`} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-app-text">{displayName}</p>
        {entry.isClaimed ? (
          <p className="text-xs text-app-muted">Member</p>
        ) : (
          <p className="text-xs text-app-muted">Steam profile</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-app-bg">
      <div className="w-8 shrink-0 flex justify-center">
        <RankBadge rank={entry.rank} />
      </div>

      <div className="flex-1 min-w-0">
        {entry.isClaimed && entry.publicId ? (
          <Link to={`/u/${entry.publicId}`} className="block">
            {nameContent}
          </Link>
        ) : (
          nameContent
        )}
      </div>

      <div className="hidden sm:flex items-center gap-6">
        <StatCell label="Points" value={entry.totalPoints} />
        <StatCell label="Achievements" value={entry.totalAchievementsUnlocked} />
        <StatCell label="Perfect" value={entry.perfectGamesCount} />
        <StatCell label="Games" value={entry.totalGamesTracked} />
      </div>

      {/* Mobile: points only */}
      <div className="sm:hidden">
        <StatCell label="Pts" value={entry.totalPoints} />
      </div>
    </div>
  );
}

export const LeaderboardPanel = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchPage = async (page: number, append: boolean) => {
    try {
      const result = await leaderboardService.getPage(page, PAGE_SIZE);
      setEntries((prev) => (append ? [...prev, ...result.entries] : result.entries));
      setTotalCount(result.totalCount);
      setHasMore(page * PAGE_SIZE < result.totalCount);
      setCurrentPage(page);
    } catch {
      setError("Failed to load leaderboard. Please try again.");
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    setIsLoadingInitial(true);
    fetchPage(1, false).finally(() => setIsLoadingInitial(false));
  }, []);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await fetchPage(currentPage + 1, true);
    setIsLoadingMore(false);
  };

  return (
    <div className="bg-app-panel rounded-lg shadow-md shadow-app-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-app-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="app-heading text-lg font-bold">Leaderboard</h1>
            {!isLoadingInitial && totalCount > 0 && (
              <p className="text-xs text-app-muted mt-0.5">
                {totalCount.toLocaleString()} ranked players
              </p>
            )}
          </div>
          {/* Column headers — desktop */}
          <div className="hidden sm:flex items-center gap-6 pr-1 text-xs text-app-muted">
            <span className="w-[52px] text-center">Points</span>
            <span className="w-[78px] text-center">Achievements</span>
            <span className="w-[44px] text-center">Perfect</span>
            <span className="w-[40px] text-center">Games</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="divide-y divide-app-border/50">
        {isLoadingInitial ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-app-muted text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                setError(null);
                setIsLoadingInitial(true);
                fetchPage(1, false).finally(() => setIsLoadingInitial(false));
              }}
            >
              Retry
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-app-muted text-sm">No entries yet.</p>
          </div>
        ) : (
          <>
            <div className="px-1">
              {entries.map((entry) => (
                <EntryRow key={`${entry.rank}-${entry.steamProfileId}`} entry={entry} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center p-4 border-t border-app-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="text-app-muted hover:text-app-text"
                >
                  {isLoadingMore ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="h-4 w-4" />
                      Loading…
                    </span>
                  ) : (
                    `Load more (${entries.length} / ${totalCount.toLocaleString()})`
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
