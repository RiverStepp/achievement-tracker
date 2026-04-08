import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { UserProfile } from "@/types/profile";

export type GetUserProfileRequest = {
  // Fill in fields from backend GetUserProfileRequest when needed.
};

export const profileService = {
  getProfile: async (
    publicId: string,
    request?: GetUserProfileRequest
  ): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(
      endpoints.userProfiles.getProfile(publicId),
      {
        params: request,
      }
    );

    return response.data;
  },
} as const;
