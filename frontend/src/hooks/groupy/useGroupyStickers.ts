"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { groupyApi, type StickerMeta } from "@/api/shared/groupy.api";

const stickersKey = ["groupy-stickers"] as const;

export const useGroupyStickers = (): UseQueryResult<StickerMeta[], Error> => {
  return useQuery({
    queryKey: stickersKey,
    queryFn: () => groupyApi.getStickers(),
    staleTime: 5 * 60_000,
  });
};

export const useGroupyStickerAsset = (
  stickerId: string | null
): string | undefined => {
  const { data } = useGroupyStickers();
  return data?.find((s) => s.id === stickerId)?.assetPath;
};
