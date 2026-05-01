import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Feed } from "../home/Feed";
import type { ProfileAchievementSortMode, UserProfile } from "@/types/profile";
import { AboutPanel } from "./AboutPanel";
import { LatestActivities } from "./LatestActivities";
import { AchievementPanel } from "../achievments/AchievementPanel";
import { GamesPanel } from "../game/GamesPanel";

type ProfileTabsProps = {
    profile: UserProfile;
    isMe?: boolean;
    onPinnedAchievementsSaved?: () => void;
    achievementSortMode: ProfileAchievementSortMode;
    onAchievementSortModeChange: (mode: ProfileAchievementSortMode) => void;
};

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
    profile,
    isMe = false,
    onPinnedAchievementsSaved,
    achievementSortMode,
    onAchievementSortModeChange,
}) => {
  return (
    <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="bg-app-panel h-full min-h-full rounded-xl  shadow-md shadow-app-border">
            <TabsTrigger value="achievements" className="">
                Achievements
            </TabsTrigger>
            <TabsTrigger value="games" className="">
                Games
            </TabsTrigger>
            <TabsTrigger value="Feed" className="">
                Feed
            </TabsTrigger>
            <TabsTrigger value="about" className="lg:hidden">
                About
            </TabsTrigger>
        </TabsList>
        <TabsContent value="achievements">
            <AchievementPanel
              profile={profile}
              achievementSortMode={achievementSortMode}
              onAchievementSortModeChange={onAchievementSortModeChange}
              isMe={isMe}
              onPinnedAchievementsSaved={onPinnedAchievementsSaved}
            />
        </TabsContent>
        <TabsContent value="games">
            <GamesPanel profile={profile} />
        </TabsContent>
        <TabsContent value="Feed">
            <Feed variant="profile" userProfile={profile} />    
        </TabsContent>
        <TabsContent value="about" className="lg:hidden">
            <div className="space-y-4">
                <AboutPanel profile={profile} />
                <LatestActivities profile={profile} />
            </div>
        </TabsContent>
    </Tabs>
    );
};
