// Dashboard Data Hook
// React Query hook for fetching dashboard data with efficient caching

import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/query/globalQueryClient';
import { dashboardApi } from '../api/dashboard.api';

// Query keys for cache management
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  academicContext: () => [...dashboardKeys.all, 'academic-context'] as const,
  alerts: () => [...dashboardKeys.all, 'alerts'] as const,
};

// Hook for dashboard statistics
export const useDashboardStats = () => {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: dashboardApi.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Hook for academic context
export const useAcademicContext = () => {
  return useQuery({
    queryKey: dashboardKeys.academicContext(),
    queryFn: dashboardApi.getAcademicContext,
    staleTime: 15 * 60 * 1000, // 15 minutes - changes less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Hook for alerts
export const useDashboardAlerts = () => {
  return useQuery({
    queryKey: dashboardKeys.alerts(),
    queryFn: dashboardApi.getAlerts,
    staleTime: 2 * 60 * 1000, // 2 minutes - alerts may change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Combined hook for all dashboard data
export const useDashboardData = () => {
  const statsQuery = useDashboardStats();
  const academicContextQuery = useAcademicContext();
  const alertsQuery = useDashboardAlerts();

  return {
    stats: statsQuery.data,
    academicContext: academicContextQuery.data,
    alerts: alertsQuery.data,
    isLoading: statsQuery.isLoading || academicContextQuery.isLoading || alertsQuery.isLoading,
    isError: statsQuery.isError || academicContextQuery.isError || alertsQuery.isError,
    error: statsQuery.error || academicContextQuery.error || alertsQuery.error,
    refetch: () => {
      statsQuery.refetch();
      academicContextQuery.refetch();
      alertsQuery.refetch();
    },
  };
};

// Prefetch function for optimistic loading
export const prefetchDashboardData = () => {
  queryClient.prefetchQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: dashboardApi.getStats,
    staleTime: 5 * 60 * 1000,
  });

  queryClient.prefetchQuery({
    queryKey: dashboardKeys.academicContext(),
    queryFn: dashboardApi.getAcademicContext,
    staleTime: 15 * 60 * 1000,
  });

  queryClient.prefetchQuery({
    queryKey: dashboardKeys.alerts(),
    queryFn: dashboardApi.getAlerts,
    staleTime: 2 * 60 * 1000,
  });
};
