import { useQueries } from "@tanstack/react-query";
import { studentClassApi } from "@/api/student/class.api";
import { studentGradeApi } from "@/api/student/grade.api";

export const useTranscript = () => {
  // 1. Get all classes
  const classesQuery = useQueries({
    queries: [
      {
        queryKey: ["student", "classes"],
        queryFn: studentClassApi.getAll,
      },
    ],
  })[0];

  const classes = classesQuery.data || [];

  // 2. Fetch grades per class
  const gradesQueries = useQueries({
    queries: classes.map((cls) => ({
      queryKey: ["student", "grades", cls.class.id],
      queryFn: () => studentGradeApi.getOwn(cls.class.id),
      enabled: !!cls.class.id,
    })),
  });

  // 3. Combine
  const transcript = classes.map((cls, index) => ({
    class: cls.class,
    grades: gradesQueries[index]?.data || [],
    isLoading: gradesQueries[index]?.isLoading,
  }));

  return {
    classes,
    transcript,
    isLoading:
      classesQuery.isLoading ||
      gradesQueries.some((q) => q.isLoading),
  };
};