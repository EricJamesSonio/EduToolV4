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

import { useAuditLogs } from "@/hooks/admin/useAuditLog";
import { useEducators } from "@/hooks/admin/useEducators";
import { useClasses } from "@/hooks/admin/useClasses";
import type { AuditLog } from "@/types/admin/audit-log.types";
import type { GetAuditLogQuery } from "@/api/admin/audit-log.api";

import { PAGE_SIZE, ADMIN_ACTION_OPTIONS } from "./constants";
import { actionBadgeVariant, formatActionLabel, safeFormatDate, exportToCsv } from "./utils";
import { ActorCell } from "./ActorCell";
import { ExpandableMetadata } from "./ExpandableMetadata";
import { PaginationBar } from "./PaginationBar";

export function AuditLogTab() {
  const [from, setFrom]               = useState("");
  const [to, setTo]                   = useState("");
  const [action, setAction]           = useState("all");
  const [entityType, setEntityType]   = useState("all");
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);

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
          {safeFormatDate(row.original.createdAt, "MMM d, yyyy")}
          <br />
          {safeFormatDate(row.original.createdAt, "h:mm:ss a")}
        </span>
      ),
    },
    {
      accessorKey: "actorId",
      header: "Actor",
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
      id: "target",
      header: "Target",
      cell: ({ row }) => {
        const entityId = row.original.entityId ?? "unknown";
        const entityType = row.original.entityType ?? "unknown";
        const entityName = entityType.toLowerCase() === "class"
          ? classMap.get(entityId) ?? null
          : null;

        return (
          <div className="space-y-0.5">
            <p className="text-xs font-medium capitalize">{entityType}</p>
            {entityName ? (
              <p className="text-sm truncate max-w-[160px]" title={entityId}>{entityName}</p>
            ) : (
              <p className="font-mono text-xs text-muted-foreground truncate max-w-[160px]" title={entityId}>{entityId}</p>
            )}
          </div>
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
