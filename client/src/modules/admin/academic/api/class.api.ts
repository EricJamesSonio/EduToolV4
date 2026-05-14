import { apiClient } from '@/api/apiClient';

export interface ClassSchedule {
  id?: string;
  class_id?: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface AcademicClass {
  id: string;
  org_id: string;
  subject_id: string;
  educator_id: string;
  section_id: string | null;
  school_year_id: string;
  semester_id: string;
  capacity: number;
  subject_name: string | null;
  program_id: string | null;
  schedules: ClassSchedule[];
}

export interface ClassQueryParams {
  schoolYearId?: string;
  semesterId?: string;
  educatorId?: string;
  subjectId?: string;
  sectionId?: string;
}

export interface ScheduleSlotInput {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface CreateClassDto {
  subjectId: string;
  educatorId: string;
  sectionId?: string;
  schoolYearId: string;
  capacity: number;
  schedules: ScheduleSlotInput[];
}

export interface UpdateClassDto {
  educatorId?: string;
  sectionId?: string;
  capacity?: number;
  schedules?: ScheduleSlotInput[];
}

const cleanParams = (params: ClassQueryParams) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

export const classApi = {
  getAll: async (params: ClassQueryParams = {}): Promise<AcademicClass[]> => {
    const response = await apiClient.get('/classes', {
      params: cleanParams(params),
    });
    return response.data;
  },

  getById: async (id: string): Promise<AcademicClass> => {
    const response = await apiClient.get(`/classes/${id}`);
    return response.data;
  },

  create: async (dto: CreateClassDto): Promise<AcademicClass> => {
    const response = await apiClient.post('/classes', dto);
    return response.data;
  },

  update: async (id: string, dto: UpdateClassDto): Promise<AcademicClass> => {
    const response = await apiClient.patch(`/classes/${id}`, dto);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/classes/${id}`);
  },
};