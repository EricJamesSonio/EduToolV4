"use client";

import { useState, useMemo } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useActivityLog } from "@/hooks/educator/useActivityLog";
import { useEducatorClasses } from "@/hooks/educator/useEducatorClasses";
import { subjectApi } from "@/api/admin/subject.api";
import { toArray } from "@/utils/classes.utils";
import type { ActivityLog } from "@/api/educator/activity-log.api";
import type { EducatorClass } from "@/types/educator/class.types";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

const EVENT_TYPE_OPTIONS = [
  { value: "all",        label: "All Event Types" },
  { value: "CREATE",     label: "Create" },
  { value: "UPDATE",     label: "Update" },
  { value: "DELETE",     label: "Delete" },
  { value: "LOGIN",      label: "Login" },
  { value: "SUBMIT",     label: "Submit" },
  { value: "GRADE",      label: "Grade" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function eventTypeBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  const a = action.toUpperCase();
  if (a.includes("DELETE")) return "destructive";
  if (a.includes("CREATE")) return "default";
  if (a.includes("UPDATE")) return "secondary";
  return "outline";
}

function formatMetadata(metadata?: Record<string, unknown>): string {
  if (!metadata) return "—";
  const entries = Object.entries(metadata).slice(0, 3);
  return entries.map(([k, v]) => `${k}: ${v}`).join(" · ") || "—";
}

// ── Columns ───────────────────────────────────────────────────────────────────

function buildColumns(
  classMap: Map<string, string>
): ColumnDef<ActivityLog>[] {
  return [
    {
      id: "createdAt",
      header: "Timestamp",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground whitespace-nowrap">
          {format(new Date(row.original.createdAt), "MMM d, yyyy h:mm a")}
        </span>
      ),
    },
    {
      id: "action",
      header: "Event Type",
      cell: ({ row }) => (
        <Badge variant={eventTypeBadgeVariant(row.original.action)} className="text-xs font-normal">
          {row.original.action}
        </Badge>
      ),
    },
    {
      id: "entityType",
      header: "Class",
      cell: ({ row }) => {
        const classId = row.original.metadata?.classId as string | undefined;
        const name = classId ? (classMap.get(classId) ?? classId) : "—";
        return <span className="text-sm">{name}</span>;
      },
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground max-w-xs truncate block">
          {formatMetadata(row.original.metadata)}
        </span>
      ),
    },
  ];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EducatorActivityLogPage() {
  const [classFilter, setClassFilter]       = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [fromDate, setFromDate]             = useState<string>("");
  const [toDate, setToDate]                 = useState<string>("");
  const [page, setPage]                     = useState(1);

  // Build query params
  const query = useMemo(() => ({
    classId: classFilter !== "all" ? classFilter : undefined,
    from:    fromDate || undefined,
    to:      toDate   || undefined,
  }), [classFilter, fromDate, toDate]);

  const { data: logsRaw, isLoading } = useActivityLog(query);
  const { data: classesRaw }         = useEducatorClasses();

  // Subject lookup for class display names
  const { data: subjectsRaw } = useAsyncQuery(
    queryKeys.admin.subjects.all,
    () => subjectApi.getAll(),
  );

  // Build class map: classId → subject name (or subject_id fallback)
  const subjectMap = useMemo(() => {
    const m = new Map<string, string>();
    toArray<{ id: string; title: string }>(subjectsRaw).forEach((s) =>
      m.set(s.id, s.title)
    );
    return m;
  }, [subjectsRaw]);

  const classMap = useMemo(() => {
    const m = new Map<string, string>();
    toArray<EducatorClass>(classesRaw).forEach((cls) => {
      m.set(cls.id, subjectMap.get(cls.subject_id) ?? cls.subject_id);
    });
    return m;
  }, [classesRaw, subjectMap]);

  // Class options for filter dropdown
  const classOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: "all", label: "All Classes" },
    ];
    toArray<EducatorClass>(classesRaw).forEach((cls) => {
      opts.push({
        value: cls.id,
        label: subjectMap.get(cls.subject_id) ?? cls.subject_id,
      });
    });
    return opts;
  }, [classesRaw, subjectMap]);

  // Client-side event type filter (API doesn't support it)
  const logs = useMemo(() => {
    const all = Array.isArray(logsRaw) ? logsRaw : [];
    if (eventTypeFilter === "all") return all;
    return all.filter((l) =>
      l.action.toUpperCase().includes(eventTypeFilter.toUpperCase())
    );
  }, [logsRaw, eventTypeFilter]);

  // Client-side pagination
  const total     = logs.length;
  const paginated = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(() => buildColumns(classMap), [classMap]);

  // Reset to page 1 on filter change
  const handleClassFilter = (v: string | null) => {
  if (!v) return; // guard against null
  setClassFilter(v);
  setPage(1);
};
  const handleEventFilter = (v: string | null) => {
  if (!v) return;
  setEventTypeFilter(v);
  setPage(1);
};
  const handleFromDate    = (v: string) => { setFromDate(v); setPage(1); };
  const handleToDate      = (v: string) => { setToDate(v); setPage(1); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Class */}
        <Select value={classFilter} onValueChange={handleClassFilter}>
          <SelectTrigger className="w-[200px]">
            <span className="truncate">
              {classOptions.find((o) => o.value === classFilter)?.label ?? "All Classes"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {classOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Event Type */}
        <Select value={eventTypeFilter} onValueChange={handleEventFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Event Types" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <Input
          type="date"
          className="w-[160px]"
          value={fromDate}
          onChange={(e) => handleFromDate(e.target.value)}
          placeholder="From"
        />
        <Input
          type="date"
          className="w-[160px]"
          value={toDate}
          onChange={(e) => handleToDate(e.target.value)}
          placeholder="To"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginated}
        isLoading={isLoading}
        emptyTitle="No activity found"
        emptyDescription="No activity logs match your current filters."
      />

      {/* Pagination */}
      {total > 0 && (
        <Pagination
          page={page}
          limit={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}