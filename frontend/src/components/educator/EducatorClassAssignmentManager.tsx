"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { classApi } from "@/api/admin/class.api";
import type { Class } from "@/types/admin/class.types";
import type { AxiosError } from "axios";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { SearchInput } from "@/components/shared/SearchInput";
import { Plus, X } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen]           = useState(false);
  const [removeTarget, setRemoveTarget]       = useState<Class | null>(null);
  const [search, setSearch]                   = useState("");

  // Educator's assigned classes
  const { data: assigned = [], isLoading } = useQuery({
    queryKey: ["admin", "classes", { educatorId }],
    queryFn:  () => classApi.getAll({ educatorId }),
  });

  // All classes — for the assign picker
  const { data: allClasses = [], isLoading: loadingAll } = useQuery({
    queryKey: ["admin", "classes", "all"],
    queryFn:  () => classApi.getAll(),
    enabled:  assignOpen,
  });

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

  const assignMutation = useMutation({
    mutationFn: (classId: string) => classApi.update(classId, { educatorId }),
    onSuccess: () => {
      toast.success("Class assigned to educator.");
      queryClient.invalidateQueries({ queryKey: ["admin", "classes", { educatorId }] });
      queryClient.invalidateQueries({ queryKey: ["educators"] });
      setAssignOpen(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to assign class.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (classId: string) => classApi.update(classId, { educatorId: undefined }),
    onSuccess: () => {
      toast.success("Class assignment removed.");
      queryClient.invalidateQueries({ queryKey: ["admin", "classes", { educatorId }] });
      queryClient.invalidateQueries({ queryKey: ["educators"] });
      setRemoveTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to remove assignment.");
      setRemoveTarget(null);
    },
  });

  const assignedColumns = useMemo<ColumnDef<Class>[]>(() => [
    {
      id: "title",
      header: "Class",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.subjectName ?? row.original.title ?? "—"}
        </span>
      ),
    },
    {
      id: "section",
      header: "Section / Level",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.sectionName ?? "—"}
        </span>
      ),
    },
    {
      id: "schedule",
      header: "Schedule",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatSchedule(row.original)}
        </span>
      ),
    },
    {
      id: "semester",
      header: "Semester",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.semesterName ?? "—"}
        </span>
      ),
    },
    {
      id: "schoolYear",
      header: "School Year",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.schoolYearTitle ?? "—"}
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
            title={isActive ? "Reassign class first before removing educator." : "Remove assignment"}
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
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Assigned Classes</h2>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAssignOpen(true)}>
          <Plus className="h-4 w-4" />
          Assign to Class
        </Button>
      </div>

      <DataTable
        columns={assignedColumns}
        data={assigned}
        isLoading={isLoading}
        emptyTitle="No classes assigned"
        emptyDescription="Use the button above to assign this educator to a class."
      />

      {/* Assign picker dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign to Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by subject or section..."
            />
            {loadingAll ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-full animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : available.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No available classes to assign.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y rounded-md border">
                {available.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {cls.subjectName ?? cls.title ?? "Unnamed Class"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[cls.sectionName, cls.semesterName, cls.schoolYearTitle]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={assignMutation.isPending}
                      onClick={() => assignMutation.mutate(cls.id)}
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

      {/* Remove confirm */}
      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(o) => { if (!o) setRemoveTarget(null); }}
        title="Remove class assignment?"
        message={`Remove "${removeTarget?.subjectName ?? "this class"}" from this educator's assignments?`}
        confirmLabel="Remove"
        destructive
        isLoading={removeMutation.isPending}
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget.id)}
      />
    </div>
  );
}