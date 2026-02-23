import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { UserProfile } from "@/types/profile";
import { useAuth } from "@/auth/AuthProvider";
import { ProfileBanner } from "@/components/profile/ProfileBanner";
import { mockUserProfile } from "@/data/mockUser";
import { AboutPanel } from "@/components/profile/AboutPanel";
import { LatestAcheivements } from "@/components/profile/LatestAcheivements";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

export function ProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { userProfile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const USE_MOCK_PROFILE = import.meta.env.DEV;

  useEffect(() => {
    if (!handle) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // dev: use mock profile only when the handle matches
    if (
      USE_MOCK_PROFILE &&
      handle.toLowerCase() === mockUserProfile.handle.toLowerCase()
    ) {
      setProfile(mockUserProfile);
      setLoading(false);
      return;
    }

    setLoading(true);

    api
      .get<UserProfile>(`/api/users/by-handle/${handle}`)
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [handle, USE_MOCK_PROFILE]);

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>Profile not found.</div>;

  // isMe = logged-in user handle matches the route handle
  let isMe =
    !!currentUserProfile &&
    !!handle &&
    currentUserProfile.handle.toLowerCase() === handle.toLowerCase();
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
          <LatestAcheivements profile={profile} />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
