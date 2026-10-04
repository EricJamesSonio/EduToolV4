"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import {
  BookOpen,
  CopyCheck,
  Loader2,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  useTeachableSubjects,
  useSetTeachableSubjects,
  useCarryOverTeachableSubjects,
} from "@/hooks/admin/useEducators";
import { useGeneratorRoster } from "@/hooks/admin/useClassGenerator";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { sectionApi } from "@/api/admin/section.api";
import type { TeachableSubject } from "@/api/admin/educator.api";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TeachableSubjectsModal } from "@/components/admin/educator/TeachableSubjectsModal";
import type { AxiosError } from "axios";

interface EducatorTeachableSubjectsCardProps {
  educatorId: string;
  schoolYearId?: string;
}

interface UnmatchedLink {
  educatorId: string;
  subjectName: string;
  reason: string;
}

const MAX_SECTION_BADGES = 3;

export function EducatorTeachableSubjectsCard({
  educatorId,
  schoolYearId,
}: EducatorTeachableSubjectsCardProps): React.JSX.Element {
  const { data: assigned, isLoading } = useTeachableSubjects(educatorId);
  const { data: schoolYears = [] } = useSchoolYears();
  const saveMutation = useSetTeachableSubjects();
  const carryMutation = useCarryOverTeachableSubjects();

  const [modalOpen, setModalOpen] = useState(false);
  const [unmatched, setUnmatched] = useState<UnmatchedLink[]>([]);
  const [showUnmatched, setShowUnmatched] = useState(false);

  // Section names for the badges. One query for the year, mapped by id.
  const { data: sectionsRaw } = useAsyncQuery(
    queryKeys.admin.sections.list({ schoolYearId }),
    () => sectionApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId },
  );
  // Every educator's holds (including this one, from saved state) for the
  // slot picker: subject -> section -> holder + slot positions. The modal
  // tells its own live picks apart from these saved claims itself.
  const { data: roster } = useGeneratorRoster(schoolYearId);
  const claims = useMemo(() => {
    const map: Record<
      string,
      Record<
        string,
        { educatorId: string; educatorName: string; slots: number[] }
      >
    > = {};
    for (const e of roster?.educators ?? []) {
      for (const [subjectId, perSection] of Object.entries(
        e.slotsBySubject ?? {},
      )) {
        const target = (map[subjectId] ??= {});
        for (const [secId, slots] of Object.entries(perSection)) {
          target[secId] ??= {
            educatorId: e.educatorId,
            educatorName: e.name ?? "Another educator",
            slots,
          };
        }
      }
    }
    return map;
  }, [roster]);
  const sectionNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sectionsRaw ?? []) map.set(s.id, s.name);
    return map;
  }, [sectionsRaw]);

  const errMessage = (err: unknown, fallback: string) => {
    const ax = err as AxiosError<{ message?: string }>;
    return ax.response?.data?.message ?? fallback;
  };

  const runCarryOver = () => {
    // Copy from the year immediately AFTER the one being viewed: schoolYears
    // is newest-first, so the previous year is the next entry.
    const index = schoolYears.findIndex((y: { id: string }) => y.id === schoolYearId);
    const from = schoolYears[index + 1];
    if (!from) {
      toast.error("There is no earlier school year to copy from.");
      return;
    }
    carryMutation.mutate(
      { fromSchoolYearId: from.id, toSchoolYearId: schoolYearId! },
      {
        onSuccess: (result) => {
          setUnmatched(result.unmatched);
          setShowUnmatched(result.unmatched.length > 0);
        },
        onError: (err: unknown) =>
          toast.error(errMessage(err, "Failed to copy subjects.")),
      },
    );
  };

  const removeSubject = (subjectId: string, subjectName: string) => {
    // Dropping the link deletes the row, so its section picks go with it.
    const next = (assigned ?? []).map((s) => s.id).filter((x) => x !== subjectId);
    saveMutation.mutate(
      { educatorId, subjectIds: next },
      {
        onError: (err: unknown) =>
          toast.error(errMessage(err, `Failed to remove ${subjectName}.`)),
      },
    );
  };

  const columns: ColumnDef<TeachableSubject>[] = [
    {
      id: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <span className="font-medium not-interactive">{row.original.name}</span>
      ),
    },
    {
      id: "department",
      header: "Department",
      cell: ({ row }) => {
        const { programName, courseName, strandName } = row.original;
        const sub = courseName ?? strandName;
        return (
          <div className="not-interactive">
            <p className="text-sm">{programName ?? "—"}</p>
            {sub ? (
              <p className="text-xs text-muted-foreground">{sub}</p>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "level",
      header: "Level",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground not-interactive">
          {row.original.levelName ?? "—"}
        </span>
      ),
    },
    {
      id: "sections",
      header: "Sections",
      cell: ({ row }) => {
        const names = row.original.sectionIds.map(
          (id) => sectionNameById.get(id) ?? id.slice(0, 8),
        );
        if (names.length === 0) {
          return (
            <span className="text-xs text-muted-foreground not-interactive">
              No sections
            </span>
          );
        }
        const extra = names.length - MAX_SECTION_BADGES;
        return (
          <div className="flex flex-wrap gap-1" title={names.join(", ")}>
            {names.slice(0, MAX_SECTION_BADGES).map((n) => (
              <Badge key={n} variant="secondary" className="text-[11px] font-normal">
                {n}
              </Badge>
            ))}
            {extra > 0 ? (
              <Badge variant="outline" className="text-[11px] font-normal">
                +{extra} more
              </Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          disabled={saveMutation.isPending}
          aria-label={`Remove ${row.original.name}`}
          onClick={() => removeSubject(row.original.id, row.original.name)}
        >
          <X className="h-3.5 w-3.5" />
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-xl text-xs text-muted-foreground">
          Subjects this educator is able to teach, and which sections they
          handle. The class generator places only assigned pairs.
        </p>
        {isLoading ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runCarryOver}
              disabled={
                carryMutation.isPending || !schoolYearId || schoolYears.length < 2
              }
              title="Copy teachable subjects from the previous school year"
            >
              {carryMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <CopyCheck className="h-3.5 w-3.5 mr-1.5" />
              )}
              Copy from previous year
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              {(assigned ?? []).length === 0 ? "Select subjects" : "Edit subjects"}
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={assigned ?? []}
          isLoading={isLoading}
          emptyTitle="No subjects set"
          emptyDescription="This educator will not be eligible for automatic class generation."
        />
      </div>

      {unmatched.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              <TriangleAlert className="h-3.5 w-3.5" />
              {unmatched.length} subject link(s) could not be matched
            </p>
            <button
              type="button"
              onClick={() => setShowUnmatched((v) => !v)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              {showUnmatched ? "Hide" : "Show"}
            </button>
          </div>
          {showUnmatched ? (
            <ul className="mt-2 space-y-1">
              {unmatched.map((u, i) => (
                <li key={i} className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">{u.subjectName}</span>
                  {" "}— {u.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {modalOpen ? (
        <TeachableSubjectsModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          educatorId={educatorId}
          schoolYearId={schoolYearId}
          assigned={assigned ?? []}
          claims={claims}
        />
      ) : null}
    </div>
  );
}