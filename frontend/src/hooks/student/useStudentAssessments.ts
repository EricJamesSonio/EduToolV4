import { useQuery } from "@tanstack/react-query";
import { studentAssessmentApi } from "@/api/student/assessment.api";

export const useStudentAssessments = (classId: string) => {
  return useQuery({
    queryKey: ["student", "assessments", classId],
    queryFn: () => studentAssessmentApi.getAll(classId),
    enabled: !!classId,
  });
};

export const useStudentAssessment = (
  classId: string,
  assessmentId: string
) => {
  return useQuery({
    queryKey: ["student", "assessment", classId, assessmentId],
    queryFn: () =>
      studentAssessmentApi.getOne(classId, assessmentId),
    enabled: !!classId && !!assessmentId,
  });
};

export const useAssessmentResult = (
  classId: string,
  assessmentId: string
) => {
  return useQuery({
    queryKey: ["student", "assessment", "result", classId, assessmentId],
    queryFn: () =>
      studentAssessmentApi.getResult(classId, assessmentId),
    enabled: !!classId && !!assessmentId,
  });
};