// Programs Hook
// React Query hook for fetching and managing programs
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programApi } from '../api/program.api';
import type { CreateProgramDto, UpdateProgramDto } from '../types/program.types';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const programKeys = {
  all: ['programs'] as const,
  allList: (schoolYearId: string) => [...programKeys.all, 'list', schoolYearId] as const,
  allStats: (schoolYearId: string) => [...programKeys.all, 'stats', schoolYearId] as const,
  detail: (id: string) => [...programKeys.all, 'detail', id] as const,
};

/**
 * Invalidates every cached query that belongs to a given school year.
 * Call this after any mutation (create / update / delete) to keep
 * both the plain list and the stats list in sync.
 */
const invalidateSchoolYearPrograms = (queryClient: ReturnType<typeof useQueryClient>, schoolYearId: string) => {
  // Covers: ['programs', 'list', schoolYearId]
  queryClient.invalidateQueries({ queryKey: programKeys.allList(schoolYearId) });
  // Covers: ['programs', 'stats', schoolYearId, *] — the trailing boolean is ignored
  queryClient.invalidateQueries({ queryKey: programKeys.allStats(schoolYearId) });
};

// ---------------------------------------------------------------------------
// Read hooks
// ---------------------------------------------------------------------------

export const useProgramsBySchoolYear = (schoolYearId: string, includeAssignments = false) => {
  return useQuery({
    queryKey: programKeys.allList(schoolYearId),
    queryFn: () => programApi.getProgramsBySchoolYear(schoolYearId, includeAssignments),
    enabled: !!schoolYearId,
  });
};

export const useProgram = (id: string) => {
  return useQuery({
    queryKey: programKeys.detail(id),
    queryFn: () => programApi.getProgramById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useProgramsWithStats = (schoolYearId: string, includeAssignments = false) => {
  return useQuery({
    // Keep `includeAssignments` in the key so both variants can coexist in cache
    queryKey: [...programKeys.allStats(schoolYearId), includeAssignments] as const,
    queryFn: () => programApi.getProgramsWithStats(schoolYearId, includeAssignments),
    enabled: !!schoolYearId,
  });
};

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export const useCreateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProgramDto) => programApi.createProgram(data),
    onSuccess: (newProgram) => {
      // Optimistically insert into the plain list cache if it exists, so the
      // UI updates without waiting for a round-trip refetch.
      queryClient.setQueryData(
        programKeys.allList(newProgram.schoolYearId),
        (old: unknown) => {
          if (!Array.isArray(old)) return old;          // cache not populated yet → skip
          const exists = old.some((p: { id: string }) => p.id === newProgram.id);
          return exists ? old : [...old, newProgram];
        },
      );

      // Invalidate both list + stats so the next read is fresh.
      invalidateSchoolYearPrograms(queryClient, newProgram.schoolYearId);
    },
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgramDto }) =>
      programApi.updateProgram(id, data),
    onSuccess: (updatedProgram) => {
      // Keep the detail cache up-to-date immediately.
      queryClient.setQueryData(programKeys.detail(updatedProgram.id), updatedProgram);

      // Invalidate list + stats.
      invalidateSchoolYearPrograms(queryClient, updatedProgram.schoolYearId);
    },
  });
};

export const useDeleteProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => programApi.deleteProgram(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: programKeys.detail(deletedId) });

      // Invalidate everything under ['programs'] — covers all school years
      // because we don't know the schoolYearId from just the id.
      queryClient.invalidateQueries({ queryKey: programKeys.all });
    },
  });
};