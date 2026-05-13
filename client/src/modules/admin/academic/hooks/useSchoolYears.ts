// School Years Hook
// React Query hook for fetching school years with efficient caching

import { useQuery } from '@tanstack/react-query';
import { schoolYearApi } from '../../../../api/school-year.api';

// Query keys for cache management
export const schoolYearKeys = {
  all: ['school-years'] as const,
  allList: () => [...schoolYearKeys.all, 'list'] as const,
  active: () => [...schoolYearKeys.all, 'active'] as const,
  detail: (id: string) => [...schoolYearKeys.all, 'detail', id] as const,
};

// Hook for all school years
export const useSchoolYears = () => {
  return useQuery({
    queryKey: schoolYearKeys.allList(),
    queryFn: schoolYearApi.getAllSchoolYears,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Hook for active school year
export const useActiveSchoolYear = () => {
  return useQuery({
    queryKey: schoolYearKeys.active(),
    queryFn: schoolYearApi.getActiveSchoolYear,
    staleTime: 15 * 60 * 1000, // 15 minutes - changes less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry on 404 (no active school year)
      if ((error as any).response?.status === 404) return false;
      return failureCount < 3;
    },
  });
};

// Combined hook for school years with active year logic
export const useSchoolYearsWithActive = () => {
  const schoolYearsQuery = useSchoolYears();
  const activeSchoolYearQuery = useActiveSchoolYear();

  // Find active school year from the list if API call fails
  const activeSchoolYear = activeSchoolYearQuery.data ||
    schoolYearsQuery.data?.find(sy => sy.status === 'active') ||
    null;

  return {
    schoolYears: schoolYearsQuery.data || [],
    activeSchoolYear,
    isLoading: schoolYearsQuery.isLoading || activeSchoolYearQuery.isLoading,
    isError: schoolYearsQuery.isError || activeSchoolYearQuery.isError,
    error: schoolYearsQuery.error || activeSchoolYearQuery.error,
    refetch: () => {
      schoolYearsQuery.refetch();
      activeSchoolYearQuery.refetch();
    },
  };
};

// Hook for single school year
export const useSchoolYear = (id: string) => {
  return useQuery({
    queryKey: schoolYearKeys.detail(id),
    queryFn: () => schoolYearApi.getSchoolYearById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
