import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getProfileApi,
  loginApi,
  logoutApi,
  refreshTokenApi,
  signUpApi,
} from '../api/auth.api';

export const useLogin = () => {
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      // Store access token in localStorage (short-lived)
      localStorage.setItem('accessToken', data.accessToken);
    },
  });
};

export const useSignUp = () => {
  return useMutation({
    mutationFn: signUpApi,
    onSuccess: (data) => {
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
