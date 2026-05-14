// client/src/modules/admin/system/api/grade-lock.api.ts

import { apiClient } from '@/api/apiClient';
import type {
  GradeLockSetting,
  GradeLock,
  GradeLockEvent,
  CreateGradeLockSettingDto,
  UpdateGradeLockSettingDto,
  AssignSettingDto,
  LockClassDto,
  UnlockClassDto,
  OverrideGradeLockDto,
} from '../types/grade-lock.types';

export const gradeLockApi = {
  // ── Settings ────────────────────────────────────────────────────────────────

  /** GET /grade-lock/settings */
  getSettings: async (): Promise<GradeLockSetting[]> => {
    const response = await apiClient.get('/grade-lock/settings');
    return response.data;
  },

  /** GET /grade-lock/settings/:id */
  getSetting: async (id: string): Promise<GradeLockSetting> => {
    const response = await apiClient.get(`/grade-lock/settings/${id}`);
    return response.data;
  },

  /** POST /grade-lock/settings */
  createSetting: async (data: CreateGradeLockSettingDto): Promise<GradeLockSetting> => {
    const response = await apiClient.post('/grade-lock/settings', data);
    return response.data;
  },

  /** PUT /grade-lock/settings/:id */
  updateSetting: async (
    id: string,
    data: UpdateGradeLockSettingDto,
  ): Promise<GradeLockSetting> => {
    const response = await apiClient.put(`/grade-lock/settings/${id}`, data);
    return response.data;
  },

  /** DELETE /grade-lock/settings/:id */
  deleteSetting: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/grade-lock/settings/${id}`);
    return response.data;
  },

  // ── Assignment ───────────────────────────────────────────────────────────────

  /** POST /grade-lock/assign */
  assignSetting: async (data: AssignSettingDto): Promise<GradeLock> => {
    const response = await apiClient.post('/grade-lock/assign', data);
    return response.data;
  },

  // ── Lock actions ─────────────────────────────────────────────────────────────

  /** POST /grade-lock/:classId/lock */
  lockClass: async (
    classId: string,
    data?: LockClassDto,
  ): Promise<{ success: boolean; gradeLock: GradeLock }> => {
    const response = await apiClient.post(`/grade-lock/${classId}/lock`, data ?? {});
    return response.data;
  },

  /** POST /grade-lock/:classId/unlock */
  unlockClass: async (
    classId: string,
    data: UnlockClassDto,
  ): Promise<{ success: boolean; gradeLock: GradeLock }> => {
    const response = await apiClient.post(`/grade-lock/${classId}/unlock`, data);
    return response.data;
  },

  /** POST /grade-lock/:classId/override */
  overrideLock: async (
    classId: string,
    data: OverrideGradeLockDto,
  ): Promise<{ success: boolean; gradeLock: GradeLock }> => {
    const response = await apiClient.post(`/grade-lock/${classId}/override`, data);
    return response.data;
  },

  // ── Queries ──────────────────────────────────────────────────────────────────

  /** GET /grade-lock/classes?schoolYearId=... */
  getClassLocks: async (schoolYearId?: string): Promise<GradeLock[]> => {
    const response = await apiClient.get('/grade-lock/classes', {
      params: schoolYearId ? { schoolYearId } : undefined,
    });
    return response.data;
  },

  /** GET /grade-lock/:classId/events */
  getEventsForClass: async (classId: string): Promise<GradeLockEvent[]> => {
    const response = await apiClient.get(`/grade-lock/${classId}/events`);
    return response.data;
  },

  // ── Auto-lock ────────────────────────────────────────────────────────────────

  /** POST /grade-lock/auto-lock */
  autoLock: async (): Promise<{ success: boolean; lockedCount: number }> => {
    const response = await apiClient.post('/grade-lock/auto-lock');
    return response.data;
  },
};