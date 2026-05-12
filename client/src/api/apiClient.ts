// API Client - Axios instance with interceptors
// Centralized API error handling and request/response normalization

import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiUrl } from '../config/env';
import { createAppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { toast } from 'sonner';

interface ApiEnvelope<T = unknown> {
  success: boolean;
  data: T;
}

const isApiEnvelope = (data: unknown): data is ApiEnvelope => {
  return (
    !!data &&
    typeof data === 'object' &&
    'success' in data &&
    'data' in data
  );
};

const apiClient = axios.create({
  baseURL: apiUrl,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    logger.debug('API Request', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
    });

    return config;
  },
  (error) => {
    logger.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.debug('API Response', {
      status: response.status,
      url: response.config.url,
    });

    if (isApiEnvelope(response.data)) {
      response.data = response.data.data;
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    logger.error('API Error', error, {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
    });

    // Prevent infinite refresh loops
    const isRefreshing = originalRequest.url === '/auth/refresh';

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isRefreshing &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/auth/register'
    ) {
      originalRequest._retry = true;

      try {
        // For refresh, create a clean axios instance without Authorization header
        // but with credentials to include HTTP-only cookies
        const refreshClient = axios.create({
          baseURL: apiUrl,
          timeout: 30000,
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const refreshResponse = await refreshClient.post('/auth/refresh', {});

        const refreshData = isApiEnvelope(refreshResponse.data)
          ? refreshResponse.data.data
          : refreshResponse.data;

        if (refreshData.accessToken) {
          localStorage.setItem('accessToken', refreshData.accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${refreshData.accessToken}`;
          }

          return apiClient(originalRequest);
        } else {
          // Refresh succeeded but no token returned - clear session
          throw new Error('No access token returned from refresh');
        }
      } catch (refreshError) {
        logger.error('Token refresh failed', refreshError);

        // Clear any existing tokens and redirect to login
        localStorage.removeItem('accessToken');
        toast.error('Session expired. Please log in again.');

        // Use setTimeout to avoid redirect loop during current request
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);

        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      const appError = createAppError(error);
      toast.error(appError.userMessage, { className: 'toast-error' });
      return Promise.reject(error);
    }

    if (!error.response && (error.code === 'ECONNABORTED' || error.message === 'Network Error')) {
      const appError = createAppError(error);
      toast.error(appError.userMessage, { className: 'toast-error' });
      return Promise.reject(error);
    }

    const appError = createAppError(error);
    if (
      error.response?.status !== 400 &&
      error.response?.status !== 422 &&
      originalRequest?.url !== '/auth/login' &&
      originalRequest?.url !== '/auth/register'
    ) {
      toast.error(appError.userMessage, { className: 'toast-error' });
    }

    return Promise.reject(error);
  }
);

export default apiClient;

export const handleApiError = (error: unknown) => {
  const appError = createAppError(error);
  logger.error('API Error handled', error, {
    errorType: appError.type,
    userMessage: appError.userMessage,
  });
  return appError;
};
