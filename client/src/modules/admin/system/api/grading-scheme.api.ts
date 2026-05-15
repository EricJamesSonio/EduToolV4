import { apiClient } from '@/api/apiClient';

export interface ApplyTemplateToProgramDto {
  programId: string;
  templateId: string;
}

export interface ApplyTemplateToProgramResult {
  applied: number;
  skipped: number;
  total: number;
}

export const gradingSchemeApi = {
  applyToProgram: async (
    dto: ApplyTemplateToProgramDto,
  ): Promise<ApplyTemplateToProgramResult> => {
    const response = await apiClient.post('/grading-schemes/apply-to-program', dto);
    return response.data;
  },
};