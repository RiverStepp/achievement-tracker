import type { UserProfile } from "@/types/profile";

type FeedProps = {
  variant?: "home" | "profile";
  userProfile?: UserProfile;
};

// src/components/Feed.tsx
export const Feed = ({ variant, userProfile }: FeedProps) => {
  const resolvedVariant = variant ?? (userProfile ? "profile" : "home");
  const isProfileFeed = resolvedVariant === "profile" && !!userProfile;
  const profileFeedItems = userProfile?.feed?.items ?? [];

  const title = isProfileFeed ? `${userProfile.displayName}'s Feed` : "Feed";
  const subtitle = isProfileFeed
    ? `Posts from @${userProfile.handle}`
    : "Latest posts from people you follow";

  return (
    <>
    <section className="bg-app-panel h-full min-h-full overflow-hidden p-4 rounded-lg shadow-md shadow-app-border">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-app-muted">{subtitle}</p>
      {isProfileFeed && profileFeedItems.length === 0 && (
        <p className="mt-6 text-sm text-app-muted">This user has not posted anything yet.</p>
      )}
    </section>
    </>
  );
};
