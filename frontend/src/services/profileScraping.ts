import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export const profileScrapingService = {
  queueCurrentUserUpdate: async (): Promise<void> => {
    await api.post(endpoints.profileScraping.update);
  },
} as const;
