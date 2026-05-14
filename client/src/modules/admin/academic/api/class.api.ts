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

const cleanParams = (params: ClassQueryParams) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );
};

export const classApi = {
  getAll: async (params: ClassQueryParams = {}): Promise<AcademicClass[]> => {
    const response = await apiClient.get('/classes', {
      params: cleanParams(params),
    });
    return response.data;
  },
};
