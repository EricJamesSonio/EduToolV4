import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";
import type { WeekSlot } from "@/types/educator/lesson.types";

async function fetchWeekStructure(classId: string): Promise<WeekSlot[]> {
  const { data } = await apiClient.get<{
    success: boolean;
    data: WeekSlot[];
  }>(`/educator/classes/${classId}/lessons/week-structure`);

  if (!data?.success || !Array.isArray(data.data)) {
    return [];
  }

  return data.data.sort((a, b) => {
    if (a.semesterIndex !== b.semesterIndex) {
      return a.semesterIndex - b.semesterIndex;
    }
    return a.value - b.value;
  });
}

export function useClassWeeks(classId: string) {
  const query = useQuery({
    queryKey: ["class-week-structure", classId],
    queryFn: () => fetchWeekStructure(classId),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    data: query.data ?? [], // 🔥 always safe
  };
}