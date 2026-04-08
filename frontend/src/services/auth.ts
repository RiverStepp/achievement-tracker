import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { AuthTokenResponse } from "@/types/auth";

export type SteamCallbackRequest = {
  // Fill in callback query params if the frontend needs to call this directly.
};

export const authService = {
  getSteamLoginUrl: (): string => endpoints.auth.steamLogin,

  steamCallback: async (
    request?: SteamCallbackRequest
  ): Promise<AuthTokenResponse> => {
    const response = await api.get<AuthTokenResponse>(
      endpoints.auth.steamCallback,
      {
        params: request,
      }
    );

    return response.data;
  },

  refresh: async (): Promise<AuthTokenResponse> => {
    const response = await api.post<AuthTokenResponse>(
      endpoints.auth.refresh,
      null,
      {
        withCredentials: true,
      }
    );

    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post(endpoints.auth.logout, null, {
      withCredentials: true,
    });
  },
} as const;
