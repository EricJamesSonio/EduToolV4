import { create } from "zustand";

export type NotificationType =
  | "assessment_released"
  | "grade_locked"
  | "grade_unlocked"
  | "meeting_created"
  | "meeting_starting"
  | "join_request"
  | "join_accepted"
  | "join_declined"
  | "enrollment_added"
  | "enrollment_removed"
  | "concept_extraction_done"
  | "assessment_generated"
  | "general";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  /** Optional deep-link target (e.g. "/student/classes/[id]/assessments") */
  linkTo: string | null;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

interface NotificationActions {
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAllRead: () => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()((set) => ({
  // ─── State ─────────────────────────────────────────────────────────────────
  notifications: [],
  unreadCount: 0,

  // ─── Actions ───────────────────────────────────────────────────────────────
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead
        ? state.unreadCount
        : state.unreadCount + 1,
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  dismissNotification: (id) =>
    set((state) => {
      const target = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount:
          target && !target.isRead
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
      };
    }),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));