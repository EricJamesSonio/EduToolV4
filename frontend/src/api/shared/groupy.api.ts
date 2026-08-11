import client from "@/api/client";
import type {
  GifSearchResult,
  GroupyActiveMeeting,
  GroupyMessage,
  GroupyMessagesPage,
  GroupyMembersResponse,
  GroupyPollDetail,
  GroupyReactionType,
  GroupyUnreadStatus,
  PollResultsSummary,
} from "@/types/groupy/groupy.types";

export interface SendTextMessageRequest {
  type: "text";
  body: string;
}

export interface SendGifMessageRequest {
  type: "gif";
  gifUrl: string;
}

export interface SendStickerMessageRequest {
  type: "sticker";
  stickerId: string;
}

export type SendGroupyMessageRequest =
  | SendTextMessageRequest
  | SendGifMessageRequest
  | SendStickerMessageRequest;

export interface StickerMeta {
  id: string;
  label: string;
  assetPath: string;
}

export interface CreatePollRequest {
  question: string;
  options: string[];
}

export interface StartMeetingResponse {
  meetingId: string;
  message: GroupyMessage;
}

export const groupyApi = {
  listMessages: async (
    classId: string,
    cursor?: string,
    limit = 50
  ): Promise<GroupyMessagesPage> => {
    const res = await client.get<{ success: boolean; data: GroupyMessagesPage }>(
      `/groupy/${classId}/messages`,
      { params: { cursor, limit } }
    );
    return res.data.data;
  },

  getMembers: async (classId: string): Promise<GroupyMembersResponse> => {
    const res = await client.get<{ success: boolean; data: GroupyMembersResponse }>(
      `/groupy/${classId}/members`
    );
    return res.data.data;
  },

  getUnreadStatus: async (classId: string): Promise<GroupyUnreadStatus> => {
    const res = await client.get<{ success: boolean; data: GroupyUnreadStatus }>(
      `/groupy/${classId}/status`
    );
    return res.data.data;
  },

  getActiveMeeting: async (classId: string): Promise<GroupyActiveMeeting> => {
    const res = await client.get<{ success: boolean; data: GroupyActiveMeeting }>(
      `/groupy/${classId}/active-meeting`
    );
    return res.data.data;
  },

  reportRead: async (
    classId: string,
    lastMessageId: string
  ): Promise<{ lastReadMessageId: string }> => {
    const res = await client.post<{
      success: boolean;
      data: { lastReadMessageId: string };
    }>(`/groupy/${classId}/read`, { lastMessageId });
    return res.data.data;
  },

  sendMessage: async (
    classId: string,
    payload: SendGroupyMessageRequest
  ): Promise<GroupyMessage> => {
    const res = await client.post<{ success: boolean; data: GroupyMessage }>(
      `/groupy/${classId}/messages`,
      payload
    );
    return res.data.data;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await client.delete(`/groupy/messages/${messageId}`);
  },

  setReaction: async (
    messageId: string,
    reactionType: GroupyReactionType
  ): Promise<void> => {
    await client.put(`/groupy/messages/${messageId}/reaction`, {
      reactionType,
    });
  },

  removeReaction: async (messageId: string): Promise<void> => {
    await client.delete(`/groupy/messages/${messageId}/reaction`);
  },

  getStickers: async (): Promise<StickerMeta[]> => {
    const res = await client.get<{ success: boolean; data: StickerMeta[] }>(
      "/groupy/stickers"
    );
    return res.data.data;
  },

  searchGifs: async (query: string): Promise<GifSearchResult[]> => {
    const res = await client.get<{ success: boolean; data: GifSearchResult[] }>(
      "/groupy/gif-search",
      { params: { q: query } }
    );
    return res.data.data;
  },

  getPollDetail: async (pollId: string): Promise<GroupyPollDetail> => {
    const res = await client.get<{ success: boolean; data: GroupyPollDetail }>(
      `/groupy/polls/${pollId}`
    );
    return res.data.data;
  },

  createPoll: async (
    classId: string,
    payload: CreatePollRequest
  ): Promise<GroupyMessage> => {
    const res = await client.post<{ success: boolean; data: GroupyMessage }>(
      `/groupy/${classId}/polls`,
      payload
    );
    return res.data.data;
  },

  votePoll: async (
    pollId: string,
    optionId: string
  ): Promise<PollResultsSummary> => {
    const res = await client.post<{ success: boolean; data: PollResultsSummary }>(
      `/groupy/polls/${pollId}/vote`,
      { optionId }
    );
    return res.data.data;
  },

  closePoll: async (pollId: string): Promise<void> => {
    await client.patch(`/groupy/polls/${pollId}/close`);
  },

  startMeeting: async (
    classId: string,
    invitedStudentIds?: string[]
  ): Promise<StartMeetingResponse> => {
    const res = await client.post<{ success: boolean; data: StartMeetingResponse }>(
      `/groupy/${classId}/start-meeting`,
      { invitedStudentIds }
    );
    return res.data.data;
  },
};