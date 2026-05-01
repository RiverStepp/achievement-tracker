import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { ProfileAchievementSortMode, UserProfile } from "@/types/profile";
import { useAuth } from "@/auth/AuthProvider";
import { ProfileBanner } from "@/components/profile/ProfileBanner";
import { AboutPanel } from "@/components/profile/AboutPanel";
import { LatestActivities } from "@/components/profile/LatestActivities";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { profileService } from "@/services/profile";

const guidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function ProfilePage() {
  const { profileKey } = useParams<{ profileKey: string }>();
  const { userProfile: currentUserProfile, isLoading: isAuthLoading } = useAuth();
  const viewerProfileRef = useRef(currentUserProfile);
  viewerProfileRef.current = currentUserProfile;

  const lastSuccessfulFetchRouteKeyRef = useRef<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [achievementSortMode, setAchievementSortMode] =
    useState<ProfileAchievementSortMode>("latest");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!profileKey) {
        console.log("[profile-page] no profile key in route");
        lastSuccessfulFetchRouteKeyRef.current = null;
        setProfile(null);
        setLoading(false);
        return;
      }

      if (isAuthLoading) {
        console.log("[profile-page] auth still loading", { profileKey });
        setLoading(true);
        return;
      }

      const viewer = viewerProfileRef.current;
      const normalizedKey = profileKey.toLowerCase();
      const viewerHandle = viewer?.handle?.toLowerCase();
      const viewerPublicId = viewer?.user.publicId?.toLowerCase();
      const isCurrentUsersProfile =
        viewer &&
        (normalizedKey === viewerHandle || normalizedKey === viewerPublicId);
      const fallbackProfile = isCurrentUsersProfile ? viewer : null;
      let resolvedPublicId =
        guidPattern.test(profileKey)
          ? profileKey
          : isCurrentUsersProfile
            ? viewer?.user.publicId
            : null;

      if (!resolvedPublicId && !isCurrentUsersProfile) {
        resolvedPublicId = await profileService.resolvePublicIdByHandle(profileKey);
      }

      const silentSameRouteRefresh =
        profileRefreshKey > 0 && lastSuccessfulFetchRouteKeyRef.current === profileKey;

      console.log("[profile-page] route resolution", {
        profileKey,
        currentHandle: viewerHandle,
        currentPublicId: viewerPublicId,
        isCurrentUsersProfile: Boolean(isCurrentUsersProfile),
        fallbackHandle: fallbackProfile?.handle ?? null,
        fallbackPublicId: fallbackProfile?.user.publicId ?? null,
        resolvedPublicId: resolvedPublicId ?? null,
        viewerSnapshot: viewer
          ? {
              handle: viewer.handle,
              publicId: viewer.user.publicId ?? null,
              achievementCount: viewer.achievements?.length ?? 0,
            }
          : null,
        profileRefreshKey,
        silentSameRouteRefresh,
      });

      if (!resolvedPublicId) {
        console.log("[profile-page] no resolvable publicId, using fallback profile only", {
          profileKey,
          fallbackHandle: fallbackProfile?.handle ?? null,
        });
        if (!cancelled) {
          setProfile(fallbackProfile);
          setLoading(false);
        }
        return;
      }

      if (!silentSameRouteRefresh && !cancelled) {
        setLoading(true);
      }

      try {
        const res = await profileService.getProfile(resolvedPublicId, undefined, fallbackProfile, {
          steamId: isCurrentUsersProfile ? viewer?.steam?.steamId : fallbackProfile?.steam?.steamId,
          isSelf: Boolean(isCurrentUsersProfile),
        });

        console.log("[profile-page] profile fetch succeeded", {
          profileKey,
          resolvedPublicId,
          handle: res.handle,
          achievementCount: res.achievements?.length ?? 0,
          latestActivityCount: res.latestActivity?.length ?? 0,
          summary: res.summary,
        });

        if (!cancelled) {
          setProfile(res);
          lastSuccessfulFetchRouteKeyRef.current = profileKey;
        }
      } catch (error) {
        console.log("[profile-page] profile fetch failed", {
          profileKey,
          resolvedPublicId,
          error,
          fallbackHandle: fallbackProfile?.handle ?? null,
        });
        if (!cancelled) {
          setProfile(fallbackProfile);
          if (!silentSameRouteRefresh) {
            lastSuccessfulFetchRouteKeyRef.current = null;
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [profileKey, isAuthLoading, profileRefreshKey]);

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
          <ProfileTabs
            profile={profile}
            isMe={isMe}
            achievementSortMode={achievementSortMode}
            onAchievementSortModeChange={setAchievementSortMode}
            onPinnedAchievementsSaved={() => {
              console.log("[profile-page] refreshing profile after pinned achievement save", {
                publicId: profile.user.publicId ?? null,
              });
              setProfileRefreshKey((current) => current + 1);
            }}
          />
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
