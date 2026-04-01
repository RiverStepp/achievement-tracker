import { ProfileAchievement } from "@/types/profile";
import { FileQuestion } from 'lucide-react';
type AchievementCardProps = {
    achievement: ProfileAchievement;
};

export const AchievementCard = ({ achievement }: AchievementCardProps) => {
    return (
        <div>
            <div className="flex items-center mb-2">
                {achievement.game.iconUrl ?
                 <img src={achievement.game.iconUrl} alt={`${achievement.game.name} Icon`} className="h-4 w-4 object-cover rounded mr-2" />
                  : <FileQuestion className="h-4 w-4 text-app-muted mr-1" />}
                <span className="text-app-muted text-xs">{achievement.game.name}</span>
            </div>
            <h3 className="app-heading text-sm">{achievement.achievement.name}</h3>
            <p className="text-app-muted text-xs">{achievement.achievement.description}</p>
            <p className="text-app-muted text-xs mt-1">{achievement.achievement.globalPercentage?.toFixed(1)}% of players have unlocked this.</p>
        </div>
    );
}
