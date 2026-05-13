import apiClient from '@/api/apiClient';
import { levelApi } from '../../academic/api/level.api';
import { programApi } from '../../academic/api/program.api';
import type { ProgramWithAssignments } from '../../academic/types/program.types';

interface NamedRecord {
  id: string;
  name: string;
  programType?: string | null;
  program_type?: string | null;
}

interface SubjectRecord extends NamedRecord {
  program_id?: string;
  programId?: string;
}

interface GradingScaleRecord extends NamedRecord {
  program_id?: string;
  programId?: string;
}

interface SemesterAssignmentRecord {
  program_id?: string;
  programId?: string;
  template?: NamedRecord | null;
  template_id?: string;
  templateId?: string;
}

export interface ExistingSeedData {
  programs: ProgramWithAssignments[];
  levels: Array<{ id: string; name: string }>;
  subjects: SubjectRecord[];
  gradingScales: GradingScaleRecord[];
  gradingSchemeTemplates: NamedRecord[];
  semesterTemplates: NamedRecord[];
  semesterAssignments: SemesterAssignmentRecord[];
}

export const systemSeedApi = {
  getExistingData: async (schoolYearId: string): Promise<ExistingSeedData> => {
    const [
      programs,
      levels,
      subjectsResponse,
      gradingScalesResponse,
      gradingSchemeTemplatesResponse,
      semesterTemplatesResponse,
      semesterAssignmentsResponse,
    ] = await Promise.all([
      programApi.getProgramsBySchoolYear(schoolYearId, true),
      levelApi.getBySchoolYear(schoolYearId),
      apiClient.get('/subjects', { params: { schoolYearId } }),
      apiClient.get('/grading-scales', { params: { schoolYearId } }),
      apiClient.get('/grading-scheme-templates'),
      apiClient.get('/semester-templates'),
      apiClient.get('/semester-templates/assignments/by-school-year', {
        params: { schoolYearId },
      }),
    ]);

    return {
      programs,
      levels,
      subjects: subjectsResponse.data,
      gradingScales: gradingScalesResponse.data,
      gradingSchemeTemplates: gradingSchemeTemplatesResponse.data,
      semesterTemplates: semesterTemplatesResponse.data,
      semesterAssignments: semesterAssignmentsResponse.data,
    };
  },
};
