export const LeaderboardPage = () => {
  return (
    <div className="w-full flex justify-center min-h-0">
        <div className="w-full max-w-3xl p-4">
            <div className="bg-app-panel rounded-lg p-4 shadow-md shadow-app-border">
                <h1 className="app-heading">Leaderboard</h1>
                <p className="text-sm text-app-muted">
                    Page to showcase top users based on various criteria like total achievements, rarest achievements, etc.
                </p>
            </div>
        </div>
    </div>
  );
}