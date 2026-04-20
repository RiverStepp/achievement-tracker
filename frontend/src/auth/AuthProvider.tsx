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
  loadStoredUserProfile,
  normalizeHandle,
  persistUserProfile,
} from "@/profile/profileSetup";
import { profileService } from "@/services/profile";
import {
  mapUserSettingsToUserProfile,
  userSettingsService,
} from "@/services/userSettings";
import type {
  AuthTokenResponse,
  AuthStatus,
  MeResponse,
  SteamUser,
} from "@/types/auth";
import type { AppUser } from "@/types/models";
import type { UserProfile } from "@/types/profile";
import type { NewUserProfileDraft } from "@/profile/profileSetup";

const PENDING_PROFILE_SETUP_KEY = "pendingProfileSetup";

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
  refreshCurrentUserProfile: () => Promise<UserProfile | null>;
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

  const setPendingProfileSetup = (value: boolean) => {
    if (value) {
      sessionStorage.setItem(PENDING_PROFILE_SETUP_KEY, "1");
    } else {
      sessionStorage.removeItem(PENDING_PROFILE_SETUP_KEY);
    }
  };

  const hasPendingProfileSetup = () =>
    sessionStorage.getItem(PENDING_PROFILE_SETUP_KEY) === "1";

  const persistCurrentProfile = (steamId: string | null | undefined, profile: UserProfile | null) => {
    setUserProfile(profile);
    if (!steamId || !profile) {
      return;
    }

    persistUserProfile(steamId, profile);
  };

  const attachPublicIdToProfile = (
    profile: UserProfile | null,
    publicId?: string | null
  ): UserProfile | null => {
    if (!profile || !publicId) {
      return profile;
    }

    if (profile.user.publicId === publicId) {
      return profile;
    }

    return {
      ...profile,
      user: {
        ...profile.user,
        publicId,
      },
    };
  };

  const loadStoredAppUser = (): AppUser | null => {
    const publicId = sessionStorage.getItem("appUserPublicId");
    if (!publicId) {
      return null;
    }

    return {
      id: 0,
      publicId,
    };
  };

  const refreshCurrentUserProfile = async (): Promise<UserProfile | null> => {
    if (!steamUser) {
      return null;
    }

    let fallbackProfile = attachPublicIdToProfile(userProfile, appUser?.publicId);

    try {
      const settings = await userSettingsService.get();
      fallbackProfile = mapUserSettingsToUserProfile(settings, {
        appUser,
        steamUser,
        fallback: fallbackProfile,
      });
      const resolvedHandle = settings.handle ?? fallbackProfile?.handle ?? null;
      const resolvedDisplayName = settings.displayName ?? fallbackProfile?.displayName ?? null;
      const shouldRequireProfileSetup =
        hasPendingProfileSetup() || !resolvedHandle || !resolvedDisplayName;
      setNeedsProfileSetup(shouldRequireProfileSetup);
    } catch (error) {
      console.log("[auth] failed to load user settings during profile refresh", { error });
    }

    if (appUser?.publicId) {
      try {
        const freshProfile = await profileService.getProfile(
          appUser.publicId,
          undefined,
          fallbackProfile,
          {
            steamId: steamUser.steamId,
            isSelf: true,
          }
        );
        persistCurrentProfile(steamUser.steamId, freshProfile);
        return freshProfile;
      } catch (error) {
        console.log("[auth] failed to load current user profile", {
          publicId: appUser.publicId,
          error,
        });
      }
    }

    if (fallbackProfile) {
      persistCurrentProfile(steamUser.steamId, fallbackProfile);
      return fallbackProfile;
    }

    return null;
  };

  const loadSession = async (): Promise<MeResponse | null> => {
    try {
      console.log("[auth] loading session");
      const res = await api.get<MeResponse>(endpoints.me.get);
      console.log("[auth] /me response", {
        steamId: res.data.steamId,
        appUser: res.data.appUser ?? null,
        hasUserProfile: Boolean(res.data.userProfile),
        userProfilePublicId: res.data.userProfile?.user?.publicId ?? null,
        userProfileHandle: res.data.userProfile?.handle ?? null,
      });
      const nextSteamUser: SteamUser = {
        steamId: res.data.steamId,
        profileUrl: buildSteamProfileUrl(res.data.steamId),
      };
      const nextAppUser = res.data.appUser ?? loadStoredAppUser();
      setSteamUser(nextSteamUser);
      setAppUser(nextAppUser);

      let profile = res.data.userProfile ?? loadStoredUserProfile(res.data.steamId);
      profile = attachPublicIdToProfile(profile, nextAppUser?.publicId);
      console.log("[auth] resolved session profile source", {
        fromApi: Boolean(res.data.userProfile),
        fromLocalStorage: Boolean(!res.data.userProfile && profile),
        loadedProfilePublicId: profile?.user?.publicId ?? null,
        loadedProfileHandle: profile?.handle ?? null,
      });
      if (profile) {
        profile = {
          ...profile,
          steam: {
            ...nextSteamUser,
            ...profile.steam,
          },
        };
      }

      let settingsHandle: string | null = null;
      let settingsDisplayName: string | null = null;

      try {
        const settings = await userSettingsService.get();
        settingsHandle = settings.handle;
        settingsDisplayName = settings.displayName;
        profile = mapUserSettingsToUserProfile(settings, {
          appUser: nextAppUser,
          steamUser: nextSteamUser,
          fallback: profile,
        });
      } catch (error) {
        console.log("[auth] settings load during session failed", { error });
      }

      persistCurrentProfile(res.data.steamId, profile);
      const resolvedHandle = settingsHandle ?? profile?.handle ?? res.data.handle ?? null;
      const resolvedDisplayName = settingsDisplayName ?? profile?.displayName ?? null;
      const shouldRequireProfileSetup =
        hasPendingProfileSetup() || !resolvedHandle || !resolvedDisplayName;
      setNeedsProfileSetup(shouldRequireProfileSetup);
      setStatus("authenticated");
      console.log("[auth] session loaded", {
        appUserPublicId: nextAppUser?.publicId ?? null,
        stateProfilePublicId: profile?.user?.publicId ?? null,
        stateProfileHandle: profile?.handle ?? null,
      });

      if (nextAppUser?.publicId) {
        sessionStorage.setItem("appUserPublicId", nextAppUser.publicId);
      }

      if (nextAppUser?.publicId && settingsHandle && settingsDisplayName) {
        try {
          const freshProfile = await profileService.getProfile(
            nextAppUser.publicId,
            undefined,
            profile,
            {
              steamId: nextSteamUser.steamId,
              isSelf: true,
            }
          );
          persistCurrentProfile(res.data.steamId, freshProfile);
        } catch (error) {
          console.log("[auth] profile refresh after session load failed", { error });
        }
      }

      return res.data;
    } catch {
      console.log("[auth] session load failed");
      setAppUser(null);
      setSteamUser(null);
      setUserProfile(null);
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("appUserPublicId");
      sessionStorage.removeItem(PENDING_PROFILE_SETUP_KEY);
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
      sessionStorage.removeItem("appUserPublicId");
      sessionStorage.removeItem(PENDING_PROFILE_SETUP_KEY);
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
    console.log("[auth] starting Steam login", {
      loginUrl,
      apiBaseUrl: api.defaults.baseURL,
      endpoint: authService.getSteamLoginUrl(),
    });
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

    console.log("[auth] completing login from callback", {
      steamId: response.steamId,
      appUserPublicId: response.appUserPublicId,
      handle: response.handle ?? null,
      displayName: response.displayName ?? null,
      isNewUser: response.isNewUser,
    });
    setStatus("loading");
    sessionStorage.setItem("authToken", response.token);
    setAuthToken(response.token);
    sessionStorage.setItem("appUserPublicId", response.appUserPublicId);

    if (!response.steamId) {
      await loadSession();
      return;
    }

    const nextSteamUser: SteamUser = {
      steamId: response.steamId,
      profileUrl: buildSteamProfileUrl(response.steamId),
    };
    const storedProfile = attachPublicIdToProfile(
      loadStoredUserProfile(response.steamId),
      response.appUserPublicId
    );
    console.log("[auth] callback stored profile lookup", {
      steamId: response.steamId,
      foundStoredProfile: Boolean(storedProfile),
      storedProfilePublicId: storedProfile?.user?.publicId ?? null,
      storedProfileHandle: storedProfile?.handle ?? null,
    });

    setSteamUser(nextSteamUser);
    const nextAppUser = {
      id: 0,
      publicId: response.appUserPublicId,
    };
    setAppUser(nextAppUser);
    persistCurrentProfile(response.steamId, storedProfile);
    const resolvedHandle = response.handle ?? storedProfile?.handle ?? null;
    const resolvedDisplayName = response.displayName ?? storedProfile?.displayName ?? null;
    const shouldRequireProfileSetup =
      response.isNewUser || !resolvedHandle || !resolvedDisplayName;
    setPendingProfileSetup(shouldRequireProfileSetup);
    setNeedsProfileSetup(shouldRequireProfileSetup);
    setStatus("authenticated");

    console.log("[auth] auth completed", {
      steamId: response.steamId,
      isNewUser: response.isNewUser,
      appUserPublicId: response.appUserPublicId,
      stateAppUserPublicId: response.appUserPublicId,
      stateProfilePublicId: storedProfile?.user?.publicId ?? null,
      stateProfileHandle: storedProfile?.handle ?? null,
    });

    if (!response.isNewUser && response.handle && response.displayName) {
      try {
        const settings = await userSettingsService.get();
        const baseProfile = mapUserSettingsToUserProfile(settings, {
          appUser: nextAppUser,
          steamUser: nextSteamUser,
          fallback: storedProfile,
        });
        persistCurrentProfile(response.steamId, baseProfile);

        const freshProfile = await profileService.getProfile(
          response.appUserPublicId,
          undefined,
          baseProfile,
          {
            steamId: response.steamId,
            isSelf: true,
          }
        );
        persistCurrentProfile(response.steamId, freshProfile);
      } catch (error) {
        console.log("[auth] callback profile hydration failed", { error });
      }
    }
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

    const hasSettingsPayload =
      Boolean(draft.bio.trim()) ||
      draft.countryId !== null ||
      draft.stateRegionId !== null ||
      draft.cityId !== null ||
      draft.ianaTimeZoneId !== null ||
      draft.pronounOptionId !== null ||
      draft.socials.some((item) => item.linkValue.trim().length > 0);

    if (hasSettingsPayload) {
      try {
        await userSettingsService.update({
          bio: draft.bio.trim() || null,
          location:
            draft.countryId !== null || draft.stateRegionId !== null || draft.cityId !== null
              ? {
                  countryId: draft.countryId,
                  stateRegionId: draft.stateRegionId,
                  cityId: draft.cityId,
                }
              : null,
          unsetLocation:
            draft.countryId === null &&
            draft.stateRegionId === null &&
            draft.cityId === null,
          ianaTimeZoneId: draft.ianaTimeZoneId,
          unsetTimeZone: draft.ianaTimeZoneId === null,
          pronounOptionId: draft.pronounOptionId,
          unsetPronouns: draft.pronounOptionId === null,
          socialLinks: draft.socials
            .map((item) => ({
              platform: item.platform,
              linkValue: item.linkValue.trim() || null,
              isVisible: item.isVisible && item.linkValue.trim().length > 0,
            }))
            .filter((item) => Boolean(item.linkValue)),
        });
      } catch (error: any) {
        const message =
          error?.response?.data?.error ||
          error?.message ||
          "Unable to save your profile details right now.";
        return message;
      }
    }

    if (draft.profileImageFile || draft.bannerImageFile) {
      try {
        await userSettingsService.updateMedia({
          profileImage: draft.profileImageFile,
          bannerImage: draft.bannerImageFile,
        });
      } catch (error: any) {
        const message =
          error?.response?.data?.error ||
          error?.message ||
          "Unable to save your profile details right now.";
        return message;
      }
    }

    setPendingProfileSetup(false);
    setNeedsProfileSetup(false);
    const nextProfile = await refreshCurrentUserProfile();
    console.log("[auth] profile created through backend", {
      steamId: steamUser.steamId,
      publicId: nextProfile?.user.publicId ?? appUser?.publicId ?? null,
      handle: nextProfile?.handle ?? normalizedHandle,
    });

    return null;
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
      sessionStorage.removeItem("appUserPublicId");
      sessionStorage.removeItem(PENDING_PROFILE_SETUP_KEY);
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
      refreshCurrentUserProfile,
    }),
    [
      appUser,
      steamUser,
      status,
      isLoading,
      isAuthenticated,
      needsProfileSetup,
      userProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
