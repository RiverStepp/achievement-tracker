import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Feed } from "../home/Feed";
import { UserProfile } from "@/types/profile";
import { AboutPanel } from "./AboutPanel";
import { LatestAcheivements } from "./LatestAcheivements";

type ProfileTabsProps = {
    profile: UserProfile;
};

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ profile }) => {
  return (
    <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="bg-app-panel h-full min-h-full rounded-xl  shadow-md shadow-app-border">
            <TabsTrigger value="achievements" className="">
                Achievements
            </TabsTrigger>
            <TabsTrigger value="Feed" className="">
                Feed
            </TabsTrigger>
            <TabsTrigger value="about" className="lg:hidden">
                About
            </TabsTrigger>
        </TabsList>
        <TabsContent value="achievements">
            <div className="bg-app-panel h-full min-h-full overflow-hidden p-4 rounded-lg shadow-md shadow-app-border">
                This is the Achievements tab content.
            </div>
        </TabsContent>
        <TabsContent value="Feed">
            <Feed variant="profile" userProfile={profile} />    
        </TabsContent>
        <TabsContent value="about" className="lg:hidden">
            <div className="space-y-4">
                <AboutPanel profile={profile} />
                <LatestAcheivements profile={profile} />
            </div>
        </TabsContent>
    </Tabs>
    );
};