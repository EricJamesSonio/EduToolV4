export type GroupyMessageType = "text" | "gif" | "sticker" | "poll" | "system";

export type GroupyReactionType = "like" | "love" | "laugh" | "wow" | "sad";

export interface GroupyReaction {
  id: string;
  org_id: string;
  message_id: string;
  account_id: string;
  reaction_type: GroupyReactionType;
  created_at: string;
}

export interface GroupyMessage {
  id: string;
  org_id: string;
  class_id: string;
  sender_account_id: string;
  sender_role: string;
  sender_name: string;
  sender_profile_image: string | null;
  type: GroupyMessageType;
  body: string | null;
  gif_url: string | null;
  sticker_id: string | null;
  poll_id: string | null;
  created_at: string;
  reactions: GroupyReaction[];
}

// A chat member (educator + active students) with the profile fields needed to
// render avatars, plus their last-read pointer for the "seen by" row.
export interface GroupyMember {
  account_id: string;
  role: "educator" | "student";
  full_name: string | null;
  profile_image: string | null;
  last_read_message_id: string | null;
}

export interface GroupyMembersResponse {
  me: GroupyMember | null;
  members: GroupyMember[];
}

export interface GroupyUnreadStatus {
  hasUnread: boolean;
}

export interface GroupyActiveMeetingInfo {
  meetingId: string;
  title: string;
}

export interface GroupyActiveMeeting {
  meeting: GroupyActiveMeetingInfo | null;
}

export interface GroupyMessagesPage {
  messages: GroupyMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SystemMessagePayload {
  meetingId?: string;
  title?: string;
}

export interface PollResultSummaryOption {
  id: string;
  label: string;
  votes: number;
}

export interface PollResultsSummary {
  options: PollResultSummaryOption[];
  totalVotes: number;
}

export interface GroupyPollDetail {
  id: string;
  class_id: string;
  question: string;
  closes_at: string | null;
  is_closed: boolean;
  isClosed: boolean;
  created_by: string;
  totalVotes: number;
  options: {
    id: string;
    label: string;
    order_index: number;
    voteCount: number;
  }[];
  myVoteOptionId: string | null;
}

export interface GifSearchResult {
  id: string;
  previewUrl: string | null;
  url: string;
}
