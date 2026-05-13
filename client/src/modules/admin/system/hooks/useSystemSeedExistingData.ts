import { useQuery } from '@tanstack/react-query';
import { systemSeedApi } from '../api/system-seed.api';

export const systemSeedKeys = {
  all: ['system-seed'] as const,
  existing: (schoolYearId: string) => [...systemSeedKeys.all, 'existing', schoolYearId] as const,
};

export const useSystemSeedExistingData = (schoolYearId: string) => {
  return useQuery({
    queryKey: systemSeedKeys.existing(schoolYearId),
    queryFn: () => systemSeedApi.getExistingData(schoolYearId),
    enabled: !!schoolYearId,
    staleTime: 2 * 60 * 1000,
  });
};
