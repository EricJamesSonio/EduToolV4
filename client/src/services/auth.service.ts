// Authentication Service
// API calls for authentication using React Query and axios

import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from './apiClient';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
}

interface UserProfile {
  id: string;
  orgId: string | null;
  role: string;
  email: string;
  status: string;
  fullName: string | null;
  metadata: any;
  createdAt: string;
  personalEmail: string | null;
}

// Login API call
const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

// Refresh token API call
const refreshTokenApi = async (): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/refresh');
  return response.data;
};

// Logout API call
const logoutApi = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

// Get user profile API call
const getProfileApi = async (): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>('/auth/me');
  return response.data;
};


// React Query hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      // Store access token in localStorage (short-lived)
      localStorage.setItem('accessToken', data.accessToken);
    },
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: refreshTokenApi,
    onSuccess: (data) => {
      // Update access token in localStorage
      localStorage.setItem('accessToken', data.accessToken);
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      // Clear access token from localStorage
      localStorage.removeItem('accessToken');
    },
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfileApi,
    retry: false,
  });
};
