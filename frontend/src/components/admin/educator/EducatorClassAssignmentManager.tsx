"use client";

import { useState, useMemo } from "react";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { classApi } from "@/api/admin/class.api";
import type { Class } from "@/types/admin/class.types";
import type { AxiosError } from "axios";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchInput } from "@/components/shared/SearchInput";
import { Plus, X } from "lucide-react";
import { EducatorScheduleGrid } from "./EducatorScheduleGrid";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatSchedule(cls: Class): string {
  if (!cls.schedules?.length) return "—";
  return cls.schedules
    .map((s) => `${WEEKDAYS[s.weekday]} ${s.startTime}–${s.endTime}`)
    .join(", ");
}

interface EducatorClassAssignmentManagerProps {
  educatorId: string;
}

export function EducatorClassAssignmentManager({ educatorId }: EducatorClassAssignmentManagerProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Class | null>(null);
  const [assignTarget, setAssignTarget] = useState<Class | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "schedule">("list");

  const { data: assigned = [], isLoading } = useAsyncQuery(
    queryKeys.admin.classes.list({ educatorId }),
    () => classApi.getAll({ educatorId }),
  );

  const { data: allClasses = [], isLoading: loadingAll } = useAsyncQuery(
    queryKeys.admin.classes.list(),
    () => classApi.getAll(),
    { enabled: assignOpen },
  );

  const assignedIds = useMemo(() => new Set(assigned.map((c) => c.id)), [assigned]);

  const available = useMemo(() => {
    const unassigned = allClasses.filter((c) => !assignedIds.has(c.id) && !c.isArchived);
    if (!search.trim()) return unassigned;

    const q = search.toLowerCase();
    return unassigned.filter(
      (c) =>
        c.subjectName?.toLowerCase().includes(q) ||
        c.sectionName?.toLowerCase().includes(q)
    );
  }, [allClasses, assignedIds, search]);

  const assignMutation = useMutationWithInvalidation(
    (classId: string) => classApi.update(classId, { educatorId }),
    {
      invalidateKeys: [queryKeys.admin.classes.list({ educatorId }), queryKeys.admin.educators.all],
      onSuccess: () => {
        toast.success("Class assigned.");
        setAssignTarget(null);
        setAssignOpen(false);
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(err?.response?.data?.message ?? "Failed to assign class.");
        setAssignTarget(null);
      },
    },
  );

  const removeMutation = useMutationWithInvalidation(
    (classId: string) => classApi.update(classId, { educatorId: undefined }),
    {
      invalidateKeys: [queryKeys.admin.classes.list({ educatorId }), queryKeys.admin.educators.all],
      onSuccess: () => {
        toast.success("Class removed.");
        setRemoveTarget(null);
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(err?.response?.data?.message ?? "Failed to remove.");
        setRemoveTarget(null);
      },
    },
  );

  const assignedColumns = useMemo<ColumnDef<Class>[]>(() => [
    {
      id: "title",
      header: "Class",
      cell: ({ row }) => (
        <span className="font-medium not-interactive">
          {row.original.subjectName ?? row.original.title ?? "—"}
        </span>
      ),
    },
    {
      id: "section",
      header: "Section / Level",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground not-interactive">
          {row.original.sectionName ?? "—"}
        </span>
      ),
    },
    {
      id: "schedule",
      header: "Schedule",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground not-interactive">
          {formatSchedule(row.original)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const isActive = row.original.status === "active";

        return (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            disabled={isActive}
            onClick={() => setRemoveTarget(row.original)}
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </Button>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold not-interactive">Assigned Classes</h2>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "list" | "schedule")}>
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
            <Plus className="h-4 w-4" />
            Assign to Class
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <DataTable
          columns={assignedColumns}
          data={assigned}
          isLoading={isLoading}
          emptyTitle="No classes assigned"
          emptyDescription="Assign this educator to a class."
        />
      ) : (
        <EducatorScheduleGrid classes={assigned} isLoading={isLoading} />
      )}

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign to Class</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search..."
            />

            {loadingAll ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse bg-muted rounded-md" />
                ))}
              </div>
            ) : available.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6 not-interactive">
                No available classes.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y border rounded-md">
                {available.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium not-interactive">
                        {cls.subjectName ?? cls.title ?? "Unnamed"}
                      </p>
                      <p className="text-xs text-muted-foreground not-interactive">
                        {cls.sectionName}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAssignTarget(cls)}
                    >
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={assignTarget !== null}
        onOpenChange={(o) => { if (!o) setAssignTarget(null); }}
        title="Assign educator?"
        message={
          assignTarget?.educatorName
            ? `Replace "${assignTarget.educatorName}"?`
            : `Assign to "${assignTarget?.subjectName ?? "this class"}"?`
        }
        confirmLabel="Confirm"
        isLoading={assignMutation.isPending}
        onConfirm={() => {
          if (assignTarget) {
            assignMutation.mutate(assignTarget.id);
          }
        }}
      />

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(o) => { if (!o) setRemoveTarget(null); }}
        title="Remove assignment?"
        message={`Remove "${removeTarget?.subjectName ?? "this class"}"?`}
        confirmLabel="Remove"
        destructive
        isLoading={removeMutation.isPending}
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget.id)}
      />
    </div>
  );
}