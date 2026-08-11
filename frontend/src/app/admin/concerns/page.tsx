"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  LifeBuoy,
  Tag,
  Send,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import type { AxiosError } from "axios";

import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryManagerDialog } from "@/components/admin/concern/CategoryManagerDialog";

import {
  useStaffConcerns,
  useStaffConcernThread,
  useStaffReplyToConcern,
  useResolveConcern,
  useReopenConcern,
} from "@/hooks/admin/useConcerns";
import {
  useConcernCategories,
} from "@/hooks/admin/useConcernCategories";

import type {
  StaffConcernRow,
  ListStaffFilters,
  ConcernCategoryItem,
} from "@/api/admin/concern.api";

const DEFAULT_PAGE_SIZE = 20;
const STATUS_OPTIONS = ["all", "open", "resolved"];
const SENDER_ROLE_OPTIONS = ["all", "student", "educator", "admin"];

interface ConcernFilters {
  status: string;
  categoryId: string;
  senderRole: string;
}

const ALL_FILTERS: ConcernFilters = { status: "all", categoryId: "all", senderRole: "all" };

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

export default function AdminConcernsPage(): React.JSX.Element {
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState<ConcernFilters>(ALL_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string>();
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  const request: ListStaffFilters = useMemo(() => {
    return {
      status: filters.status !== "all" ? filters.status : undefined,
      categoryId: filters.categoryId !== "all" ? filters.categoryId : undefined,
      senderRole: filters.senderRole !== "all" ? filters.senderRole : undefined,
      page,
      limit,
    };
  }, [filters, page, limit]);

  const listQuery = useStaffConcerns(request);
  const threadQuery = useStaffConcernThread(selectedId);
  const replyMutation = useStaffReplyToConcern();
  const resolveMutation = useResolveConcern();
  const reopenMutation = useReopenConcern();

  const { data: categories = [], isPending: categoriesLoading } = useConcernCategories();

  const rows = listQuery.data?.data ?? [];
  const total = listQuery.data?.meta?.total ?? 0;
  const totalPages = listQuery.data?.meta?.totalPages ?? 1;
  const thread = threadQuery.data;

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages));
  }, [page, totalPages]);

  const updateFilter = (patch: Partial<ConcernFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const selectFilter = (key: keyof ConcernFilters) => (v: string | null) => {
    updateFilter({ [key]: v ?? "all" } as Partial<ConcernFilters>);
  };

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

  const columns = useMemo<ColumnDef<StaffConcernRow>[]>(
    () => [
      {
        id: "subject",
        header: "Subject",
        cell: ({ row }) => (
          <div className="min-w-0">
            <span className="block truncate font-medium">{row.original.subject}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {row.original.messages?.[0]?.body}
            </span>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.category?.label ?? "—"}
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "senderRole",
        header: "Sender",
        cell: ({ row }) => (
          <span className="capitalize text-sm">{row.original.sender_role}</span>
        ),
      },
      {
        id: "lastActivity",
        header: "Last Activity",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {lastActivity(row.original.last_message_at)}
          </span>
        ),
      },
    ],
    [],
  );

  const resolved = thread?.status === "resolved";

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Concerns"
        description="Review, reply to, and resolve student concerns."
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_concerns" />
            <Button variant="outline" size="sm" onClick={() => setCategoryManagerOpen(true)}>
              <Tag className="mr-1.5 h-4 w-4" />
              Manage Categories
            </Button>
          </div>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filters.status} onValueChange={selectFilter("status")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all" ? "All Statuses" : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.categoryId} onValueChange={selectFilter("categoryId")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
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

        <Select value={filters.senderRole} onValueChange={selectFilter("senderRole")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Senders" />
          </SelectTrigger>
          <SelectContent>
            {SENDER_ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all"
                  ? "All Senders"
                  : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List + thread */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* List */}
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={rows}
            isLoading={listQuery.isPending}
            emptyTitle="No concerns found"
            emptyDescription="Adjust your filters or wait for students to submit concerns."
            onRowClick={(row) => setSelectedId(row.id)}
          />
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
            pageSizeOptions={[20, 50, 100]}
          />
        </div>

        {/* Thread panel */}
        <div className="h-fit rounded-lg border bg-card">
          {threadQuery.isPending && selectedId ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : thread ? (
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
                  <div
                    key={m.id}
                    className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        {m.sender_account_id === currentUser?.id
                          ? "You"
                          : `${m.sender_role === "student"
                              ? "Student"
                              : m.sender_role === "educator"
                                ? "Educator"
                                : m.sender_role === "admin"
                                  ? "Admin"
                                  : m.sender_role}: ${m.sender_name || "Unknown"}`}
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
          ) : (
            <EmptyState
              icon={LifeBuoy}
              title="Select a concern"
              description="Choose a concern from the list to view the full thread and reply."
              className="py-16"
            />
          )}
        </div>
      </div>

      <CategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
      />
    </div>
  );
}

export type { ConcernCategoryItem };