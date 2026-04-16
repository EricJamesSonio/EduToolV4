import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";

export type WeekSlot = {
  label: string;
  value: number;
  termName: string;
  semesterName: string;
  semesterIndex: number;
};

async function fetchWeekStructure(classId: string): Promise<WeekSlot[]> {
  const { data } = await apiClient.get<{ success: boolean; data: WeekSlot[] }>(
    `/educator/classes/${classId}/lessons/week-structure`,
  );
  return data.data;
}

export function useClassWeeks(classId: string) {
  return useQuery({
    queryKey: ["class-week-structure", classId],
    queryFn: () => fetchWeekStructure(classId),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });
}