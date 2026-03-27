import client from "@/api/client";
import type { GradeLock, GradeLockSetting } from "@/types/admin/grade-lock.types";

export interface CreateGradeLockSettingRequest {
  schoolYearId: string;
  lockDeadline: string;
}

export const gradeLockApi = {
  getSetting: async (schoolYearId: string): Promise<GradeLockSetting> => {
    const res = await client.get<GradeLockSetting>("/grade-lock/settings", {
      params: { schoolYearId },
    });
    return res.data;
  },
  createSetting: async (data: CreateGradeLockSettingRequest): Promise<GradeLockSetting> => {
    const res = await client.post<GradeLockSetting>("/grade-lock/settings", data);
    return res.data;
  },
  updateSetting: async (
    schoolYearId: string,
    lockDeadline: string
  ): Promise<GradeLockSetting> => {
    const res = await client.patch<GradeLockSetting>("/grade-lock/settings", {
      schoolYearId,
      lockDeadline,
    });
    return res.data;
  },
  getLocks: async (): Promise<GradeLock[]> => {
    const res = await client.get<GradeLock[]>("/grade-lock/classes");
    return res.data;
  },
  unlockOverride: async (classId: string, reason: string): Promise<{ success: true }> => {
    const res = await client.post<{ success: true }>(
      `/grade-lock/${classId}/unlock`,
      { reason }
    );
    return res.data;
  },
};