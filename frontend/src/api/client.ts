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
  withCredentials: true,
});

const pendingRequests = new Map<string, Promise<unknown>>();
const callLog = new Map<string, number[]>();

function getRequestKey(config: InternalAxiosRequestConfig): string {
  return `${config.method}:${config.url}:${JSON.stringify(config.params ?? {})}`;
}

function trackCall(endpoint: string): void {
  const now = Date.now();
  const calls = callLog.get(endpoint) ?? [];
  const recent = calls.filter(t => now - t < 5000);
  recent.push(now);
  callLog.set(endpoint, recent);

  if (recent.length > 3) {
    console.warn(`[API] ⚠️ Overfetch: ${endpoint} called ${recent.length}x in 5s`);
  }

  if (recent.length > 5 && process.env.NODE_ENV === 'development') {
    throw new Error(
      `[API] 🚨 Overfetch critical: ${endpoint} called ${recent.length}x in 5s. ` +
      `Fix caching or reduce polling.`
    );
  }
}

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === 'development') {
      const endpoint = `${config.method?.toUpperCase()} ${config.url}`;
      trackCall(endpoint);

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
        const { data } = await apiClient.post<{ accessToken: string }>("/auth/refresh");

        useAuthStore.getState().setAccessToken(data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        const hadSession = !!useAuthStore.getState().accessToken;

        useAuthStore.getState().clearAuth();

        if (hadSession) {
          // Replace so unauthenticated users never land on (or return to) a
          // protected page via the back button.
          window.location.replace("/login");
        }

        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
