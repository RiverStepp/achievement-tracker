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
import {
  mockAppUserBrandonW,
  mockSteamUser,
  mockUserProfile,
} from "@/data/mockUser";
import type { UserProfile } from "@/types/profile";

// const USE_MOCK_AUTH = import.meta.env.DEV;

type AuthContextValue = {
  appUser: AppUser | null;
  steamUser: SteamUser | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithSteam: () => void;
  logout: () => Promise<void>;
  userProfile: UserProfile | null;
  completeLoginFromCallback: (token: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [steamUser, setSteamUser] = useState<SteamUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const loadSession = async (): Promise<MeResponse | null> => {
    try {
      console.log("[auth] loading session");
      const res = await api.get<MeResponse>(endpoints.me.get);
      setSteamUser({ steamId: res.data.steamId });
      setAppUser(res.data.appUser ?? null);

      let profile = res.data.userProfile ?? null;

      if (!profile) {
        try {
          const profileRes = await api.get<UserProfile>("/api/users/me/profile");
          profile = profileRes.data;
        } catch {
          const handle = res.data.handle;
          if (handle) {
            try {
              const byHandleRes = await api.get<UserProfile>(`/api/users/by-handle/${handle}`);
              profile = byHandleRes.data;
            } catch {
              profile = null;
            }
          }
        }
      }

      setUserProfile(profile);
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
      userProfile,
      loginWithSteam,
      logout,
      completeLoginFromCallback,
    }),
    [appUser, steamUser, status, isLoading, isAuthenticated, userProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
