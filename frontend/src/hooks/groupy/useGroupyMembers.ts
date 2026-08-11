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
    staleTime: 60_000,
  });
};