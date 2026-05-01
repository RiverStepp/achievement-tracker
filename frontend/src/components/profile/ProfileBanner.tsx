import type { UserProfile } from "@/types/profile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Gamepad2, Clock, Star, CircleCheck, Percent, PlayCircle } from "lucide-react";
import { ConnectionBadge } from "./ConnectionBadge";
import { RoleBadge } from "./RoleBadge";
import { ProfileActionsMenu } from "./ProfileActionsMenu";

type ProfileBannerProps = {
  profile: UserProfile;
  isMe?: boolean;
};

export const ProfileBanner = ({ profile, isMe }: ProfileBannerProps) => {
  const summary = profile.summary;
  const bannerUrl = profile.bannerUrl;
  const connections = profile.connections.linkedAccounts || [];
  const displayName =
    profile.displayName ||
    profile.steam?.personaName ||
    profile.handle;
  const avatarUrl =
    profile.avatarUrl ||
    profile.steam?.avatarMediumUrl ||
    profile.steam?.avatarFullUrl ||
    "https://placehold.co/128x128?text=User";
  
  return (
    <div className="w-full h-fit bg-app-panel rounded-lg shadow-md shadow-app-border overflow-visible">
      <div
        className="relative h-40 w-full overflow-hidden rounded-t-lg"
        style={
          bannerUrl
            ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <div className="absolute right-5 top-3 z-10">
          <ProfileActionsMenu handle={profile.handle} isMe={isMe} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-app-panel/85 via-app-panel/10 to-transparent" />
      </div>
      <div className="relative p-3 pt-0">
        <Avatar className="h-24 w-24 border-4 border-app-bg -mt-32 ml-2 mb-10">
          <AvatarImage src={avatarUrl} alt={`${displayName}'s avatar`} />
          <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="pt-2 grid w-full grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="order-1">
            <div className="flex items-center gap-2">
              {profile.user.roles?.[0] ? <RoleBadge role={profile.user.roles[0]} /> : null}
              <h1 className="app-heading">{displayName}</h1>
            </div>
            
            <p className="text-app-muted">@{profile.handle}</p>
            <div className="mt-3 flex flex-nowrap items-center gap-2 overflow-x-auto app-scrollbar">
              {connections.map((conn) => (
                <ConnectionBadge
                  key={`${conn.platform}-${conn.usernameOrId}`}
                  platform={conn.platform}
                  usernameOrId={conn.usernameOrId}
                  profileUrl={conn.profileUrl}
                  accountVerified={conn.accountVerified || false}
                />
              ))}
            </div>
              
          </div>
          {summary && (
            <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6 text-base text-app-muted order-2">
              {typeof summary.totalPoints === "number" ? (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-app-muted" aria-hidden="true" />
                  <span className="text-app-text font-semibold">{summary.totalPoints}</span> points
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-app-muted" aria-hidden="true" />
                <span className="text-app-text font-semibold">{summary.totalAchievements}</span> achievements
              </div>
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-app-muted" aria-hidden="true" />
                <span className="text-app-text font-semibold">{summary.gamesTracked}</span> owned
              </div>
              {typeof summary.gamesAt100Percent === "number" ? (
                <div className="flex items-center gap-2">
                  <CircleCheck className="h-4 w-4 text-app-muted" aria-hidden="true" />
                  <span className="text-app-text font-semibold">{summary.gamesAt100Percent}</span> completed
                </div>
              ) : null}
              {typeof summary.startedGamesCount === "number" ? (
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-app-muted" aria-hidden="true" />
                  <span className="text-app-text font-semibold">{summary.startedGamesCount}</span> started
                </div>
              ) : null}
              {typeof summary.avgCompletionPercent === "number" ? (
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-app-muted" aria-hidden="true" />
                  <span className="text-app-text font-semibold">
                    {summary.avgCompletionPercent.toFixed(1)}%
                  </span>
                  avg completion
                </div>
              ) : null}
              {typeof summary.hoursPlayed === "number" && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-app-muted" aria-hidden="true" />
                  <span className="text-app-text font-semibold">{summary.hoursPlayed}</span> hours
                </div>
              )}
            </div>
          )}
          <div className="order-3" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
