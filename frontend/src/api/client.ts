import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/config/api.config";
import { useAuthStore } from "@/store/auth.store";
// Perf Phase 7: single overfetch tracker (was: duplicated locally here while
// utils/detect-overfetch.ts sat unwired with zero callers).
import { trackApiCall } from "@/utils/detect-overfetch";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  // Perf Phase 7: fail a hung backend after 30s instead of hanging the UI
  // forever. Per-request override: apiClient.get(url, { timeout: 120000 }).
  timeout: 30000,
});

const pendingRequests = new Map<string, Promise<unknown>>();

function getRequestKey(config: InternalAxiosRequestConfig): string {
  return `${config.method}:${config.url}:${JSON.stringify(config.params ?? {})}`;
}

// ── Session handling ─────────────────────────────────────────────────────────

let refreshPromise: Promise<string> | null = null;

/** Single-flight: concurrent callers share one /auth/refresh request. */
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<{ accessToken: string }>("/auth/refresh")
      .then(({ data }) => {
        useAuthStore.getState().setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const PROTECTED_PREFIXES = ["/admin", "/educator", "/student", "/platform"];

/** Clear the session and leave protected pages. Public pages stay put. */
export function forceLogout(): void {
  useAuthStore.getState().clearAuth();
  if (typeof window === "undefined") return;
  const onProtectedPage = PROTECTED_PREFIXES.some((p) =>
    window.location.pathname.startsWith(p),
  );
  // Replace so unauthenticated users never land on (or return to) a
  // protected page via the back button.
  if (onProtectedPage) window.location.replace("/login?expired=1");
}

// ── Interceptors ─────────────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      const endpoint = `${config.method?.toUpperCase()} ${config.url}`;
      trackApiCall(endpoint);

      const key = getRequestKey(config);
      const existing = pendingRequests.get(key);
      if (existing) {
        console.log(`[API] ${endpoint} → DEDUPED`);
        return existing as unknown as InternalAxiosRequestConfig;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      const config = response.config;
      const key = getRequestKey(config as InternalAxiosRequestConfig);
      pendingRequests.delete(key);
    }
    return response;
  },

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig;

    if (process.env.NODE_ENV === 'development' && originalRequest) {
      const key = getRequestKey(originalRequest);
      pendingRequests.delete(key);
    }

    const is401 = error.response?.status === 401;
    const alreadyRetried = originalRequest?._retry;
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");
    const isLoginCall = originalRequest?.url?.includes("/auth/login");

    if (is401 && !alreadyRetried && !isRefreshCall && !isLoginCall) {
      originalRequest._retry = true;

      try {
        const token = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch {
        forceLogout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;