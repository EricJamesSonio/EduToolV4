"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { groupyApi } from "@/api/shared/groupy.api";
import type { GroupyActiveMeeting } from "@/types/groupy/groupy.types";

export const groupyActiveMeetingKey = (classId: string) => [
  "groupy-active-meeting",
  classId,
] as const;

// The live groupy meeting for the class (if any). Polled lightly so the
// Messenger-style active-call banner and ended-message markers stay in sync
// with ephemeral meetings being deleted on end.
export const useGroupyActiveMeeting = (
  classId: string
): UseQueryResult<GroupyActiveMeeting, Error> => {
  return useQuery({
    queryKey: groupyActiveMeetingKey(classId),
    queryFn: () => groupyApi.getActiveMeeting(classId),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });
};