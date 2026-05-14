// client/src/modules/admin/system/hooks/useGradeLock.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gradeLockApi } from '../api/grade-lock.api';
import type {
  CreateGradeLockSettingDto,
  UpdateGradeLockSettingDto,
  AssignSettingDto,
  LockClassDto,
  UnlockClassDto,
  OverrideGradeLockDto,
} from '../types/grade-lock.types';

// ── Query keys ───────────────────────────────────────────────────────────────

export const gradeLockKeys = {
  all: ['grade-lock'] as const,

  settings: () => [...gradeLockKeys.all, 'settings'] as const,
  setting: (id: string) => [...gradeLockKeys.settings(), id] as const,

  classLocks: () => [...gradeLockKeys.all, 'class-locks'] as const,
  classLocksBySchoolYear: (schoolYearId: string) =>
    [...gradeLockKeys.classLocks(), { schoolYearId }] as const,

  events: (classId: string) =>
    [...gradeLockKeys.all, 'events', classId] as const,
};

// ── Settings ─────────────────────────────────────────────────────────────────

export const useGradeLockSettings = () => {
  return useQuery({
    queryKey: gradeLockKeys.settings(),
    queryFn: () => gradeLockApi.getSettings(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGradeLockSetting = (id: string) => {
  return useQuery({
    queryKey: gradeLockKeys.setting(id),
    queryFn: () => gradeLockApi.getSetting(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateGradeLockSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGradeLockSettingDto) =>
      gradeLockApi.createSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeLockKeys.settings() });
    },
  });
};

export const useUpdateGradeLockSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGradeLockSettingDto }) =>
      gradeLockApi.updateSetting(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeLockKeys.settings() });
    },
  });
};

export const useDeleteGradeLockSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gradeLockApi.deleteSetting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeLockKeys.settings() });
    },
  });
};

// ── Assignment ────────────────────────────────────────────────────────────────

export const useAssignGradeLockSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignSettingDto) => gradeLockApi.assignSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeLockKeys.classLocks() });
    },
  });
};

// ── Class locks ───────────────────────────────────────────────────────────────

export const useClassLocks = (schoolYearId?: string) => {
  return useQuery({
    queryKey: schoolYearId
      ? gradeLockKeys.classLocksBySchoolYear(schoolYearId)
      : gradeLockKeys.classLocks(),
    queryFn: () => gradeLockApi.getClassLocks(schoolYearId),
    staleTime: 2 * 60 * 1000,
  });
};

// ── Lock / Unlock / Override ──────────────────────────────────────────────────

export const useLockClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, data }: { classId: string; data?: LockClassDto }) =>
      gradeLockApi.lockClass(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeLockKeys.classLocks() });
    },
  });
};

export const useUnlockClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: UnlockClassDto }) =>
      gradeLockApi.unlockClass(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeLockKeys.classLocks() });
    },
  });
};

export const useOverrideGradeLock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      data,
    }: {
      classId: string;
      data: OverrideGradeLockDto;
    }) => gradeLockApi.overrideLock(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeLockKeys.classLocks() });
    },
  });
};

// ── Events ────────────────────────────────────────────────────────────────────

export const useGradeLockEvents = (classId: string) => {
  return useQuery({
    queryKey: gradeLockKeys.events(classId),
    queryFn: () => gradeLockApi.getEventsForClass(classId),
    enabled: !!classId,
    staleTime: 1 * 60 * 1000,
  });
};

// ── Auto-lock ─────────────────────────────────────────────────────────────────

export const useAutoLock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gradeLockApi.autoLock(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeLockKeys.classLocks() });
    },
  });
};