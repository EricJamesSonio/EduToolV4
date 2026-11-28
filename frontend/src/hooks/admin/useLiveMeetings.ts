import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { adminQueryKeys } from "@/hooks/queryKeys/admin.keys";
import { liveMeetingApi } from "@/api/admin/live-meeting.api";
import type {
  LiveMeeting,
  LiveMeetingToken,
} from "@/types/admin/live-meeting.types";

const LIVE_MEETINGS_REFRESH_MS = 10_000;

const liveMeetingKeys = {
  list: () => [...adminQueryKeys.all, "liveMeetings", "list"] as const,
  token: (meetingId: string) =>
    [...adminQueryKeys.all, "liveMeetings", "token", meetingId] as const,
};

export const useLiveMeetings = () => {
  return useAsyncQuery<LiveMeeting[]>(
    liveMeetingKeys.list(),
    () => liveMeetingApi.getLive(),
    {
      meta: { preset: "realtime", feature: "liveMeetings" },
      staleTime: LIVE_MEETINGS_REFRESH_MS,
      refetchInterval: LIVE_MEETINGS_REFRESH_MS,
      // The next poll is the retry, so failures do not stack extra requests.
      retry: false,
    },
  );
};

export const useLiveMeetingToken = (meetingId: string) => {
  return useAsyncQuery<LiveMeetingToken>(
    liveMeetingKeys.token(meetingId),
    () => liveMeetingApi.getToken(meetingId),
    {
      enabled: !!meetingId,
      meta: { preset: "detail", feature: "liveMeetings" },
      staleTime: 0,
      gcTime: 0,
      refetchOnReconnect: false,
    },
  );
};