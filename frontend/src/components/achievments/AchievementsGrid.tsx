import { useEffect, useState } from "react";
import { ProfileAchievement, UserProfile } from "@/types/profile";
import { AchievementIcon } from "@/components/achievments/AchievementIcon";

type AchievementsGridProps = {
    profile: UserProfile;
    filter: "newest" | "oldest" | "a-z" | "z-a" | "rarest" | "common" | "game";
}

export const AchievementsGrid = ({ profile, filter }: AchievementsGridProps) => {
    const [sortedAchievements, setSortedAchievements] = useState<ProfileAchievement[]>([]);

    useEffect(() => {
        const achievements = [...(profile.achievements ?? [])];

        const compareNames = (a: string, b: string) =>
            a.localeCompare(b, undefined, { sensitivity: "base" });

        achievements.sort((a, b) => {
            switch (filter) {
                case "newest":
                    return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
                case "oldest":
                    return new Date(a.unlockedAt).getTime() - new Date(b.unlockedAt).getTime();
                case "a-z":
                    return compareNames(a.achievement.name, b.achievement.name);
                case "z-a":
                    return compareNames(b.achievement.name, a.achievement.name);
                case "rarest":
                    return (a.achievement.globalPercentage ?? Number.POSITIVE_INFINITY) -
                        (b.achievement.globalPercentage ?? Number.POSITIVE_INFINITY);
                case "common":
                    return (b.achievement.globalPercentage ?? Number.NEGATIVE_INFINITY) -
                        (a.achievement.globalPercentage ?? Number.NEGATIVE_INFINITY);
                case "game":
                    return (
                        compareNames(a.game.name, b.game.name) ||
                        compareNames(a.achievement.name, b.achievement.name)
                    );
                default:
                    return 0;
            }
        });

        setSortedAchievements(achievements);
    }, [profile.achievements, filter]);

    return (
        <div className="inline-flex flex-row flex-wrap min-h-fit w-fit">
            {sortedAchievements.map((achievement, index) => (
                <div
                    key={`${achievement.id}-${achievement.achievement.id}-${achievement.unlockedAt}-${index}`}
                    className="text-sm m-1"
                >
                    <AchievementIcon achievement={achievement} />
                </div>
            ))}
        </div>
    )
}
