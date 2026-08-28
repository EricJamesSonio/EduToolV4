"use client";

import { useState, useMemo } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { subjectApi } from "@/api/admin/subject.api";
import {
  useSubjectPrerequisites,
  useBulkSetPrerequisites,
  useRemovePrerequisite,
} from "@/hooks/admin/useSubjectPrerequisites";
import type { Subject } from "@/types/admin/subject.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, X, AlertTriangle, BookOpen } from "lucide-react";
import type { AxiosError } from "axios";

export function PrerequisitesSection({ subject }: { subject: Subject }): React.JSX.Element {
  const { data: prereqs, isLoading } = useSubjectPrerequisites(subject.id);
  const { data: allSubjects = [], isLoading: subjectsLoading } = useAsyncQuery(
    queryKeys.admin.subjects.list({}),
    () => subjectApi.getAll({ limit: 5000 }),
    { meta: { preset: "list", feature: "subjects" } },
  );

  const [selectedToAdd, setSelectedToAdd] = useState<string>("");

  const bulkSet = useBulkSetPrerequisites(subject.id);
  const removeMut = useRemovePrerequisite(subject.id);

  const currentIds = useMemo(() => new Set((prereqs ?? []).map((p) => p.prerequisite_id)), [prereqs]);

  const availableToAdd = useMemo(() => {
    return (allSubjects as Subject[]).filter(
      (s) => s.id !== subject.id && !currentIds.has(s.id),
    );
  }, [allSubjects, currentIds, subject.id]);

  const handleAdd = async () => {
    if (!selectedToAdd) return;
    const newIds = [...Array.from(currentIds), selectedToAdd];
    try {
      await bulkSet.mutateAsync(newIds);
      toast.success("Prerequisite added.");
      setSelectedToAdd("");
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      toast.error(ax.response?.data?.message ?? "Failed to add prerequisite.");
    }
  };

  const handleRemove = async (prereqId: string) => {
    try {
      await removeMut.mutateAsync(prereqId);
      toast.success("Prerequisite removed.");
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      toast.error(ax.response?.data?.message ?? "Failed to remove.");
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="px-4 py-6 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BookOpen className="h-4 w-4" /> Prerequisites
        </CardTitle>
        <CardDescription className="text-xs">
          Subjects that must be passed before this one. Soft warning only — students can still request, admin approves as override. Immediate-only (no chain).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(prereqs ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No prerequisites yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add one below. Warnings will show on class cards and the request queue.</p>
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {(prereqs ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="secondary" className="text-xs font-normal shrink-0">
                    Requires
                  </Badge>
                  <span className="text-sm truncate">{p.prerequisite?.name ?? p.prerequisite_id}</span>
                  {p.prerequisite?.year_level && (
                    <span className="text-xs text-muted-foreground">· {p.prerequisite.year_level}</span>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRemove(p.prerequisite_id)}
                  disabled={removeMut.isPending}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select value={selectedToAdd} onValueChange={(v: string | null) => setSelectedToAdd(v ?? "")}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={subjectsLoading ? "Loading subjects..." : "Select prerequisite to add"} />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No more subjects available</div>
                ) : (
                  availableToAdd.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title} {s.levelName ? `· ${s.levelName}` : ""} {s.programName ? `· ${s.programName}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!selectedToAdd || bulkSet.isPending} className="shrink-0">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-snug">
            Adding a prerequisite checks for immediate cycles (A requires B while B already requires A). Chain checks are not enforced — Math 3 only checks Math 2.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
