import axios from "axios";
import { endpoints } from "@/lib/endpoints";
import type { AuthTokenResponse } from "@/types/auth";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL

export const api = axios.create({
  baseURL: API_BASE,
});

let currentToken: string | null = null;
let interceptorsInitialized = false;

function toAbsoluteUrl(url?: string) {
  if (!url) return API_BASE ?? "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE ?? ""}${url}`;
}

function sanitizeHeaders(headers: unknown) {
  if (!headers || typeof headers !== "object") return {};

  const entries = Object.entries(headers as Record<string, unknown>);
  return Object.fromEntries(
    entries.map(([key, value]) => {
      if (key.toLowerCase() === "authorization") {
        return [key, value ? "[redacted]" : value];
      }
      return [key, value];
    })
  );
}

export function setAuthToken(token: string | null) {
  currentToken = token;
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export function setupApiInterceptors(onUnauthorized: () => void) {
  if (interceptorsInitialized) {
    return;
  }

  interceptorsInitialized = true;
  let isRefreshing = false;
  let refreshPromise: Promise<string | null> | null = null;

  api.interceptors.request.use((config) => {
    const method = (config.method ?? "get").toUpperCase();
    const url = toAbsoluteUrl(config.url);

    console.log("[api] request", {
      method,
      url,
      params: config.params ?? null,
      data: config.data ?? null,
      withCredentials: config.withCredentials ?? false,
      hasAuthToken: Boolean(currentToken),
      headers: sanitizeHeaders(config.headers),
    });

    return config;
  });

  api.interceptors.response.use(
    (response) => {
      console.log("[api] response", {
        method: (response.config.method ?? "get").toUpperCase(),
        url: toAbsoluteUrl(response.config.url),
        status: response.status,
        data: response.data,
      });

      return response;
    },
    async (error) => {
      const status = error.response?.status;
      const originalConfig = error.config as any;

      console.log("[api] error", {
        method: (originalConfig?.method ?? "get").toUpperCase(),
        url: toAbsoluteUrl(originalConfig?.url),
        status: status ?? null,
        data: error.response?.data ?? null,
        message: error.message,
      });

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
