"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { groupyApi } from "@/api/shared/groupy.api";
import type { GroupyPollDetail } from "@/types/groupy/groupy.types";
import { groupyPollKey } from "./groupyCache";

export const useGroupyPollDetail = (
  pollId: string | null,
  enabled = true
): UseQueryResult<GroupyPollDetail, Error> => {
  return useQuery({
    queryKey: groupyPollKey(pollId ?? ""),
    queryFn: () => groupyApi.getPollDetail(pollId as string),
    enabled: enabled && !!pollId,
    staleTime: 30_000,
  });
};