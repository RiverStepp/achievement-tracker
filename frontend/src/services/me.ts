import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { MeResponse } from "@/types/auth";

export type SetSocialIdentityRequest = {
  handle: string;
  displayName: string;
};

export const meService = {
  get: async (): Promise<MeResponse> => {
    const response = await api.get<MeResponse>(endpoints.me.get);
    return response.data;
  },

  setSocialIdentity: async (
    request: SetSocialIdentityRequest
  ): Promise<void> => {
    await api.post(endpoints.me.socialIdentity, request);
  },
} as const;
