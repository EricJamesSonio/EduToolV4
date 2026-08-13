"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { groupyApi } from "@/api/shared/groupy.api";
import type { GroupyMembersResponse } from "@/types/groupy/groupy.types";

export const groupyMembersKey = (classId: string) => [
  "groupy-members",
  classId,
] as const;

export const useGroupyMembers = (
  classId: string
): UseQueryResult<GroupyMembersResponse, Error> => {
  return useQuery({
    queryKey: groupyMembersKey(classId),
    queryFn: () => groupyApi.getMembers(classId),
    // Always re-sync on entry/focus: read-receipt ("seen by") states must be
    // fresh when the user returns to the chat, not served from a stale cache.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};