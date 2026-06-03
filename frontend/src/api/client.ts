import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/config/api.config";
import { useAuthStore } from "@/store/auth.store";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // required for HTTP-only cookies
});

// ─── Request interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;

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
    const isLoginCall = originalRequest?.url?.includes("/auth/login");

    if (is401 && !alreadyRetried && !isRefreshCall && !isLoginCall) {
      originalRequest._retry = true;

      try {
        // Cookie is sent automatically (withCredentials: true)
        const { data } = await apiClient.post<{ accessToken: string }>("/auth/refresh");

        // Store new access token in memory
        useAuthStore.getState().setAccessToken(data.accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        const hadSession = !!useAuthStore.getState().accessToken;

        useAuthStore.getState().clearAuth();

        if (hadSession) {
          window.location.href = "/";
        }

        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
