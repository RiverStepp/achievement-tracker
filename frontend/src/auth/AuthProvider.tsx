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
import { meService } from "@/services/me";
import {
  buildSteamProfileUrl,
  buildTemporaryUserProfile,
  loadStoredUserProfile,
  normalizeHandle,
  persistUserProfile,
  removeStoredUserProfile,
} from "@/profile/profileSetup";
import type {
  AuthTokenResponse,
  AuthStatus,
  MeResponse,
  SteamUser,
} from "@/types/auth";
import type { AppUser } from "@/types/models";
import type { UserProfile } from "@/types/profile";
import type { NewUserProfileDraft } from "@/profile/profileSetup";

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
  completeLoginFromCallback: (response: AuthTokenResponse) => Promise<void>;
  createUserProfile: (draft: NewUserProfileDraft) => Promise<string | null>;
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

  const completeLoginFromCallback = async (response: AuthTokenResponse) => {
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
    sessionStorage.setItem("authToken", response.token);
    setAuthToken(response.token);

    if (!response.steamId) {
      await loadSession();
      return;
    }

    const nextSteamUser: SteamUser = {
      steamId: response.steamId,
      profileUrl: buildSteamProfileUrl(response.steamId),
    };
    const storedProfile = loadStoredUserProfile(response.steamId);

    setSteamUser(nextSteamUser);
    setAppUser({
      id: 0,
      publicId: response.appUserPublicId,
    });
    setUserProfile(storedProfile);
    setNeedsProfileSetup(
      response.isNewUser ||
        !response.handle ||
        !response.displayName
    );
    setStatus("authenticated");

    console.log("[auth] auth completed", {
      steamId: response.steamId,
      isNewUser: response.isNewUser,
    });
  };

  const createUserProfile = async (draft: NewUserProfileDraft): Promise<string | null> => {
    if (!steamUser) return "Steam user is not available.";

    const normalizedHandle = normalizeHandle(draft.handle);
    if (!normalizedHandle) return "Handle is required.";

    try {
      await meService.setSocialIdentity({
        handle: `@${normalizedHandle}`,
        displayName: draft.displayName.trim(),
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Unable to save your profile details right now.";
      return message;
    }

    const { enrichedSteamUser, profile: nextProfile } =
      buildTemporaryUserProfile(appUser, steamUser, draft);
    const steamProfileUrl =
      enrichedSteamUser.profileUrl ?? buildSteamProfileUrl(steamUser.steamId);

    persistUserProfile(steamUser.steamId, nextProfile);
    setSteamUser(enrichedSteamUser);
    setUserProfile(nextProfile);
    setNeedsProfileSetup(false);
    console.log("[auth] temporary profile created", {
      steamId: steamUser.steamId,
      handle: nextProfile.handle,
      steamProfileUrl,
    });

    return null;
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
