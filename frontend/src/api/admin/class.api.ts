import client from "@/api/client";
import type { Class, ClassSchedule } from "@/types/admin/class.types";

export interface ScheduleSlot {
  weekday:   number;
  startTime: string;
  endTime:   string;
}

export interface CreateClassRequest {
  subjectId:    string;
  educatorId:   string;
  sectionId?:   string;
  schoolYearId: string;
  semesterId?:  string;
  capacity:     number;
  schedules:    ScheduleSlot[];
}

export interface UpdateClassRequest {
  educatorId?: string;
  sectionId?:  string;
  capacity?:   number;
  schedules?:  ScheduleSlot[];
}

export interface GetClassesQuery {
  schoolYearId?: string;
  semesterId?:   string;
  educatorId?:   string;
  subjectId?:    string;
  sectionId?:    string;
}

export interface EnrollmentResponse {
  id:           string;
  class_id:     string;
  student_id:   string;
  student_name?: string;
  status:       "active" | "pending" | "removed";
}

export interface EnrollOverflowResponse {
  overflow:  true;
  message:   string;
  classId:   string;
  studentId: string;
}

// Raw backend shapes (snake_case from the API)
interface RawSchedule {
  id:         string;
  org_id:     string;
  class_id:   string;
  weekday:    number;
  start_time: string;  // ISO datetime e.g. "2026-04-02T08:00:00.000Z"
  end_time:   string;
}

interface RawClass {
  id:                string;
  org_id:            string;
  subject_id:        string;
  subject_name?:     string;
  educator_id:       string;
  educator_name?:    string;
  section_id:        string | null;
  section_name?:     string;
  semester_id:       string;
  semester_name?:    string;
  school_year_id:    string;
  school_year_title?: string;
  capacity:          number;
  enrolled_count?:   number;
  status?:           string;
  deleted_at:        string | null;
  schedules:         RawSchedule[];
  created_at:        string;
  updated_at?:       string;
  program_id?:       string | null;
  program_name?:     string | null;
  level_name?:       string | null;
  course_name?:      string | null;
  strand_name?:      string | null;
  _count?:           { enrollments: number };
}

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

// Extract "HH:mm" from ISO datetime "2026-04-02T08:00:00.000Z"
function toTimeString(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().substring(11, 16);
  } catch {
    return iso;
  }
}

function mapSchedule(s: RawSchedule): ClassSchedule {
  return {
    id:        s.id,
    classId:   s.class_id,
    weekday:   s.weekday,
    startTime: toTimeString(s.start_time),
    endTime:   toTimeString(s.end_time),
  };
}

function mapClass(raw: RawClass): Class {
  return {
    id:              raw.id,
    orgId:           raw.org_id,
    subjectId:       raw.subject_id,
    subjectName:     raw.subject_name,
    educatorId:      raw.educator_id,
    educatorName:    raw.educator_name,
    sectionId:       raw.section_id,
    sectionName:     raw.section_name,
    semesterId:      raw.semester_id,
    semesterName:    raw.semester_name,
    schoolYearId:    raw.school_year_id,
    schoolYearTitle: raw.school_year_title,
    capacity:        raw.capacity,
    enrolledCount:   raw._count?.enrollments ?? raw.enrolled_count ?? 0,
    status:          (raw.status as Class["status"]) ?? (raw.deleted_at ? "archived" : "active"),
    isArchived:      raw.deleted_at !== null,                    // ← ADD
    title:           raw.subject_name ?? raw.subject_id,        // ← ADD (fallback to ID until enriched)
    schedules:       (raw.schedules ?? []).map(mapSchedule),
    createdAt:       raw.created_at,
    updatedAt:       raw.updated_at,
    programId: raw.program_id ?? undefined,
    programName: raw.program_name ?? undefined,
    levelName: raw.level_name ?? undefined,
    courseName: raw.course_name ?? undefined,
    strandName: raw.strand_name ?? undefined,
  };
}

function unwrapAndMapList(res: { data: ApiResponse<RawClass[]> | RawClass[] }): Class[] {
  const raw = Array.isArray(res.data)
    ? res.data
    : ((res.data as ApiResponse<RawClass[]>).data ?? []);
  return raw.map(mapClass);
}

function unwrapAndMapOne(res: { data: ApiResponse<RawClass> | RawClass }): Class {
  const d = res.data as ApiResponse<RawClass>;
  const raw = d?.data !== undefined ? d.data : (res.data as RawClass);
  return mapClass(raw);
}

export const classApi = {
  getAll: async (query?: GetClassesQuery): Promise<Class[]> => {
    const res = await client.get<ApiResponse<RawClass[]> | RawClass[]>(
      "/classes",
      { params: query }
    );
    return unwrapAndMapList(res);
  },

  getOne: async (id: string): Promise<Class> => {
    const res = await client.get<ApiResponse<RawClass> | RawClass>(`/classes/${id}`);
    return unwrapAndMapOne(res);
  },

  create: async (data: CreateClassRequest): Promise<Class> => {
    const res = await client.post<ApiResponse<RawClass> | RawClass>("/classes", data);
    return unwrapAndMapOne(res);
  },

  update: async (id: string, data: UpdateClassRequest): Promise<Class> => {
    const res = await client.patch<ApiResponse<RawClass> | RawClass>(`/classes/${id}`, data);
    return unwrapAndMapOne(res);
  },

  archive: async (id: string): Promise<void> => {
    await client.delete(`/classes/${id}`);
  },

  getEnrollments: async (classId: string): Promise<EnrollmentResponse[]> => {
    const res = await client.get<ApiResponse<EnrollmentResponse[]> | EnrollmentResponse[]>(
      `/classes/${classId}/enrollments`
    );
    if (Array.isArray(res.data)) return res.data;
    const d = res.data as ApiResponse<EnrollmentResponse[]>;
    return Array.isArray(d?.data) ? d.data : [];
  },

  enroll: async (
    classId: string,
    studentId: string
  ): Promise<EnrollmentResponse | EnrollOverflowResponse> => {
    const res = await client.post<
      | ApiResponse<EnrollmentResponse | EnrollOverflowResponse>
      | EnrollmentResponse
      | EnrollOverflowResponse
    >(`/classes/${classId}/enroll`, { studentId });
    const d = res.data as ApiResponse<EnrollmentResponse | EnrollOverflowResponse>;
    return d?.data !== undefined
      ? d.data
      : (res.data as EnrollmentResponse | EnrollOverflowResponse);
  },

  updateEnrollment: async (
    classId: string,
    enrollmentId: string,
    status: "active" | "pending" | "removed"
  ): Promise<EnrollmentResponse> => {
    const res = await client.patch<ApiResponse<EnrollmentResponse> | EnrollmentResponse>(
      `/classes/${classId}/enrollments/${enrollmentId}`,
      { status }
    );
    const d = res.data as ApiResponse<EnrollmentResponse>;
    return d?.data !== undefined ? d.data : (res.data as EnrollmentResponse);
  },

  removeEnrollment: async (
    classId: string,
    enrollmentId: string
  ): Promise<{ success: true }> => {
    const res = await client.delete<{ success: true }>(
      `/classes/${classId}/enrollments/${enrollmentId}`
    );
    return res.data;
  },
};