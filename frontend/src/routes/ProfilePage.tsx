import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { UserProfile } from "@/types/profile";
import { useAuth } from "@/auth/AuthProvider";
import { ProfileBanner } from "@/components/profile/ProfileBanner";
import { mockUserProfile } from "@/data/mockUser";
import { AboutPanel } from "@/components/profile/AboutPanel";
import { LatestActivities } from "@/components/profile/LatestActivities";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { profileService } from "@/services/profile";

const guidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function ProfilePage() {
  const { profileKey } = useParams<{ profileKey: string }>();
  const { userProfile: currentUserProfile, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const USE_MOCK_PROFILE = import.meta.env.DEV;

  useEffect(() => {
    if (!profileKey) {
      console.log("[profile-page] no profile key in route");
      setProfile(null);
      setLoading(false);
      return;
    }

    if (isAuthLoading) {
      console.log("[profile-page] auth still loading", { profileKey });
      setLoading(true);
      return;
    }

    const normalizedKey = profileKey.toLowerCase();
    const currentHandle = currentUserProfile?.handle?.toLowerCase();
    const currentPublicId = currentUserProfile?.user.publicId?.toLowerCase();
    const isCurrentUsersProfile =
      currentUserProfile &&
      (normalizedKey === currentHandle || normalizedKey === currentPublicId);
    const fallbackProfile =
      isCurrentUsersProfile
        ? currentUserProfile
        : USE_MOCK_PROFILE &&
            (normalizedKey === mockUserProfile.handle.toLowerCase() ||
              normalizedKey === mockUserProfile.user.publicId?.toLowerCase())
          ? mockUserProfile
          : null;
    const resolvedPublicId =
      guidPattern.test(profileKey)
        ? profileKey
        : isCurrentUsersProfile
          ? currentUserProfile?.user.publicId
          : null;

    console.log("[profile-page] route resolution", {
      profileKey,
      currentHandle,
      currentPublicId,
      isCurrentUsersProfile: Boolean(isCurrentUsersProfile),
      fallbackHandle: fallbackProfile?.handle ?? null,
      fallbackPublicId: fallbackProfile?.user.publicId ?? null,
      resolvedPublicId: resolvedPublicId ?? null,
      currentUserProfileSnapshot: currentUserProfile
        ? {
            handle: currentUserProfile.handle,
            publicId: currentUserProfile.user.publicId ?? null,
            achievementCount: currentUserProfile.achievements?.length ?? 0,
          }
        : null,
    });

    if (!resolvedPublicId) {
      console.log("[profile-page] no resolvable publicId, using fallback profile only", {
        profileKey,
        fallbackHandle: fallbackProfile?.handle ?? null,
      });
      setProfile(fallbackProfile);
      setLoading(false);
      return;
    }

    setLoading(true);

    profileService
      .getProfile(resolvedPublicId, undefined, fallbackProfile, {
        steamId: isCurrentUsersProfile ? currentUserProfile?.steam?.steamId : fallbackProfile?.steam?.steamId,
        isSelf: Boolean(isCurrentUsersProfile),
      })
      .then((res) => {
        console.log("[profile-page] profile fetch succeeded", {
          profileKey,
          resolvedPublicId,
          handle: res.handle,
          achievementCount: res.achievements?.length ?? 0,
          summary: res.summary,
        });
        setProfile(res);
      })
      .catch((error) => {
        console.log("[profile-page] profile fetch failed", {
          profileKey,
          resolvedPublicId,
          error,
          fallbackHandle: fallbackProfile?.handle ?? null,
        });
        setProfile(fallbackProfile);
      })
      .finally(() => setLoading(false));
  }, [profileKey, USE_MOCK_PROFILE, currentUserProfile, isAuthLoading]);

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>Profile not found.</div>;

  console.log("[profile-page] rendering profile", {
    routeKey: profileKey,
    handle: profile.handle,
    publicId: profile.user.publicId,
    achievementCount: profile.achievements?.length ?? 0,
    pinnedCount: profile.achievements?.filter((item) => item.isPinned).length ?? 0,
    summary: profile.summary,
  });

  // isMe = logged-in user route matches either handle or public id
  let isMe =
    !!currentUserProfile &&
    !!profileKey &&
    (currentUserProfile.handle.toLowerCase() === profileKey.toLowerCase() ||
      currentUserProfile.user.publicId?.toLowerCase() === profileKey.toLowerCase());
  if (isMe) {
    console.log("Viewing own profile:", currentUserProfile);
    isMe = true;
  }
  return (
    <div className="w-full flex justify-center min-h-0">
      <div className="w-full max-w-[1100px] relative grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        <div className="lg:col-span-3">
          <ProfileBanner profile={profile} isMe={isMe} />
        </div>
        <div className="lg:col-span-2 min-w-0 min-h-0">
          <ProfileTabs profile={profile} />
        </div>
        <div className="hidden lg:block lg:col-span-1 min-w-0 min-h-0 space-y-4">
          <AboutPanel profile={profile} />
          <LatestActivities profile={profile} />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
