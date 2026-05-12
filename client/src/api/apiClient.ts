// API Client - Axios instance with interceptors
// Centralized API error handling and request/response normalization

import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiUrl } from '../config/env';
import { createAppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { toast } from 'sonner';

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

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    logger.error('API Error', error, {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
    });

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/auth/refresh' &&
      originalRequest.url !== '/auth/register'
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${apiUrl}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (refreshResponse.data.accessToken) {
          localStorage.setItem('accessToken', refreshResponse.data.accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          }

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        logger.error('Token refresh failed', refreshError);
        localStorage.removeItem('accessToken');
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
        return Promise.reject(error);
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
