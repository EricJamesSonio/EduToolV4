"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  Download,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Filter,
  ShieldAlert,
  Activity,
} from "lucide-react";

import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuditLogs, useActivityLogs } from "@/hooks/admin/useAuditLog";
import type { AuditLog, ActivityLog } from "@/types/admin/audit-log.types";
import type { GetAuditLogQuery, GetActivityLogQuery } from "@/api/admin/audit-log.api";

// ─── constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// Exact values from AdminActionType union in audit-log.types.ts
const ADMIN_ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "all",                        label: "All Actions" },
  { value: "student_profile_changed",    label: "Student Profile Changed" },
  { value: "student_status_changed",     label: "Student Status Changed" },
  { value: "enrollment_created",         label: "Enrollment Created" },
  { value: "enrollment_removed",         label: "Enrollment Removed" },
  { value: "password_reset",             label: "Password Reset" },
  { value: "class_reassigned",           label: "Class Reassigned" },
  { value: "grade_lock_override",        label: "Grade Lock Override" },
  { value: "section_capacity_overflow",  label: "Section Capacity Overflow" },
  { value: "class_capacity_overflow",    label: "Class Capacity Overflow" },
  { value: "academic_calendar_changed",  label: "Academic Calendar Changed" },
  { value: "GRADE_LOCK",                 label: "Grade Lock" },
  { value: "GRADE_UNLOCK_OVERRIDE",      label: "Grade Unlock Override" },
  { value: "AUTO_GRADE_LOCK",            label: "Auto Grade Lock" },
];

