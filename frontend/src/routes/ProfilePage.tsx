import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { UserProfile } from "@/types/profile";
import { useAuth } from "@/auth/AuthProvider";

import { mockUserProfile } from "@/data/mockUser";

export function ProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { user: authUser } = useAuth();
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
      handle.toLowerCase() === mockUserProfile.user.handle.toLowerCase()
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

  if (loading) return <div>Loading…</div>;
  if (!profile) return <div>Profile not found.</div>;

  // 🔹 isMe = logged-in user's handle matches the route handle
  const isMe =
    !!authUser &&
    !!handle &&
    authUser.handle.toLowerCase() === handle.toLowerCase();
  if (isMe) {
    console.log("Viewing own profile:", authUser);
  }
  return (
    <div>
      
    </div>
  );  
}

export default ProfilePage;