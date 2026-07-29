import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useQueryClient } from "@tanstack/react-query";
import { transcriptApi, type TranscriptYear } from "@/api/student/transcript.api";

export const useTranscript = () => {
  return useAsyncQuery<TranscriptYear[]>(
    queryKeys.student.transcript.detail(),
    () => transcriptApi.getMyTranscript(),
  );
};

export const useInvalidateTranscript = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.student.transcript.detail() });
};
