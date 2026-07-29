import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { studentLessonApi } from "@/api/student/lesson.api";

export const useStudentLessons = (classId: string, weekNumber?: number) => {
  return useAsyncQuery(
    queryKeys.student.lessons.list(classId, { weekNumber }),
    () => studentLessonApi.getAll(classId, weekNumber),
    { enabled: !!classId },
  );
};

export const useStudentLesson = (classId: string, lessonId: string) => {
  return useAsyncQuery(
    queryKeys.student.lessons.detail(lessonId),
    () => studentLessonApi.getOne(classId, lessonId),
    { enabled: !!classId && !!lessonId },
  );
};
