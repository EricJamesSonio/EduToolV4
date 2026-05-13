import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationApi } from '../api/organization.api';
import type {
  CreateOrganizationDto,
  SeedOrganizationDto,
  UpdateOrganizationDto,
} from '../types/organization.types';

export const organizationKeys = {
  all: ['organization'] as const,
  own: () => [...organizationKeys.all, 'own'] as const,
};

export const useOrganization = () => {
  return useQuery({
    queryKey: organizationKeys.own(),
    queryFn: organizationApi.getOwn,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationDto) => organizationApi.create(data),
    onSuccess: (organization) => {
      queryClient.setQueryData(organizationKeys.own(), organization);
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOrganizationDto) => organizationApi.update(data),
    onSuccess: (organization) => {
      queryClient.setQueryData(organizationKeys.own(), organization);
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
};

export const useSeedOrganization = () => {
  return useMutation({
    mutationFn: (data: SeedOrganizationDto) => organizationApi.seed(data),
  });
};
