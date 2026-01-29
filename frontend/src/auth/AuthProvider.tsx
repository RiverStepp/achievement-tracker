// src/auth/AuthProvider.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setAuthToken, setupApiInterceptors } from "@/lib/api";
import type { AuthUser } from "@/types/auth";
import { mockProfile } from "@/data/mockUser";

const USE_MOCK_AUTH = import.meta.env.DEV;

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithSteam: () => void;
  logout: () => Promise<void>;
  completeLoginFromCallback: (token: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMe = async () => {
    try {
      const res = await api.get<AuthUser>("/me");
      setUser(res.data);
    } catch {
      setUser(null);
      sessionStorage.removeItem("authToken");
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setupApiInterceptors(() => {
      setUser(null);
      sessionStorage.removeItem("authToken");
      setAuthToken(null);
    });

    //Testing with mock user
    if (USE_MOCK_AUTH) {
      const mockLoggedIn = sessionStorage.getItem("mockAuth") === "1";
      if (mockLoggedIn) {
        setUser(mockProfile.user);
        console.log("Saved session for mock user:", mockProfile.user);
      }
      setIsLoading(false);
      console.log("Using mock auth.");
      return;
    }

    const storedToken = sessionStorage.getItem("authToken");
    if (storedToken) {
      setAuthToken(storedToken);
      void loadMe();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loginWithSteam = () => {
    if (USE_MOCK_AUTH) {
      //just pretend we're logged in
      setUser(mockProfile.user);
      sessionStorage.setItem("mockAuth", "1");
      setIsLoading(false);
      console.log("Using mock auth login for user:", mockProfile.user);
      return;
    }
    window.location.href = `${api.defaults.baseURL}/auth/steam/login`;
  };

  const completeLoginFromCallback = async (token: string) => {

    if (USE_MOCK_AUTH) {
      setUser(mockProfile.user);
      sessionStorage.setItem("mockAuth", "1");
      setIsLoading(false);
      return;
    }


    setIsLoading(true);
    sessionStorage.setItem("authToken", token);
    setAuthToken(token);
    await loadMe();
  };


  const logout = async () => {
    if (USE_MOCK_AUTH) {
      setUser(null);
      sessionStorage.removeItem("mockAuth");
      return;
    }

    try {
      await api.post("/auth/logout", null, { withCredentials: true });
    } finally {
      setUser(null);
      sessionStorage.removeItem("authToken");
      setAuthToken(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      loginWithSteam,
      logout,
      completeLoginFromCallback,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
