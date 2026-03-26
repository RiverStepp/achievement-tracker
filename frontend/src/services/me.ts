import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { MeResponse } from "@/types/auth";

export const meService = {
  get: async (): Promise<MeResponse> => {
    const response = await api.get<MeResponse>(endpoints.me.get);
    return response.data;
  },
} as const;
