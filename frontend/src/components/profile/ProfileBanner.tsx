import type { UserProfile } from "@/types/profile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type ProfileBannerProps = {
  profile: UserProfile;
};

export const ProfileBanner = ({ profile }: ProfileBannerProps) => {
  const summary = profile.summary;
  const bannerUrl = profile.identity.bannerUrl;

  return (
    <div className="w-full h-fit bg-app-panel rounded-lg shadow-md shadow-app-border overflow-hidden">
      <div
        className="relative h-40 w-full bg-app-panel"
        style={
          bannerUrl
            ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-app-panel/90 via-app-panel/40 to-transparent" />
      </div>
      <div className="relative p-4 pt-0">
        <Avatar className="h-24 w-24 border-4 border-app-bg -mt-12 ml-2">
          <AvatarImage src={profile.user.avatarUrl} alt={`${profile.identity.displayName}'s avatar`} />
          <AvatarFallback>{profile.identity.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="pt-2">
          <h1 className="text-2xl font-bold">{profile.identity.displayName}</h1>
          <p className="text-app-muted">@{profile.identity.handle}</p>
        </div>
        {summary && (
          <div className="mt-3 flex gap-6 text-sm text-app-muted">
            <div>
              <span className="text-app-text font-semibold">{summary.totalAchievements}</span> achievements
            </div>
            <div>
              <span className="text-app-text font-semibold">{summary.gamesTracked}</span> games
            </div>
            {typeof summary.hoursPlayed === "number" && (
              <div>
                <span className="text-app-text font-semibold">{summary.hoursPlayed}</span> hours
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
