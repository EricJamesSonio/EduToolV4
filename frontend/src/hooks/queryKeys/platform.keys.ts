import type { QueryFilters } from './types';

const platformKeys = {
  all: ['platform'] as const,
} as const;

export const platformQueryKeys = {
  ...platformKeys,

  admins: {
    all: [...platformKeys.all, 'admins'] as const,
    list: (filters?: QueryFilters) =>
      [...platformKeys.all, 'admins', 'list', filters] as const,
    detail: (id: string) =>
      [...platformKeys.all, 'admins', 'detail', id] as const,
  },

  registrationRequests: {
    all: [...platformKeys.all, 'registrationRequests'] as const,
    list: (filters?: QueryFilters) =>
      [...platformKeys.all, 'registrationRequests', 'list', filters] as const,
  },

  schools: {
    all: [...platformKeys.all, 'schools'] as const,
    list: (filters?: QueryFilters) =>
      [...platformKeys.all, 'schools', 'list', filters] as const,
  },
} as const;
