import { LeaderboardWidget } from "@/components/leaderboard/LeaderboardWidget";

export const LeaderboardPage = () => {
  return (
    <div className="w-full flex justify-center min-h-0">
        <div className="w-full max-w-3xl p-4">
        <LeaderboardPanel />
      </div>
    </div>
  );
};
