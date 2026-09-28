"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  notificationApi,
  type Notification as ApiNotification,
} from "@/api/student/notification.api";
import {
  useNotificationStore,
  type Notification,
  type NotificationType,
} from "@/store/notification.store";
import { useAuthStore } from "@/store/auth.store";

/** No websocket for notifications yet, so poll. Also refetches on window focus. */
const POLL_MS = 30_000;
const LIST_LIMIT = 20;

const KEYS = {
  all: ["notifications"] as const,
  list: ["notifications", "list"] as const,
  summary: ["notifications", "summary"] as const,
};

// ─── Mapping (server row → what the bell renders) ─────────────────────────────

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function humanize(type: string): string {
  const spaced = type.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function toStoreNotification(n: ApiNotification): Notification {
  const p = n.payload ?? {};
  let message: string;
  let linkTo: string | null = str(p.linkTo);

  switch (n.type) {
    case "concern_created": {
      const who = str(p.studentName) ?? "A student";
      const subject = str(p.subject);
      message = subject
        ? `${who} sent a concern: ${truncate(subject, 60)}`
        : `${who} sent a concern`;
      const concernId = str(p.concernId);
      // Older notifications have no concernId — fall back to the list page.
      linkTo = concernId
        ? `/admin/concerns?concernId=${concernId}`
        : "/admin/concerns";
      break;
    }
    case "concern_reply": {
      const who = str(p.studentName) ?? "A student";
      message = `${who} replied to a concern`;
      const concernId = str(p.concernId);
      linkTo = concernId
        ? `/admin/concerns?concernId=${concernId}`
        : "/admin/concerns";
      break;
    }
    case "application_submitted": {
      const who = str(p.applicantName) ?? "An applicant";
      const code = str(p.applicationCode);
      message = code
        ? `${who} submitted an enrollment application (${code})`
        : `${who} submitted an enrollment application`;
      const applicationId = str(p.applicationId);
      linkTo = applicationId
        ? `/admin/enrollment-portal/applications/${applicationId}`
        : "/admin/enrollment-portal/applications";
      break;
    }
    default:
      message = str(p.message) ?? humanize(n.type);
  }

  return {
    id: n.id,
    type: n.type as NotificationType,
    message,
    isRead: n.isRead,
    createdAt: n.createdAt,
    linkTo,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Total unread + per-type unread. Drives the red badge and grouped rows. */
export function useNotificationSummary() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: KEYS.summary,
    queryFn: () => notificationApi.getSummary(),
    enabled: !!token,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
}

/** Recent notifications; mirrored into the zustand store the bell reads. */
export function useNotificationFeed() {
  const token = useAuthStore((s) => s.accessToken);
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  const query = useQuery({
    queryKey: KEYS.list,
    queryFn: async () => (await notificationApi.getAll(undefined, 1, LIST_LIMIT)).data,
    enabled: !!token,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (query.data) setNotifications(query.data.map(toStoreNotification));
  }, [query.data, setNotifications]);

  return query;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const markRead = useNotificationStore((s) => s.markRead);

  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onMutate: (id) => markRead(id), // optimistic: un-highlight immediately
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onMutate: () => markAllRead(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEYS.all }),
  });
}