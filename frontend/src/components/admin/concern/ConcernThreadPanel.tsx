// ===== File: frontend\src\components\admin\concern\ConcernThreadPanel.tsx =====
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, LifeBuoy, RotateCcw, Send, UserRound } from "lucide-react";
import type { AxiosError } from "axios";

import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useStaffConcernThread,
  useStaffReplyToConcern,
  useResolveConcern,
  useReopenConcern,
} from "@/hooks/admin/useConcerns";

type ConcernThread = NonNullable<ReturnType<typeof useStaffConcernThread>["data"]>;

function toErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ message: string }>;
  return axiosErr?.response?.data?.message ?? "Something went wrong.";
}

function lastActivity(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}

interface ConcernThreadPanelProps {
  thread: ConcernThread | undefined;
  isLoading: boolean;
  selectedId: string | undefined;
  currentUserId: string | undefined;
  onOpenStudentDetails: () => void;
}

export function ConcernThreadPanel({
  thread,
  isLoading,
  selectedId,
  currentUserId,
  onOpenStudentDetails,
}: ConcernThreadPanelProps): React.ReactElement {
  const replyMutation = useStaffReplyToConcern();
  const resolveMutation = useResolveConcern();
  const reopenMutation = useReopenConcern();
  const [replyBody, setReplyBody] = useState("");

  const resolved = thread?.status === "resolved";

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !replyBody.trim()) return;
    try {
      await replyMutation.mutateAsync({ concernId: selectedId, body: replyBody.trim() });
      toast.success("Reply sent");
      setReplyBody("");
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  };

  const handleResolve = async () => {
    if (!selectedId) return;
    try {
      await resolveMutation.mutateAsync(selectedId);
      toast.success("Concern resolved");
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  };

  const handleReopen = async () => {
    if (!selectedId) return;
    try {
      await reopenMutation.mutateAsync(selectedId);
      toast.success("Concern reopened");
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  };

  if (isLoading && selectedId) {
    return (
      <div className="h-fit rounded-lg border bg-card">
        <div className="space-y-3 p-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="h-fit rounded-lg border bg-card">
        <EmptyState
          icon={LifeBuoy}
          title="Select a concern"
          description="Choose a concern from the list to view the full thread and reply."
          className="py-16"
        />
      </div>
    );
  }

  return (
    <div className="h-fit rounded-lg border bg-card">
      <div className="flex h-full flex-col">
        <div className="border-b p-5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <h3 className="text-base font-semibold leading-snug">{thread.subject}</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {thread.category?.label && (
                  <Badge variant="outline" className="font-normal">
                    {thread.category.label}
                  </Badge>
                )}
                <StatusBadge status={thread.status} />
                <span>Opened {lastActivity(thread.created_at)}</span>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              {thread.sender_role === "student" && (
                <Button size="sm" variant="outline" onClick={onOpenStudentDetails}>
                  <UserRound className="mr-1.5 h-3.5 w-3.5" />
                  Student Details
                </Button>
              )}
              {resolved ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReopen}
                  disabled={reopenMutation.isPending}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Reopen
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResolve}
                  disabled={resolveMutation.isPending}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Resolve
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {thread.messages?.map((m) => (
            <div key={m.id} className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  {m.sender_account_id === currentUserId
                    ? "You"
                    : `${
                        m.sender_role === "student"
                          ? "Student"
                          : m.sender_role === "educator"
                            ? "Educator"
                            : m.sender_role === "admin"
                              ? "Admin"
                              : m.sender_role
                      }: ${m.sender_name || "Unknown"}`}
                </span>
                <span className="text-muted-foreground">{lastActivity(m.created_at)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{m.body}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleReply} className="space-y-2 border-t p-5">
          <Label htmlFor="staff-reply-body">Reply</Label>
          <Textarea
            id="staff-reply-body"
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={3}
            placeholder="Write your reply to the sender…"
            required
          />
          <Button type="submit" disabled={replyMutation.isPending} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {replyMutation.isPending ? "Sending…" : "Send reply"}
          </Button>
        </form>
      </div>
    </div>
  );
}