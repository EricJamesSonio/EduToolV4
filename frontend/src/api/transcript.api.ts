import apiClient from "@/api/client";

export interface TranscriptTermGrade {
  termId: string;
  termName: string;
  orderIndex: number;
  finalScore: number | null;
  finalGrade: string | null; // visible only when isReleased = true
  isReleased: boolean;
}

export interface TranscriptClass {
  classId: string;
  subject: { name: string };
  educator: string;
  termGrades: TranscriptTermGrade[];
}

export interface TranscriptSemester {
  semesterId: string;
  semesterName: string;
  classes: TranscriptClass[];
}

export interface TranscriptYear {
  schoolYearId: string;
  schoolYearName: string;
  semesters: TranscriptSemester[];
}

export const transcriptApi = {
  getOwn: async (): Promise<TranscriptYear[]> => {
    const { data } = await apiClient.get("/student/transcript");
    return data;
  },
};