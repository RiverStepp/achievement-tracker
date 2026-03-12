import type { UserProfile } from "@/types/profile";
import { AchievementIcon } from "@/components/achievments/AchievementIcon";
import { formatDate } from "@/lib/format";

type AboutProps = {
  profile: UserProfile;
};

export const AboutPanel = ({ profile }: AboutProps) => {
  const pinnedAchievements =
    profile.achievements?.filter((item) => item.isPinned) ?? [];
  const socials = profile.connections.socials ?? [];

  return (
    <div className="max-h-[460px] overflow-y-auto app-scrollbar p-4 bg-app-panel rounded-lg shadow-md shadow-app-border">
      <h2 className="app-heading mb-2">About</h2>
      <p className="text-app-text text-sm mb-3">
        {profile.bio || "Nothing here yet."}
      </p>

      <div className="text-xs text-app-muted space-y-1 mb-4">
        {profile.pronouns && <p>Pronouns: {profile.pronouns}</p>}
        {profile.location && <p>Location: {profile.location}</p>}
        {profile.timezone && <p>Timezone: {profile.timezone}</p>}
        <p>Joined: {formatDate(profile.joinedAt)}</p>
      </div>

      <hr className="mb-3 border-app-border" />

      <h3 className="font-semibold text-sm mb-2 text-app-text">Socials</h3>
      {socials.length ? (
        <div className="space-y-1 mb-4">
          {socials.map((social) => (
            <a
              key={`${social.kind}-${social.url}`}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-app-muted hover:text-app-text underline underline-offset-2"
            >
              {social.kind}
            </a>
          ))}
        </div>
      ) : (
        <p className="text-xs text-app-muted mb-4">No social links.</p>
      )}
    </div>
  );
};
