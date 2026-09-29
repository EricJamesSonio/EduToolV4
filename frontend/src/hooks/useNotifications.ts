"use client";

import { useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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

function currentRole(): string | null {
  return useAuthStore.getState().user?.role ?? null;
}

/** Student assessment page, or the result page when scores are involved. */
function studentAssessmentLink(
  p: Record<string, unknown>,
  toResult: boolean,
): string | null {
  const classId = str(p.classId);
  const assessmentId = str(p.assessmentId);
  if (!classId || !assessmentId) return null;
  if (currentRole() === "educator") {
    return `/educator/classes/${classId}/assessments/${assessmentId}`;
  }
  const base = `/student/classes/${classId}/assessments/${assessmentId}`;
  return toResult ? `${base}/result` : base;
}

/** Educator submissions view for a finished submission (deep-links to the
 * review page when the submission id is present). */
function educatorSubmissionLink(p: Record<string, unknown>): string | null {
  const classId = str(p.classId);
  const assessmentId = str(p.assessmentId);
  if (!classId || !assessmentId) return null;
  if (currentRole() === "student") {
    return `/student/classes/${classId}/assessments/${assessmentId}`;
  }
  const base = `/educator/classes/${classId}/assessments/${assessmentId}/submissions`;
  const submissionId = str(p.submissionId);
  return submissionId ? `${base}/${submissionId}/review` : base;
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
    // ─── Assessments & grades (role-aware deep links) ──────────────────────
    case "assessment_released":
    case "assessment_assigned":
    case "assessment_reopened": {
      const title = str(p.title);
      const verb =
        n.type === "assessment_reopened"
          ? "reopened"
          : n.type === "assessment_assigned"
            ? "assigned to you"
            : "released";
      message = title
        ? `New assessment ${verb}: ${truncate(title, 60)}`
        : `An assessment was ${verb}`;
      linkTo = studentAssessmentLink(p, false);
      break;
    }
    case "score_published":
    case "essay_graded": {
      const title = str(p.title);
      message =
        n.type === "essay_graded"
          ? title
            ? `Your essay in ${truncate(title, 50)} was graded`
            : "Your essay was graded"
          : title
            ? `Scores published for ${truncate(title, 50)}`
            : "Assessment scores were published";
      linkTo = studentAssessmentLink(p, true);
      break;
    }
    case "grade_locked": {
      message = "Your final grades were released";
      const classId = str(p.classId);
      linkTo = classId ? `/student/classes/${classId}/grades` : null;
      break;
    }
    case "assessment_submitted": {
      const who = str(p.studentName) ?? "A student";
      const title = str(p.title);
      message = title
        ? `${who} submitted ${truncate(title, 50)}`
        : `${who} submitted an assessment`;
      linkTo = educatorSubmissionLink(p);
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
/** Paginated notifications; flattened into the zustand store the bell reads. */
export function useNotificationFeed() {
  const token = useAuthStore((s) => s.accessToken);
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  const query = useInfiniteQuery({
    queryKey: KEYS.list,
    queryFn: ({ pageParam }) =>
      notificationApi.getAll(undefined, pageParam, LIST_LIMIT),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: !!token,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!query.data) return;
    // Dedupe by id: new arrivals shift page boundaries during a refetch.
    const byId = new Map<string, Notification>();
    for (const page of query.data.pages) {
      for (const n of page.data) byId.set(n.id, toStoreNotification(n));
    }
    setNotifications([...byId.values()]);
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