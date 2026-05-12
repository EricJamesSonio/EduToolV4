import { useQuery } from "@tanstack/react-query";
import { studentLessonApi } from "@/api/student/lesson.api";
import { QUERY_CONFIGS } from "@/lib/query-client";

export const useStudentLessons = (
  classId: string,
  weekNumber?: number
) => {
  return useQuery({
    queryKey: ["student", "lessons", classId, weekNumber],
    queryFn: () => studentLessonApi.getAll(classId, weekNumber),
    enabled: !!classId,
    ...QUERY_CONFIGS.list,
  });
};

export const useStudentLesson = (
  classId: string,
  lessonId: string
) => {
  return useQuery({
    queryKey: ["student", "lesson", classId, lessonId],
    queryFn: () => studentLessonApi.getOne(classId, lessonId),
    enabled: !!classId && !!lessonId,
    ...QUERY_CONFIGS.detail,
  });
};