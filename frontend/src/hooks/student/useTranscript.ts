import { useQuery, useQueryClient } from "@tanstack/react-query";
import { studentClassApi } from "@/api/student/class.api";
import { studentGradeApi } from "@/api/student/grade.api";

// ==============================
// Types
// ==============================

export interface TranscriptItem {
  classId: string;
  subjectName: string | null;
  educatorName: string | null;
  grades: Awaited<ReturnType<typeof studentGradeApi.getOwn>>;
}

// ==============================
// Hook
// ==============================

export const useTranscript = () => {
  return useQuery({
    queryKey: ["student", "transcript"],

    queryFn: async (): Promise<TranscriptItem[]> => {
      // 1. Get all enrolled classes
      const classes = await studentClassApi.getAll();

      if (!classes.length) return [];

      // 2. Fetch all grades in parallel
      const gradesResults = await Promise.all(
        classes.map((cls) =>
          studentGradeApi.getOwn(cls.class.id)
        )
      );

      // 3. Merge into transcript structure
      return classes.map((cls, index) => ({
        classId: cls.class.id,
        subjectName: cls.class.subjectName,
        educatorName: cls.class.educatorName,
        grades: gradesResults[index] || [],
      }));
    },

    // ==============================
    // Performance / UX tuning
    // ==============================

    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 10,   // cache cleanup (React Query v5)

    retry: 1, // avoid spamming API if something fails

    // smoother UI when refetching
    placeholderData: (previousData) => previousData ?? [],
  });
};

// ==============================
// Optional helper (VERY USEFUL)
// ==============================

export const useInvalidateTranscript = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: ["student", "transcript"],
    });
  };
};