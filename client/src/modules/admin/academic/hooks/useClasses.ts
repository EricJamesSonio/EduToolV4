import { useQuery } from '@tanstack/react-query';
import { classApi } from '../api/class.api';
import type { ClassQueryParams } from '../api/class.api';

export const classKeys = {
  all: ['classes'] as const,
  lists: () => [...classKeys.all, 'list'] as const,
  list: (filters: ClassQueryParams) => [...classKeys.lists(), filters] as const,
  bySection: (schoolYearId: string, sectionId: string) =>
    [...classKeys.lists(), { schoolYearId, sectionId }] as const,
};

export const useClasses = (params: ClassQueryParams = {}) => {
  return useQuery({
    queryKey: classKeys.list(params),
    queryFn: () => classApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useClassesBySection = (schoolYearId: string, sectionId: string) => {
  return useQuery({
    queryKey: classKeys.bySection(schoolYearId, sectionId),
    queryFn: () => classApi.getAll({ schoolYearId, sectionId }),
    enabled: !!(schoolYearId && sectionId),
    staleTime: 5 * 60 * 1000,
  });
};
