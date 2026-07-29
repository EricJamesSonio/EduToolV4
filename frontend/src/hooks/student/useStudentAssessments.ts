import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { studentAssessmentApi } from "@/api/student/assessment.api";
import type {
  StudentAssessmentItem,
  StudentAssessmentDetail,
  AssessmentResult,
} from "@/api/student/assessment.api";

export const useStudentAssessments = (classId: string) => {
  return useAsyncQuery<StudentAssessmentItem[]>(
    queryKeys.student.assessments.list(classId),
    () => studentAssessmentApi.getAll(classId),
    { enabled: !!classId },
  );
};

export const useStudentAssessment = (classId: string, assessmentId: string) => {
  return useAsyncQuery<StudentAssessmentDetail>(
    queryKeys.student.assessments.detail(assessmentId),
    () => studentAssessmentApi.getOne(classId, assessmentId),
    { enabled: !!classId && !!assessmentId },
  );
};

export const useAssessmentResult = (classId: string, assessmentId: string) => {
  return useAsyncQuery<AssessmentResult>(
    queryKeys.student.assessments.result(assessmentId),
    () => studentAssessmentApi.getResult(classId, assessmentId),
    { enabled: !!classId && !!assessmentId },
  );
};
