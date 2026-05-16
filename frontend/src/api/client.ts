import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/config/api.config";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("edutool-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("edutool-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.refreshToken ?? null;
  } catch {
    return null;
  }
}

function saveTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("edutool-auth");
    const existing = raw ? JSON.parse(raw) : { state: {} };
    existing.state.accessToken = accessToken;
    existing.state.refreshToken = refreshToken;
    localStorage.setItem("edutool-auth", JSON.stringify(existing));
  } catch {
    // ignore localStorage errors (e.g. private browsing quota)
  }
}

function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("edutool-auth");
}
export { getAccessToken, getRefreshToken, saveTokens, clearTokens };

// ─── Request interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig;

    const is401 = error.response?.status === 401;
    const alreadyRetried = originalRequest?._retry;
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");

    if (is401 && !alreadyRetried && !isRefreshCall) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await apiClient.post<{
          accessToken: string;
          refreshToken: string;
        }>("/auth/refresh", { refreshToken });

        saveTokens(data.accessToken, data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        clearTokens();
        setTimeout(() => {
          window.location.href = "/";
        }, 100);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;