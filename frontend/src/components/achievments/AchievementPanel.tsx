import { UserProfile, ProfileAchievement } from "@/types/profile"
import { Label } from "@/components/ui/label"
import { useState } from "react";
import { Link } from "react-router-dom";
import { AchievementsGrid } from "./AchievementsGrid";
import { AchievementIcon } from "./AchievementIcon";

type AchievementPanelProps = {
    profile: UserProfile;
}
type FilterOption = "newest" | "oldest" | "a-z" | "z-a" | "rarest" | "common" | "game";

function GroupedByGameView({ profile }: { profile: UserProfile }) {
    const grouped = (profile.achievements ?? []).reduce<
        Record<number, { game: ProfileAchievement["game"]; items: ProfileAchievement[] }>
    >((acc, pa) => {
        if (!acc[pa.game.id]) acc[pa.game.id] = { game: pa.game, items: [] };
        acc[pa.game.id].items.push(pa);
        return acc;
    }, {});
 
    const sortedGroups = Object.values(grouped).sort((a, b) =>
        a.game.name.localeCompare(b.game.name)
    );
 
    return (
        <div className="space-y-5">
            {sortedGroups.map(({ game, items }) => (
                <div key={game.id}>
                    <Link
                        to={`/u/${profile.handle}/games/${game.steamAppId}/achievements`}
                        className="flex items-center gap-2 mb-2 group w-fit"
                    >
                        {game.iconUrl ? (
                            <img
                                src={game.iconUrl}
                                alt={game.name}
                                className="h-5 w-5 rounded object-cover"
                            />
                        ) : (
                            <FileQuestion className="h-5 w-5 text-app-muted" />
                        )}
                        <span className="text-sm font-medium text-app-muted group-hover:text-brand transition-colors">
                            {game.name}
                        </span>
                        <span className="text-xs text-app-border group-hover:text-brand transition-colors">
                            ({items.length})
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-app-border group-hover:text-brand transition-colors" />
                    </Link>
                    <div className="flex flex-wrap gap-1">
                        {items.map((pa) => (
                            <AchievementIcon key={pa.id} achievement={pa} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export const AchievementPanel = ({profile}: AchievementPanelProps) => {
    const [filter, setFilter] = useState<FilterOption>("newest");
    const pinnedAchievements =
        profile.achievements?.filter((item) => item.isPinned) ?? [];
    return (
        <>
        <div className="h-full p-4 bg-app-panel rounded-lg shadow-md shadow-app-border mb-4">
            <h2 className="app-heading mb-2">Pinned Achievements</h2>
            {pinnedAchievements.length ? (
                <div className="flex flex-row flex-wrap max-h-48 min-h-fit">
                    {pinnedAchievements.map((item) => (
                        <div key={item.id} className="text-sm m-1">
                        <AchievementIcon achievement={item} />
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-app-muted text-sm">No pinned achievements yet.</p>
            )}
        </div>
        <div className="bg-app-panel overflow-hidden p-4 rounded-lg shadow-md shadow-app-border">
            <div className="flex items-center mb-4">
                <Label
                    htmlFor="filter"
                    className="text-app-label mr-2"
                >
                    Filter by:
                </Label>
                <select
                    id="filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterOption)}
                    className="bg-app-bg text-app-text placeholder:text-app-placeholder border border-app-border rounded-md focus:outline-none focus:ring-2 focus:ring-app-focus"
                >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="a-z">A-Z</option>
                    <option value="z-a">Z-A</option>
                    <option value="rarest">Rarest</option>
                    <option value="common">Common</option>
                    <option value="game">Game</option>
                </select>
            </div>
            <div className="max-h-[31.5rem] overflow-y-auto app-scrollbar pr-1 flex justify-center">
                {filter === "game" ? (
                    <div className="w-full">
                        <GroupedByGameView profile={profile} />
                    </div>
                ) : (
                    <AchievementsGrid profile={profile} filter={filter} />
                )}
            </div>
        </div>
        </>
    )
}
