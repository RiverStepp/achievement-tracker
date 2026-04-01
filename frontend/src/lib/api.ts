import axios from "axios";
import { endpoints } from "@/lib/endpoints";
import type { AuthTokenResponse } from "@/types/auth";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL

export const api = axios.create({
  baseURL: API_BASE,
});

let currentToken: string | null = null;

export function setAuthToken(token: string | null) {
  currentToken = token;
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export function setupApiInterceptors(onUnauthorized: () => void) {
  let isRefreshing = false;
  let refreshPromise: Promise<string | null> | null = null;

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error.response?.status;
      const originalConfig = error.config as any;

      if (status !== 401 || !currentToken || originalConfig.__isRetryRequest) {
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            console.log("[auth] refreshing access token");
            const res = await api.post<AuthTokenResponse>(
              endpoints.auth.refresh,
              null,
              { withCredentials: true }
            );
            const newToken = res.data.token;
            console.log("[auth] refresh succeeded");
            setAuthToken(newToken);
            sessionStorage.setItem("authToken", newToken);
            isRefreshing = false;
            return newToken;
          } catch (e) {
            console.log("[auth] refresh failed");
            isRefreshing = false;
            onUnauthorized();
            return null;
          }
        })();
      }

      const newToken = await refreshPromise;
      if (!newToken) return Promise.reject(error);

      originalConfig.__isRetryRequest = true;
      originalConfig.headers = {
        ...originalConfig.headers,
        Authorization: `Bearer ${newToken}`,
      };

      return api.request(originalConfig);
    }
  );
}
