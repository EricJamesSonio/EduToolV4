import { create } from "zustand";

// ─── Supporting types ─────────────────────────────────────────────────────────

export interface Participant {
  uid: string;
  name: string;
  role: "educator" | "student";
  isHandRaised: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  sentAt: string;
}

export interface RemoteStream {
  uid: string;
  /** Agora remote video track — typed as unknown to avoid SDK import at store level */
  videoTrack: unknown | null;
  audioTrack: unknown | null;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface MeetingState {
  meetingId: string | null;
  isConnected: boolean;

  // Participants
  participants: Participant[];

  // Chat
  chatMessages: ChatMessage[];

  // Lesson presentation (educator pushes slide index, all students follow)
  currentSlide: number;
  isPresenting: boolean;

  // Agora streams
  localStream: unknown | null;   // ILocalTrack[]
  remoteStreams: RemoteStream[];

  // UI state
  isChatOpen: boolean;
  isParticipantListOpen: boolean;
}

interface MeetingActions {
  setMeetingId: (id: string | null) => void;
  setConnected: (connected: boolean) => void;

  // Participants
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (uid: string) => void;
  updateParticipant: (uid: string, patch: Partial<Participant>) => void;

  // Chat
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;

  // Presentation
  setSlide: (slide: number) => void;
  setPresenting: (presenting: boolean) => void;

  // Streams
  setLocalStream: (stream: unknown | null) => void;
  addRemoteStream: (stream: RemoteStream) => void;
  removeRemoteStream: (uid: string) => void;

  // UI toggles
  setChatOpen: (open: boolean) => void;
  setParticipantListOpen: (open: boolean) => void;

  // Full reset on room leave / end
  reset: () => void;
}

type MeetingStore = MeetingState & MeetingActions;

const initialState: MeetingState = {
  meetingId: null,
  isConnected: false,
  participants: [],
  chatMessages: [],
  currentSlide: 0,
  isPresenting: false,
  localStream: null,
  remoteStreams: [],
  isChatOpen: false,
  isParticipantListOpen: false,
};

export const useMeetingStore = create<MeetingStore>()((set) => ({
  ...initialState,

  // ─── Meeting session ──────────────────────────────────────────────────────
  setMeetingId: (meetingId) => set({ meetingId }),
  setConnected: (isConnected) => set({ isConnected }),

  // ─── Participants ─────────────────────────────────────────────────────────
  setParticipants: (participants) => set({ participants }),

  addParticipant: (participant) =>
    set((state) => ({
      participants: [
        ...state.participants.filter((p) => p.uid !== participant.uid),
        participant,
      ],
    })),

  removeParticipant: (uid) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.uid !== uid),
    })),

  updateParticipant: (uid, patch) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.uid === uid ? { ...p, ...patch } : p
      ),
    })),

  // ─── Chat ─────────────────────────────────────────────────────────────────
  setMessages: (chatMessages) => set({ chatMessages }),

  addMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),

  // ─── Presentation ─────────────────────────────────────────────────────────
  setSlide: (currentSlide) => set({ currentSlide }),
  setPresenting: (isPresenting) => set({ isPresenting }),

  // ─── Streams ──────────────────────────────────────────────────────────────
  setLocalStream: (localStream) => set({ localStream }),

  addRemoteStream: (stream) =>
    set((state) => ({
      remoteStreams: [
        ...state.remoteStreams.filter((s) => s.uid !== stream.uid),
        stream,
      ],
    })),

  removeRemoteStream: (uid) =>
    set((state) => ({
      remoteStreams: state.remoteStreams.filter((s) => s.uid !== uid),
    })),

  // ─── UI ───────────────────────────────────────────────────────────────────
  setChatOpen: (isChatOpen) => set({ isChatOpen }),
  setParticipantListOpen: (isParticipantListOpen) =>
    set({ isParticipantListOpen }),

  // ─── Reset ────────────────────────────────────────────────────────────────
  reset: () => set(initialState),
}));