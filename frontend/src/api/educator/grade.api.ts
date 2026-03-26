import apiClient from "@/api/client";

export interface AssessmentScore {
  assessmentId: string;
  type: "quiz" | "exam" | "activity" | "custom";
  score: number;
  manualScore: number | null;
  totalItems: number;
  status: string;
}

export interface CategoryBreakdown {
  category: string;
  weight: number;
  rawAverage: number;
  manualScore: number | null;
  weightedScore: number;
}

export interface StudentGrade {
  studentId: string;
  grade: {
    student_id: string;
    final_score: number;
    final_grade: string;
    is_locked: boolean;
  } | null;
  assessmentScores: AssessmentScore[];
  categoryBreakdown: CategoryBreakdown[];
}

export interface TermGrades {
  termId: string;
  students: StudentGrade[];
}

export interface ManualScoreDto {
  category: string;
  score: number;
}

export const gradeApi = {
  getByClass: async (classId: string): Promise<TermGrades[]> => {
    const { data } = await apiClient.get(`/classes/${classId}/grades`);
    return data;
  },

  getByTerm: async (classId: string, termId: string): Promise<TermGrades> => {
    const { data } = await apiClient.get(
      `/classes/${classId}/grades/${termId}`
    );
    return data;
  },

  compute: async (
    classId: string,
    termId: string
  ): Promise<{ computed: number; message: string }> => {
    const { data } = await apiClient.post(
      `/classes/${classId}/grades/${termId}/compute`
    );
    return data;
  },

  setManualScore: async (
    classId: string,
    termId: string,
    studentId: string,
    dto: ManualScoreDto
  ): Promise<{
    id: string;
    classId: string;
    studentId: string;
    termId: string;
    category: string;
    score: number;
  }> => {
    const { data } = await apiClient.patch(
      `/classes/${classId}/grades/${termId}/students/${studentId}/manual`,
      dto
    );
    return data;
  },
};