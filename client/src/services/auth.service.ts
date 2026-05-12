// Authentication Service
// API calls for authentication using React Query

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiUrl } from '../config/env';

const API_BASE_URL = apiUrl;

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
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: include cookies
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
};

// Refresh token API call
const refreshTokenApi = async (): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: include cookies
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return response.json();
};

// Logout API call
const logoutApi = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include', // Important: include cookies
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }
};

// Get user profile API call
const getProfileApi = async (): Promise<UserProfile> => {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include', // Important: include cookies
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
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
