import type { UserProfile } from "@/types/profile";
import { formatDate } from "@/lib/format";
import { SocialBrandIcon } from "@/components/profile/SocialBrandIcon";

type AboutProps = {
  profile: UserProfile;
};

export const AboutPanel = ({ profile }: AboutProps) => {
  const socials = profile.connections.socials ?? [];
  const steamSync = profile.steamSync;

  return (
    <div className="max-h-[460px] overflow-y-auto app-scrollbar p-4 bg-app-panel rounded-lg shadow-md shadow-app-border">
      <h2 className="app-heading mb-2">About</h2>
      <p className="text-app-text text-sm mb-3">{profile.bio || "Nothing here yet."}</p>

      <div className="text-xs text-app-muted space-y-1 mb-4">
        {profile.pronouns && <p>Pronouns: {profile.pronouns}</p>}
        {profile.location && <p>Location: {profile.location}</p>}
        {profile.timezone && <p>Timezone: {profile.timezone}</p>}
        <p>Joined: {formatDate(profile.joinedAt)}</p>
        {typeof profile.isClaimed === "boolean" ? (
          <p>Account: {profile.isClaimed ? "Claimed" : "Unclaimed"}</p>
        ) : null}
        {steamSync ? (
          <>
            {steamSync.lastSyncedDate ? (
              <p>Steam last synced: {formatDate(steamSync.lastSyncedDate)}</p>
            ) : null}
            {steamSync.lastCheckedDate ? (
              <p>Steam last checked: {formatDate(steamSync.lastCheckedDate)}</p>
            ) : null}
            <p>Steam profile privacy: {steamSync.isPrivate ? "Private" : "Public"}</p>
          </>
        ) : null}
      </div>

      <hr className="mb-3 border-app-border" />

      <h3 className="font-semibold text-sm mb-2 text-app-text">Socials</h3>
      {socials.length ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {socials.map((social) => (
            <SocialBrandIcon key={`${social.kind}-${social.url}`} kind={social.kind} url={social.url} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-app-muted mb-4">No social links.</p>
      )}
    </div>
  );
};
