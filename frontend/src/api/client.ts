import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/config/api.config";

// Extend config to track retry state
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor ──────────────────────────────────────────────────────
// Attaches Bearer token from localStorage on every outgoing request
apiClient.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────────────────
// On 401: attempt token refresh, retry original request once
// On refresh failure: clear auth state and redirect to /login
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
        const refreshResponse = await apiClient.post<{ token: string }>(
          "/auth/refresh"
        );
        const newToken = refreshResponse.data.token;

        if (typeof window !== "undefined") {
          localStorage.setItem("token", newToken);
        }

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — clear auth state and send user to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }

        // Small delay so any in-flight toasts can show before redirect
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);

        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;