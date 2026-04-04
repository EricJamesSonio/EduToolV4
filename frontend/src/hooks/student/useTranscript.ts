// src/hooks/student/useTranscript.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { transcriptApi, type TranscriptYear } from "@/api/student/transcript.api";

export const useTranscript = () => {
  return useQuery<TranscriptYear[]>({
    queryKey: ["student", "transcript"],
    queryFn: () => transcriptApi.getMyTranscript(),
    staleTime: 1000 * 60 * 5,  // 5 min
    gcTime:    1000 * 60 * 10, // 10 min
    retry: 1,
    placeholderData: (prev) => prev ?? [],
  });
};

export const useInvalidateTranscript = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["student", "transcript"] });
};