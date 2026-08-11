"use client";

import {
  useInfiniteQuery,
  type UseInfiniteQueryResult,
  type InfiniteData,
} from "@tanstack/react-query";
import { groupyApi } from "@/api/shared/groupy.api";
import type { GroupyMessagesPage } from "@/types/groupy/groupy.types";
import { groupyMessagesKey } from "./groupyCache";

export const useGroupyMessages = (
  classId: string
): UseInfiniteQueryResult<InfiniteData<GroupyMessagesPage, unknown>, Error> => {
  const query = useInfiniteQuery({
    queryKey: groupyMessagesKey(classId),
    queryFn: ({ pageParam }) =>
      groupyApi.listMessages(classId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasMore && last.nextCursor ? last.nextCursor : undefined,
    staleTime: 30_000,
  });

  return query;
};