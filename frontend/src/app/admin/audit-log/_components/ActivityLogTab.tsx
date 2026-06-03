"use client";

import { useState, useMemo, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Filter, X, Search, Download } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/DataTable";

import { useActivityLogs } from "@/hooks/admin/useAuditLog";
import { useEducators } from "@/hooks/admin/useEducators";
import { useClasses } from "@/hooks/admin/useClasses";
import type { ActivityLog } from "@/types/admin/audit-log.types";
import type { GetActivityLogQuery } from "@/api/admin/audit-log.api";

import { PAGE_SIZE, ACTIVITY_ACTION_OPTIONS } from "./constants";
import { actionBadgeVariant, formatActionLabel, safeFormatDate, exportToCsv } from "./utils";
import { ActorCell } from "./ActorCell";
import { ExpandableMetadata } from "./ExpandableMetadata";
import { PaginationBar } from "./PaginationBar";

export function ActivityLogTab() {
  const [from, setFrom]       = useState("");
  const [to, setTo]           = useState("");
  const [action, setAction]   = useState("all");
  const [classId, setClassId] = useState("");
  const [page, setPage]       = useState(1);

  const { data: educators } = useEducators();
  const { data: classes }   = useClasses();

  const educatorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (educators) for (const e of educators) map.set(e.id, e.fullName);
    return map;
  }, [educators]);

  const classMap = useMemo(() => {
    const map = new Map<string, string>();
    if (classes) for (const c of classes) map.set(c.id, c.title ?? c.subjectName ?? c.id);
    return map;
  }, [classes]);

  const query = useMemo<GetActivityLogQuery>(() => ({
    ...(from    ? { from }    : {}),
    ...(to      ? { to }      : {}),
    ...(classId ? { classId } : {}),
  }), [from, to, classId]);

  const { data: raw, isLoading } = useActivityLogs(query);

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
          {safeFormatDate(row.original.createdAt, "MMM d, yyyy")}
          <br />
          {safeFormatDate(row.original.createdAt, "h:mm:ss a")}
        </span>
      ),
    },
    {
      accessorKey: "actorId",
      header: "Educator",
      cell: ({ row }) => <ActorCell actorId={row.original.actorId} educatorMap={educatorMap} />,
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
      header: "Class",
      cell: ({ row }) => {
        const name = classMap.get(row.original.entityId) ?? null;
        return name ? (
          <span className="text-sm truncate max-w-[160px] block" title={row.original.entityId}>{name}</span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px] block" title={row.original.entityId}>{row.original.entityId}</span>
        );
      },
    },
    {
      accessorKey: "metadata",
      header: "Details",
      cell: ({ row }) => <ExpandableMetadata metadata={row.original.metadata} />,
    },
  ], [educatorMap, classMap]);

  return (
    <div className="space-y-4">
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
          variant="outline" size="sm" className="gap-2"
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
