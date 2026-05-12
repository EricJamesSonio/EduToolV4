// API Client - Axios instance with interceptors
// Centralized API error handling and request/response normalization

import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiUrl } from '../config/env';
import { createAppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { toast } from 'sonner';

// Create axios instance
const apiClient = axios.create({
  baseURL: apiUrl,
  timeout: 30000, // 30 seconds
  withCredentials: true, // Important: include cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
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

// Response interceptor - Handle errors and normalize responses
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.debug('API Response', {
      status: response.status,
      url: response.config.url,
    });

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Log the error
    logger.error('API Error', error, {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
    });

    // Handle 401 Unauthorized - Token refresh logic (only for authenticated requests, not login)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/login' && // Don't refresh on login failure
      originalRequest.url !== '/auth/refresh' // Don't refresh on refresh failure
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refreshResponse = await axios.post(
          `${apiUrl}/auth/refresh`,
          {},
          {
            withCredentials: true,
          }
        );

        if (refreshResponse.data.accessToken) {
          // Update access token
          localStorage.setItem('accessToken', refreshResponse.data.accessToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          }

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        logger.error('Token refresh failed', refreshError);
        localStorage.removeItem('accessToken');

        // Show toast message
        toast.error('Session expired. Please log in again.');

        // Redirect to login (will be handled by auth guard)
        window.location.href = '/login';

        return Promise.reject(error);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      const appError = createAppError(error);
      toast.error(appError.userMessage, {
        className: 'toast-error',
      });
      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response && error.code === 'ECONNABORTED') {
      const appError = createAppError(error);
      toast.error(appError.userMessage, {
        className: 'toast-error',
      });
      return Promise.reject(error);
    }

    if (!error.response && error.message === 'Network Error') {
      const appError = createAppError(error);
      toast.error(appError.userMessage, {
        className: 'toast-error',
      });
      return Promise.reject(error);
    }

    // Handle other errors
    const appError = createAppError(error);

    // Don't show toast for validation errors (they should be handled inline)
    // Don't show toast for login errors (handled by mutation)
    if (error.response?.status !== 400 &&
      error.response?.status !== 422 &&
      originalRequest?.url !== '/auth/login') {
      toast.error(appError.userMessage, {
        className: 'toast-error',
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Helper function to handle API errors in components
export const handleApiError = (error: any) => {
  const appError = createAppError(error);
  logger.error('API Error handled', error, {
    errorType: appError.type,
    userMessage: appError.userMessage,
  });
  return appError;
};
