import { UserProfile } from "@/types/profile"
import { Label } from "@/components/ui/label"
import { useState } from "react";
import { AchievementsGrid } from "./AchievementsGrid";
import { AchievementIcon } from "./AchievementIcon";

type AchievementPanelProps = {
    profile: UserProfile;
}
type FilterOption = "newest" | "oldest" | "a-z" | "z-a" | "rarest" | "common" | "game";

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
                <AchievementsGrid profile={profile} filter={filter} />
            </div>
        </div>
        </>
    )
}
