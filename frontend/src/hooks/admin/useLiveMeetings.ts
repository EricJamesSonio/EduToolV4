import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { adminQueryKeys } from "@/hooks/queryKeys/admin.keys";
import { liveMeetingApi } from "@/api/admin/live-meeting.api";
import type {
  LiveMeeting,
  LiveMeetingToken,
} from "@/types/admin/live-meeting.types";

const LIVE_MEETINGS_REFRESH_MS = 5_000;

const liveMeetingKeys = {
  list: () => [...adminQueryKeys.all, "liveMeetings", "list"] as const,
  token: (meetingId: string) =>
    [...adminQueryKeys.all, "liveMeetings", "token", meetingId] as const,
};

export const useLiveMeetings = () => {
  return useAsyncQuery<LiveMeeting[]>(
    liveMeetingKeys.list(),
    () => liveMeetingApi.getLive(),
    { refetchInterval: LIVE_MEETINGS_REFRESH_MS },
  );
};

export const useLiveMeetingToken = (meetingId: string) => {
  return useAsyncQuery<LiveMeetingToken>(
    liveMeetingKeys.token(meetingId),
    () => liveMeetingApi.getToken(meetingId),
    { enabled: !!meetingId },
  );
};