"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { groupyApi } from "@/api/shared/groupy.api";
import type { GroupyUnreadStatus } from "@/types/groupy/groupy.types";

export const groupyUnreadKey = (classId: string) => [
  "groupy-unread",
  classId,
] as const;

// Lightweight unread check for the Class Chat entry badge. Refetches on mount
// and on window focus (no socket needed on the class detail page).
export const useGroupyUnread = (
  classId: string
): UseQueryResult<GroupyUnreadStatus, Error> => {
  return useQuery({
    queryKey: groupyUnreadKey(classId),
    queryFn: () => groupyApi.getUnreadStatus(classId),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};