// src/hooks/student/useTranscript.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { transcriptApi, type TranscriptYear } from "@/api/student/transcript.api";
import { QUERY_CONFIGS } from "@/lib/query-client";

export const useTranscript = () => {
  return useQuery<TranscriptYear[]>({
    queryKey: ["student", "transcript"],
    queryFn: () => transcriptApi.getMyTranscript(),
    ...QUERY_CONFIGS.list,
    staleTime: 1000 * 60 * 5,  // 5 min
    placeholderData: (prev) => prev ?? [],
  });
};

export const useInvalidateTranscript = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["student", "transcript"] });
};