// Exact values from EducatorActivityType union in audit-log.types.ts
const ACTIVITY_ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "all",                           label: "All Actions" },
  { value: "enrollment_created",            label: "Enrollment Created" },
  { value: "enrollment_removed",            label: "Enrollment Removed" },
  { value: "meeting_started",               label: "Meeting Started" },
  { value: "meeting_ended",                 label: "Meeting Ended" },
  { value: "assessment_created",            label: "Assessment Created" },
  { value: "assessment_edited",             label: "Assessment Edited" },
  { value: "assessment_published",          label: "Assessment Published" },
  { value: "assessment_deleted",            label: "Assessment Deleted" },
  { value: "score_published",               label: "Score Published" },
  { value: "score_unpublished",             label: "Score Unpublished" },
  { value: "grade_locked",                  label: "Grade Locked" },
  { value: "lesson_created",                label: "Lesson Created" },
  { value: "lesson_updated",                label: "Lesson Updated" },
  { value: "concept_extraction_requested",  label: "Concept Extraction Requested" },
  { value: "concept_extraction_completed",  label: "Concept Extraction Completed" },
  { value: "class_reassigned",              label: "Class Reassigned" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function actionBadgeVariant(
  action: string
): "default" | "destructive" | "secondary" | "outline" {
  const a = action.toLowerCase();
  if (a.includes("unlock") || a.includes("override") || a.includes("deleted") || a.includes("removed"))
    return "destructive";
  if (a.includes("lock"))
    return "outline";
  if (a.includes("created") || a.includes("started") || a.includes("published") || a.includes("completed"))
    return "default";
  return "secondary";
}

function formatActionLabel(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function exportToCsv(logs: (AuditLog | ActivityLog)[], filename: string) {
  const headers = ["Timestamp", "Actor ID", "Action", "Entity Type", "Entity ID", "Metadata"];
  const rows = logs.map((l) => [
    format(new Date(l.createdAt), "yyyy-MM-dd HH:mm:ss"),
    l.actorId,
    l.action,
    l.entityType,
    l.entityId,
    l.metadata ? JSON.stringify(l.metadata) : "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── ExpandableMetadata ────────────────────────────────────────────────────────

function ExpandableMetadata({
  metadata,
}: {
  metadata: Record<string, unknown> | null;
}): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const preview = Object.entries(metadata)
    .slice(0, 2)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");

  return (
    <div className="space-y-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((p) => !p);
        }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {expanded ? "Hide details" : preview}
      </button>
      {expanded && (
        <pre className="rounded bg-muted px-2 py-1.5 text-xs leading-relaxed whitespace-pre-wrap break-all max-w-xs">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ─── Shared actor cell ─────────────────────────────────────────────────────────

function ActorCell({ actorId }: { actorId: string }) {
  const isSystem = actorId === "system";
  return isSystem ? (
    <Badge variant="outline" className="font-mono text-xs">
      system
    </Badge>
  ) : (
    <span
      className="font-mono text-xs truncate max-w-[120px] block"
      title={actorId}
    >
      {actorId.length > 12 ? `${actorId.slice(0, 8)}…` : actorId}
    </span>
  );
}

// ─── Audit Log tab ─────────────────────────────────────────────────────────────

function AuditLogTab() {
  const [from, setFrom]               = useState("");
  const [to, setTo]                   = useState("");
  const [action, setAction]           = useState("all");
  const [entityType, setEntityType]   = useState("all");
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);

  const query = useMemo<GetAuditLogQuery>(() => ({
    ...(from ? { from } : {}),
    ...(to   ? { to }   : {}),
    ...(action     && action     !== "all" ? { action }     : {}),
    ...(entityType && entityType !== "all" ? { entityType } : {}),
    ...(search
      ? search.length === 36
        ? { entityId: search }
        : { actorId: search }
      : {}),
  }), [from, to, action, entityType, search]);

  const { data: raw, isLoading } = useAuditLogs(query);
  const logs = useMemo(() => (Array.isArray(raw) ? raw : []), [raw]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const paginated  = useMemo(
    () => logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [logs, page],
  );

  const clearFilters = useCallback(() => {
    setFrom(""); setTo(""); setAction("all"); setEntityType("all"); setSearch(""); setPage(1);
  }, []);

  const hasFilters = from || to || action !== "all" || entityType !== "all" || search;

  const columns = useMemo<ColumnDef<AuditLog>[]>(() => [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="tabular-nums text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
          <br />
          {format(new Date(row.original.createdAt), "h:mm:ss a")}
        </span>
      ),
    },
    {
      accessorKey: "actorId",
      header: "Actor",
      cell: ({ row }) => <ActorCell actorId={row.original.actorId} />,
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <Badge variant={actionBadgeVariant(row.original.action)} className="text-xs whitespace-nowrap">
          {formatActionLabel(row.original.action)}
        </Badge>
      ),
    },
    {
      id: "target",
      header: "Target",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="text-xs font-medium capitalize">{row.original.entityType}</p>
          <p
            className="font-mono text-xs text-muted-foreground truncate max-w-[140px]"
            title={row.original.entityId}
          >
            {row.original.entityId.length > 14
              ? `${row.original.entityId.slice(0, 10)}…`
              : row.original.entityId}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "metadata",
      header: "Details",
      cell: ({ row }) => <ExpandableMetadata metadata={row.original.metadata} />,
    },
  ], []);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Action Type</label>
            <Select value={action} onValueChange={(v) => { setAction(v ?? "all"); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="All Actions" /></SelectTrigger>
              <SelectContent>
                {ADMIN_ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Entity Type</label>
            <Input
              placeholder="e.g. student, class"
              value={entityType === "all" ? "" : entityType}
              onChange={(e) => { setEntityType(e.target.value || "all"); setPage(1); }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Actor / Entity ID</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by UUID…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Count + export */}
      <div className="flex items-center justify-between">
        {!isLoading && logs.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, logs.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{logs.length}</span> entries
          </p>
        ) : !isLoading ? (
          <p className="text-sm text-muted-foreground">No entries found</p>
        ) : (
          <span />
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => exportToCsv(logs, "audit-log")}
          disabled={logs.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        isLoading={isLoading}
        emptyTitle="No audit logs found"
        emptyDescription="No entries match the current filters."
      />

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

// ─── Activity Log tab ──────────────────────────────────────────────────────────

function ActivityLogTab() {
  const [from, setFrom]       = useState("");
  const [to, setTo]           = useState("");
  const [action, setAction]   = useState("all");
  const [classId, setClassId] = useState("");
  const [page, setPage]       = useState(1);

  const query = useMemo<GetActivityLogQuery>(() => ({
    ...(from    ? { from }    : {}),
    ...(to      ? { to }      : {}),
    ...(classId ? { classId } : {}),
  }), [from, to, classId]);

  const { data: raw, isLoading } = useActivityLogs(query);

  // action filter is client-side only — backend doesn't support it for activity logs
  const logs = useMemo(() => {
    const all = Array.isArray(raw) ? raw : [];
    if (!action || action === "all") return all;
    return all.filter((l) => l.action === action);
  }, [raw, action]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const paginated  = useMemo(
    () => logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [logs, page],
  );

  const clearFilters = useCallback(() => {
    setFrom(""); setTo(""); setAction("all"); setClassId(""); setPage(1);
  }, []);

  const hasFilters = from || to || action !== "all" || classId;

  const columns = useMemo<ColumnDef<ActivityLog>[]>(() => [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="tabular-nums text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
          <br />
          {format(new Date(row.original.createdAt), "h:mm:ss a")}
        </span>
      ),
    },
    {
      accessorKey: "actorId",
      header: "Educator",
      cell: ({ row }) => <ActorCell actorId={row.original.actorId} />,
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <Badge variant={actionBadgeVariant(row.original.action)} className="text-xs whitespace-nowrap">
          {formatActionLabel(row.original.action)}
        </Badge>
      ),
    },
    {
      id: "class",
      header: "Class ID",
      cell: ({ row }) => (
        <span
          className="font-mono text-xs text-muted-foreground truncate max-w-[140px] block"
          title={row.original.entityId}
        >
          {row.original.entityId.length > 14
            ? `${row.original.entityId.slice(0, 10)}…`
            : row.original.entityId}
        </span>
      ),
    },
    {
      accessorKey: "metadata",
      header: "Details",
      cell: ({ row }) => <ExpandableMetadata metadata={row.original.metadata} />,
    },
  ], []);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Action Type</label>
            <Select value={action} onValueChange={(v) => { setAction(v ?? "all"); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="All Actions" /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Class ID</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter by class UUID…"
                value={classId}
                onChange={(e) => { setClassId(e.target.value); setPage(1); }}
                className="pl-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Count + export */}
      <div className="flex items-center justify-between">
        {!isLoading && logs.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, logs.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{logs.length}</span> entries
          </p>
        ) : !isLoading ? (
          <p className="text-sm text-muted-foreground">No entries found</p>
        ) : (
          <span />
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => exportToCsv(logs, "activity-log")}
          disabled={logs.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        isLoading={isLoading}
        emptyTitle="No activity logs found"
        emptyDescription="No entries match the current filters."
      />

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

// ─── Pagination bar (extracted to avoid duplication) ──────────────────────────

function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
          Previous
        </Button>
        {pageNumbers.map((item, idx) =>
          item === "…" ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">…</span>
          ) : (
            <Button
              key={item}
              variant={item === page ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(item as number)}
            >
              {item}
            </Button>
          )
        )}
        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type TabId = "audit" | "activity";

export default function AuditLogPage() {
  const [activeTab, setActiveTab] = useState<TabId>("audit");

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Logs"
        description="Administrative audit trail and per-class educator activity logs."
      />

      {/* Tab switcher */}
      <div className="flex gap-1 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "audit"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Audit Log
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "activity"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="h-4 w-4" />
          Activity Log
        </button>
      </div>

      {activeTab === "audit"    && <AuditLogTab />}
      {activeTab === "activity" && <ActivityLogTab />}
    </div>
  );
}