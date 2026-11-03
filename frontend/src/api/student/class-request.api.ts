import apiClient from "@/api/client";
import type { RequestClassView } from "@/api/admin/class-assignment-request.api";

export type ClassScope = "current" | "lower";
export type RequestDecision = "pending" | "approved" | "denied";

export interface AvailableClass extends RequestClassView {
  scope: ClassScope;
  isFull: boolean;
}

export interface BlockedClass extends RequestClassView {
  scope: ClassScope;
  missing: { subject_id: string; subject_name: string; reason: string }[];
}

export interface LatestClassRequest {
  id: string;
  status: string;
  origin: string;
  requestedAt: string;
  classes: (RequestClassView & { decision: RequestDecision })[];
}

export interface StudentClassAvailability {
  placement: {
    studentSchoolYearId: string;
    programEnrollmentId: string;
    schoolYearId: string;
    schoolYearName: string;
    programName: string;
    levelName: string | null;
    levelRank: number | null;
    sectionId: string | null;
    sectionName: string | null;
    isIrregular: boolean;
  } | null;
  semesters: { id: string; name: string; startDate: string; endDate: string }[];
  classes: AvailableClass[];
  blocked: BlockedClass[];
  enrolled: RequestClassView[];
  latestRequest: LatestClassRequest | null;
}

export const studentClassRequestApi = {
  getAvailable: async (): Promise<StudentClassAvailability> => {
    const { data } = await apiClient.get("/student/class-requests/available");
    return (data?.data ?? data) as StudentClassAvailability;
  },
};