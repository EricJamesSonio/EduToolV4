import { useQuery } from "@tanstack/react-query";
import { studentLessonApi } from "@/api/student/lesson.api";

export const useStudentLessons = (
  classId: string,
  weekNumber?: number
) => {
  return useQuery({
    queryKey: ["student", "lessons", classId, weekNumber],
    queryFn: () => studentLessonApi.getAll(classId, weekNumber),
    enabled: !!classId,
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
  });
};