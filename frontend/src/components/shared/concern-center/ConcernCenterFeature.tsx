"use client";

import * as React from "react";
import { useState } from "react";
import { Send, MessageSquare, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type {
  ConcernCategoryItem,
  ConcernItem,
  SubmitConcernRequest,
} from "@/api/student/concern.api";

/**
 * Reusable Concern Center UI. This component is deliberately role-agnostic:
 * it never imports anything from a student/educator/admin-specific path.
 * All data and behavior are supplied via props, so a future educator mount
 * (or any other role) can reuse it unchanged — only the wiring at the mount
 * site differs.
 */
export interface ConcernCenterFeatureProps {
  categories: ConcernCategoryItem[];
  categoriesLoading?: boolean;
  myConcerns: ConcernItem[];
  myConcernsLoading?: boolean;
  thread: ConcernItem | undefined;
  threadLoading?: boolean;
  onSubmit: (payload: SubmitConcernRequest) => Promise<void> | void;
  onSelect: (concernId: string) => void;
  onReply: (concernId: string, body: string) => Promise<void> | void;
  submitting?: boolean;
  replying?: boolean;
}

function concernTime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}

export function ConcernCenterFeature({
  categories,
  categoriesLoading,
  myConcerns,
  myConcernsLoading,
  thread,
  threadLoading,
  onSubmit,
  onSelect,
  onReply,
  submitting,
  replying,
}: ConcernCenterFeatureProps) {
  const [mode, setMode] = useState<"submit" | "list">("submit");

  // Submit form state
  const [categoryId, setCategoryId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Reply state
  const [replyBody, setReplyBody] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !subject.trim() || !body.trim()) return;
    await onSubmit({ categoryId, subject: subject.trim(), body: body.trim() });
    setSubject("");
    setBody("");
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thread || !replyBody.trim()) return;
    await onReply(thread.id, replyBody.trim());
    setReplyBody("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Concern Center"
        description="Report an account, grade, or technical problem and track replies."
      />

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "submit" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("submit")}
        >
          Submit a Concern
        </Button>
        <Button
          variant={mode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("list")}
        >
          My Concerns
        </Button>
      </div>

      {mode === "submit" && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-card p-5 space-y-4 max-w-2xl"
        >
          <div className="space-y-1.5">
            <Label htmlFor="concern-category">Category</Label>
            <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)} required>
              <SelectTrigger id="concern-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesLoading ? (
                  <SelectItem value="__loading__" disabled>
                    Loading…
                  </SelectItem>
                ) : (
                  categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="concern-subject">Subject</Label>
            <Input
              id="concern-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="concern-body">Message</Label>
            <Textarea
              id="concern-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Describe the problem in detail"
              required
            />
          </div>

          <Button type="submit" disabled={submitting} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </form>
      )}

      {mode === "list" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Concerns list */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">My Concerns</h2>

            {myConcernsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : myConcerns.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No concerns yet"
                description="Submit a concern and it will appear here."
                action={{
                  label: "Submit a concern",
                  onClick: () => setMode("submit"),
                }}
              />
            ) : (
              <div className="space-y-2">
                {myConcerns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    className="w-full text-left rounded-lg border bg-card p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {c.subject}
                        </span>
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      {c.category?.label && (
                        <Badge variant="outline" className="font-normal">
                          {c.category.label}
                        </Badge>
                      )}
                      <span>{concernTime(c.last_message_at)}</span>
                      {typeof c._count?.messages === "number" && (
                        <span className="ml-auto">
                          {c._count.messages}{" "}
                          {c._count.messages === 1 ? "message" : "messages"}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Thread view */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Thread</h2>

            {threadLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : thread ? (
              <div className="rounded-lg border bg-card p-5 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">{thread.subject}</h3>
                    <StatusBadge status={thread.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {thread.category?.label && (
                      <Badge variant="outline" className="font-normal">
                        {thread.category.label}
                      </Badge>
                    )}
                    <span>Opened {concernTime(thread.created_at)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {thread.messages?.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">
                          {m.sender_name || "Unknown"}
                        </span>
                        <span className="text-muted-foreground">
                          {concernTime(m.created_at)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleReply} className="space-y-2 pt-2">
                  <Label htmlFor="reply-body">Reply</Label>
                  <Textarea
                    id="reply-body"
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={3}
                    placeholder="Write your reply…"
                    required
                  />
                  <Button type="submit" disabled={replying} className="gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    {replying ? "Sending…" : "Send reply"}
                  </Button>
                </form>
              </div>
            ) : (
              <EmptyState
                icon={LifeBuoy}
                title="Select a concern"
                description="Choose one of your concerns to view the full thread."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}