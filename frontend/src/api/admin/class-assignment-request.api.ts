import client from "@/api/client";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface RequestClassView {
  classId: string;
  subjectId: string;
  subjectName: string;
  semesterId: string;
  semesterName: string | null;
  sectionId: string | null;
  sectionName: string | null;
  levelName: string | null;
  educatorName: string | null;
  capacity: number;
  enrolledCount: number;
  schedules: { weekday: number; startTime: string; endTime: string }[];
}

export interface CreateRequestPayload {
  studentSchoolYearId: string;
  programEnrollmentId?: string;
  origin: "student_request" | "admin_flag";
  studentRequestedSubjectIds?: string[];
  studentRequestedClassIds?: string[];
  adminFinalizedSubjectIds?: string[];
}

export interface FinalizeRequestPayload {
  /** Approved classes are enrolled immediately; other requested classes are denied. */
  approvedClassIds?: string[];
  /** Legacy subject-level finalize. */
  adminFinalizedSubjectIds?: string[];
}

export interface ClassAssignmentRequestItem {
  id: string;
  org_id: string;
  student_id: string;
  student_school_year_id: string;
  program_enrollment_id?: string | null;
  origin: string;
  status: string;
  student_requested_subject_ids: string[];
  student_requested_class_ids?: string[];
  admin_finalized_subject_ids: string[];
  admin_approved_class_ids?: string[];
  has_prerequisite_warning: boolean;
  prerequisite_warnings: Array<{
    subject_id: string;
    subject_name: string;
    prerequisite_subject_id: string;
    prerequisite_subject_name: string;
    reason: string;
  }>;
  requested_at: string;
  finalized_at?: string | null;
  requestedClasses?: RequestClassView[];
  approvedClassIds?: string[];
  deniedClassIds?: string[];
}

export const classAssignmentRequestApi = {
  create: async (data: CreateRequestPayload): Promise<unknown> => {
    const res = await client.post<ApiResponse<unknown>>("/class-assignment-requests", data);
    return res.data.data;
  },

  list: async (params?: { studentId?: string; schoolYearId?: string; status?: string; hasPrerequisiteWarning?: string }): Promise<{ data: ClassAssignmentRequestItem[]; total: number }> => {
    const res = await client.get<ApiResponse<{ data: ClassAssignmentRequestItem[]; total: number; page: number; limit: number }>>(
      "/class-assignment-requests",
      { params },
    );
    return res.data.data as { data: ClassAssignmentRequestItem[]; total: number };
  },

  finalize: async (id: string, payload: FinalizeRequestPayload): Promise<unknown> => {
    const res = await client.patch<ApiResponse<unknown>>(`/class-assignment-requests/${id}/finalize`, payload);
    return res.data.data;
  },

  reopen: async (id: string, reason?: string): Promise<unknown> => {
    const res = await client.patch<ApiResponse<unknown>>(`/class-assignment-requests/${id}/reopen`, { reason });
    return res.data.data;
  },
};