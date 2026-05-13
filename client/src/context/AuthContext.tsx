// AuthContext - Client Authentication Context
// Cookie-based authentication context for the client application

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { loginApi, logoutApi, getProfileApi } from '@/modules/home/login/api/auth.api';
import type { UserProfile } from '@/modules/home/login/types/auth';
import { getRoleHomePath } from '@/modules/home/login/types/auth';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount and detect token changes
  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      try {
        // Check if we have an access token
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
          setIsLoading(false);
          return;
        }

        // Try to get user profile
        const profile = await getProfileApi();
        setUser(profile);
      } catch (error) {
        // If profile fetch fails, clear the invalid token
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for storage changes (triggered by login)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' && e.newValue) {
        // Token was set (login occurred)
        const fetchProfileAndRedirect = async () => {
          try {
            const profile = await getProfileApi();
            setUser(profile);

            // Navigate based on role
            const roleHomePath = getRoleHomePath(profile.role);
            navigate(roleHomePath);
          } catch (error) {
            console.error('Failed to fetch profile after login:', error);
          }
        };

        fetchProfileAndRedirect();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        setIsLoading(true);

        // Login API call - sets httpOnly cookies automatically
        const response = await loginApi({ email, password });

        // Store access token in localStorage for API client interceptor
        localStorage.setItem('accessToken', response.accessToken);

        // Get user profile
        const profile = await getProfileApi();
        setUser(profile);

        // Navigate based on role
        const roleHomePath = getRoleHomePath(profile.role);
        navigate(roleHomePath);
      } catch (error) {
        // Clear any existing tokens on failed login
        localStorage.removeItem('accessToken');
        setUser(null);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Call logout API to clear server-side cookies
      await logoutApi();
    } catch (error) {
      // Continue with local cleanup even if server logout fails
      console.error('Logout API failed:', error);
    } finally {
      // Clear local state
      localStorage.removeItem('accessToken');
      setUser(null);
      setIsLoading(false);

      // Navigate to login
      navigate('/login');
    }
  }, [navigate]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const profile = await getProfileApi();
      setUser(profile);
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within <AuthProvider>');
  }
  return ctx;
}

