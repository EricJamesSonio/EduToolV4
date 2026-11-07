"use client";

import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/config/api.config";
import { useAuthStore } from "@/store/auth.store";
import { refreshAccessToken } from "@/api/client";
import { queryKeys } from "@/hooks/queryKeys.factory";

interface StreamEvent {
  type: string;
  payload: Record<string, unknown>;
}

const MAX_RETRY_MS = 30_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function invalidateAll(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.student.assessments.all,
  });
  void queryClient.invalidateQueries({ queryKey: queryKeys.student.grades.all });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.educator.submissions.all,
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.educator.assessments.all,
  });
}

function invalidateForEvent(queryClient: QueryClient, type: string): void {
  void queryClient.invalidateQueries({ queryKey: ["notifications"] });

  switch (type) {
    case "assessment_released":
    case "assessment_assigned":
    case "assessment_reopened":
      void queryClient.invalidateQueries({
        queryKey: queryKeys.student.assessments.all,
      });
      break;
    case "score_published":
    case "essay_graded":
      void queryClient.invalidateQueries({
        queryKey: queryKeys.student.assessments.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.student.grades.all,
      });
      break;
    case "grade_locked":
    case "grade_unlocked":
      void queryClient.invalidateQueries({
        queryKey: queryKeys.student.grades.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.student.gradeLock.all,
      });
      break;
    case "assessment_submitted":
      void queryClient.invalidateQueries({
        queryKey: queryKeys.educator.submissions.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.educator.assessments.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.educator.attendance.all,
      });
      break;
    default:
      break;
  }
}

async function readStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const data = block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n");

      if (data) {
        try {
          onEvent(JSON.parse(data) as StreamEvent);
        } catch {
          // ignore malformed frames
        }
      }

      boundary = buffer.indexOf("\n\n");
    }
  }
}

/**
 * Keeps one SSE connection open to /notifications/stream while signed in and
 * invalidates the affected react-query caches the instant an event arrives.
 */
export function useNotificationStream(): void {
  const queryClient = useQueryClient();
  const hasToken = useAuthStore((s) => !!s.accessToken);

  useEffect(() => {
    if (!hasToken) return;

    const controller = new AbortController();
    let stopped = false;
    let retryMs = 1000;

    const run = async (): Promise<void> => {
      while (!stopped) {
        try {
          const token = useAuthStore.getState().accessToken;
          const response = await fetch(`${API_BASE_URL}/notifications/stream`, {
            headers: {
              Authorization: `Bearer ${token ?? ""}`,
              Accept: "text/event-stream",
            },
            credentials: "include",
            signal: controller.signal,
          });

          if (response.status === 401) {
            await refreshAccessToken().catch(() => undefined);
            throw new Error("Unauthorized");
          }
          if (!response.ok || !response.body) {
            throw new Error(`Stream failed: ${response.status}`);
          }

          retryMs = 1000;
          // Catch up on anything missed while disconnected.
          invalidateAll(queryClient);

          await readStream(response.body, (event) =>
            invalidateForEvent(queryClient, event.type),
          );
        } catch {
          if (stopped) return;
        }

        if (stopped) return;
        await sleep(retryMs);
        retryMs = Math.min(retryMs * 2, MAX_RETRY_MS);
      }
    };

    void run();

    return () => {
      stopped = true;
      controller.abort();
    };
  }, [hasToken, queryClient]);
}