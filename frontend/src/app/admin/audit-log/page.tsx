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

import { useAuditLogs } from "@/hooks/admin/useAuditLog";
import type { AuditLog } from "@/types/admin/audit-log.types";
import type { GetAuditLogQuery } from "@/api/admin/audit-log.api";

// ─── constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Actions" },
  { value: "student_profile_changed", label: "Student Profile Changed" },
  { value: "student_status_changed", label: "Student Status Changed" },
  { value: "enrollment_created", label: "Enrollment Created" },
  { value: "enrollment_removed", label: "Enrollment Removed" },
  { value: "password_reset", label: "Password Reset" },
  { value: "class_reassigned", label: "Class Reassigned" },
  { value: "grade_lock_override", label: "Grade Lock Override" },
  { value: "section_capacity_overflow", label: "Section Capacity Overflow" },
  { value: "class_capacity_overflow", label: "Class Capacity Overflow" },
  { value: "academic_calendar_changed", label: "Academic Calendar Changed" },
  { value: "GRADE_LOCK", label: "Grade Lock" },
  { value: "GRADE_UNLOCK_OVERRIDE", label: "Grade Unlock Override" },
  { value: "AUTO_GRADE_LOCK", label: "Auto Grade Lock" },
];

const ENTITY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Entity Types" },
  { value: "CLASS", label: "Class" },
  { value: "student", label: "Student" },
  { value: "enrollment", label: "Enrollment" },
  { value: "class", label: "Class (activity)" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function actionBadgeVariant(
  action: string
): "default" | "destructive" | "secondary" | "outline" {
  if (action.toLowerCase().includes("unlock") || action.toLowerCase().includes("override"))
    return "destructive";
  if (action.toLowerCase().includes("lock")) return "outline";
  if (action.toLowerCase().includes("created") || action.toLowerCase().includes("started"))
    return "default";
  if (action.toLowerCase().includes("removed") || action.toLowerCase().includes("deleted"))
    return "destructive";
  return "secondary";
}

function formatActionLabel(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function exportToCsv(logs: AuditLog[]) {
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
  a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── ExpandableMetadata ────────────────────────────────────────────────────────

function ExpandableMetadata({ metadata }: { metadata: Record<string, unknown> | null }): React.ReactElement | null {
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  // ── filter state ───────────────────────────────────────────────────────────
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [action, setAction] = useState("all");
  const [entityType, setEntityType] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Build query — only send non-empty values
  const query = useMemo<GetAuditLogQuery>(() => ({
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(action && action !== "all" ? { action } : {}),
    ...(entityType && entityType !== "all" ? { entityType } : {}),
    // search maps to actorId or entityId heuristically
    ...(search
      ? search.startsWith("cls_") || search.length === 36
        ? { entityId: search }
        : { actorId: search }
      : {}),
  }), [from, to, action, entityType, search]);

  const { data: allLogs, isLoading } = useAuditLogs(query);

  const logs = useMemo(() => Array.isArray(allLogs) ? allLogs : [], [allLogs]);

  // ── client-side pagination ─────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const paginated = useMemo(
    () => logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [logs, page]
  );

  const clearFilters = useCallback(() => {
    setFrom("");
    setTo("");
    setAction("all");
    setEntityType("all");
    setSearch("");
    setPage(1);
  }, []);

  const hasActiveFilters = from || to || (action && action !== "all") || (entityType && entityType !== "all") || search;

  // ── columns ────────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
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
        cell: ({ row }) => {
          const id = row.original.actorId;
          const isSystem = id === "system";
          return (
            <div className="flex items-center gap-2">
              {isSystem ? (
                <Badge variant="outline" className="font-mono text-xs">
                  system
                </Badge>
              ) : (
                <span className="font-mono text-xs truncate max-w-30" title={id}>
                  {id.length > 12 ? `${id.slice(0, 8)}…` : id}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "action",
        header: "Action Type",
        cell: ({ row }) => {
          const act = row.original.action;
          return (
            <Badge variant={actionBadgeVariant(act)} className="text-xs whitespace-nowrap">
              {formatActionLabel(act)}
            </Badge>
          );
        },
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
        cell: ({ row }) => (
          <ExpandableMetadata metadata={row.original.metadata} />
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <PageHeader
        title="Audit Log"
        description="System-wide record of administrative actions and changes."
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => exportToCsv(logs)}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
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
          {/* From date */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">From</label>
            <Input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            />
          </div>

          {/* To date */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
            />
          </div>

          {/* Action type */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Action Type</label>
            <Select value={action} onValueChange={(v: string | null) => { setAction(v ?? "all"); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity type */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Entity Type</label>
            <Select value={entityType} onValueChange={(v: string | null) => { setEntityType(v ?? "all"); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Actor / Entity ID
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Result count */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, logs.length)}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{logs.length}</span>{" "}
          {logs.length === 1 ? "entry" : "entries"}
        </p>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginated}
        isLoading={isLoading}
        emptyTitle="No audit logs found"
        emptyDescription="No entries match the current filters. Try adjusting your date range or action type."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>

            {/* Page number pills — show at most 5 around current */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 1
              )
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setPage(item as number)}
                  >
                    {item}
                  </Button>
                )
              )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}