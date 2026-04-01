// src/auth/AuthProvider.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setAuthToken, setupApiInterceptors } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { authService } from "@/services/auth";
import type {
  AuthStatus,
  MeResponse,
  SteamUser,
} from "@/types/auth";
import type { AppUser } from "@/types/models";
import type { UserProfile } from "@/types/profile";

type NewUserProfileDraft = {
  displayName: string;
  handle: string;
  bio: string;
  location: string;
  timezone: string;
  pronouns: string;
  avatarUrl: string;
  bannerUrl: string;
};

const PROFILE_STORAGE_KEY_PREFIX = "tempUserProfile:";

const getProfileStorageKey = (steamId: string) =>
  `${PROFILE_STORAGE_KEY_PREFIX}${steamId}`;

const buildSteamProfileUrl = (steamId: string) =>
  `https://steamcommunity.com/profiles/${steamId}`;

const normalizeHandle = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");

const loadStoredUserProfile = (steamId: string): UserProfile | null => {
  try {
    const raw = localStorage.getItem(getProfileStorageKey(steamId));
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
};

const persistUserProfile = (steamId: string, profile: UserProfile) => {
  localStorage.setItem(getProfileStorageKey(steamId), JSON.stringify(profile));
};

const removeStoredUserProfile = (steamId: string) => {
  localStorage.removeItem(getProfileStorageKey(steamId));
};

type AuthContextValue = {
  appUser: AppUser | null;
  steamUser: SteamUser | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsProfileSetup: boolean;
  loginWithSteam: () => void;
  logout: () => Promise<void>;
  userProfile: UserProfile | null;
  completeLoginFromCallback: (token: string) => Promise<void>;
  createUserProfile: (draft: NewUserProfileDraft) => void;
  deleteUserProfile: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [steamUser, setSteamUser] = useState<SteamUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const loadSession = async (): Promise<MeResponse | null> => {
    try {
      console.log("[auth] loading session");
      const res = await api.get<MeResponse>(endpoints.me.get);
      const nextSteamUser: SteamUser = {
        steamId: res.data.steamId,
        profileUrl: buildSteamProfileUrl(res.data.steamId),
      };
      setSteamUser(nextSteamUser);
      setAppUser(res.data.appUser ?? null);

      let profile = res.data.userProfile ?? loadStoredUserProfile(res.data.steamId);
      if (profile) {
        profile = {
          ...profile,
          steam: {
            ...nextSteamUser,
            ...profile.steam,
          },
        };
      }

      setUserProfile(profile);
      setNeedsProfileSetup(!profile);
      setStatus("authenticated");
      console.log("[auth] session loaded");
      return res.data;
    } catch {
      console.log("[auth] session load failed");
      setAppUser(null);
      setSteamUser(null);
      setUserProfile(null);
      sessionStorage.removeItem("authToken");
      setAuthToken(null);
      setNeedsProfileSetup(false);
      setStatus("guest");
      return null;
    }
  };

  useEffect(() => {
    setupApiInterceptors(() => {
      setAppUser(null);
      setSteamUser(null);
      setUserProfile(null);
      sessionStorage.removeItem("authToken");
      setAuthToken(null);
      setStatus("guest");
    });

    // Testing with mock user.
    // if (USE_MOCK_AUTH) {
    //   const mockLoggedIn = sessionStorage.getItem("mockAuth") === "1";
    //   if (mockLoggedIn) {
    //     setAppUser(mockAppUserBrandonW);
    //     setSteamUser(mockSteamUser);
    //     setUserProfile(mockUserProfile);
    //     setStatus("authenticated");
    //   }
    //   if (!mockLoggedIn) {
    //     setStatus("guest");
    //   }
    //   return;
    // }

    const storedToken = sessionStorage.getItem("authToken");
    if (storedToken) {
      setAuthToken(storedToken);
      void loadSession();
    } else {
      setStatus("guest");
    }
  }, []);

  const loginWithSteam = () => {
    // if (USE_MOCK_AUTH) {
    //   // Just pretend we're logged in.
    //   setAppUser(mockAppUserBrandonW);
    //   setSteamUser(mockSteamUser);
    //   setUserProfile(mockUserProfile);
    //   setStatus("authenticated");
    //   sessionStorage.setItem("mockAuth", "1");
    //   return;
    // }
    const loginUrl = `${api.defaults.baseURL}${authService.getSteamLoginUrl()}`;
    console.log("[auth] starting Steam login", loginUrl);
    window.location.href = loginUrl;
  };

  const completeLoginFromCallback = async (token: string) => {
    // if (USE_MOCK_AUTH) {
    //   setAppUser(mockAppUserBrandonW);
    //   setSteamUser(mockSteamUser);
    //   setUserProfile(mockUserProfile);
    //   setStatus("authenticated");
    //   sessionStorage.setItem("mockAuth", "1");
    //   return;
    // }

    console.log("[auth] completing login from callback");
    setStatus("loading");
    sessionStorage.setItem("authToken", token);
    setAuthToken(token);
    const session = await loadSession();
    console.log("[auth] auth completed", {
      token,
      steamId: session?.steamId ?? null,
    });
  };

  const createUserProfile = (draft: NewUserProfileDraft) => {
    if (!steamUser) return;

    const normalizedHandle = normalizeHandle(draft.handle);
    if (!normalizedHandle) return;

    const steamProfileUrl = steamUser.profileUrl ?? buildSteamProfileUrl(steamUser.steamId);
    const enrichedSteamUser: SteamUser = {
      ...steamUser,
      personaName: steamUser.personaName ?? draft.displayName.trim(),
      profileUrl: steamProfileUrl,
    };
    const nextProfile: UserProfile = {
      user: appUser ?? {
        id: 0,
        roles: ["User"],
      },
      steam: enrichedSteamUser,
      displayName: draft.displayName.trim(),
      handle: normalizedHandle,
      avatarUrl: draft.avatarUrl.trim() || steamUser.avatarFullUrl || steamUser.avatarMediumUrl || null,
      bannerUrl: draft.bannerUrl.trim() || null,
      bio: draft.bio.trim() || null,
      location: draft.location.trim() || null,
      timezone: draft.timezone.trim() || null,
      pronouns: draft.pronouns.trim() || null,
      joinedAt: new Date().toISOString(),
      connections: {
        platforms: ["steam"],
        linkedAccounts: [
          {
            platform: "steam",
            usernameOrId: enrichedSteamUser.personaName || steamUser.steamId,
            profileUrl: steamProfileUrl,
            accountVerified: true,
          },
        ],
        socials: [],
      },
      summary: {
        totalAchievements: 0,
        gamesTracked: 0,
        hoursPlayed: 0,
      },
      achievements: [],
      feed: {
        items: [],
        comments: [],
      },
      privacy: {
        showStats: true,
        showRecentAchievements: true,
        showLinkedAccounts: true,
        showSocialLinks: true,
        showFeed: true,
      },
      viewer: {
        isSelf: true,
      },
    };

    persistUserProfile(steamUser.steamId, nextProfile);
    setSteamUser(enrichedSteamUser);
    setUserProfile(nextProfile);
    setNeedsProfileSetup(false);
    console.log("[auth] temporary profile created", {
      steamId: steamUser.steamId,
      handle: nextProfile.handle,
      steamProfileUrl,
    });
  };

  const deleteUserProfile = async () => {
    if (!steamUser) return;

    removeStoredUserProfile(steamUser.steamId);
    console.log("[auth] temporary profile deleted", {
      steamId: steamUser.steamId,
    });
    await logout();
  };

  const logout = async () => {
    // if (USE_MOCK_AUTH) {
    //   setAppUser(null);
    //   setSteamUser(null);
    //   setUserProfile(null);
    //   setStatus("guest");
    //   sessionStorage.removeItem("mockAuth");
    //   return;
    // }

    try {
      console.log("[auth] logging out");
      await authService.logout();
    } finally {
      setAppUser(null);
      setSteamUser(null);
      setUserProfile(null);
      setStatus("guest");
      sessionStorage.removeItem("authToken");
      setAuthToken(null);
      setNeedsProfileSetup(false);
      console.log("[auth] logout complete");
    }
  };

  const value = useMemo(
    () => ({
      appUser,
      steamUser,
      status,
      isLoading,
      isAuthenticated,
      needsProfileSetup,
      userProfile,
      loginWithSteam,
      logout,
      completeLoginFromCallback,
      createUserProfile,
      deleteUserProfile,
    }),
    [appUser, steamUser, status, isLoading, isAuthenticated, needsProfileSetup, userProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
