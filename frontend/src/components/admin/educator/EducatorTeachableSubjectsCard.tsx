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
import { classApi } from "@/api/admin/class.api";
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
  semesterId?: string;
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
  semesterId,
}: EducatorTeachableSubjectsCardProps): React.JSX.Element {
  // Year-filtered rows for display and counts: sections arrive resolved
  // server-side, so there is no client-side section lookup and no raw-id
  // fallback anywhere in this card.
  const { data: assigned, isLoading } = useTeachableSubjects(
    educatorId,
    schoolYearId,
  );
  // Unfiltered links for the modal seed and remove: the bundle/modal write
  // paths replace the whole link set, so they must keep seeing links from
  // other years until teachability becomes global (Part B).
  const { data: assignedAll } = useTeachableSubjects(educatorId);
  const { data: schoolYears = [] } = useSchoolYears();
  const saveMutation = useSetTeachableSubjects();
  const carryMutation = useCarryOverTeachableSubjects();

  const [modalOpen, setModalOpen] = useState(false);
  const [unmatched, setUnmatched] = useState<UnmatchedLink[]>([]);
  const [showUnmatched, setShowUnmatched] = useState(false);

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

  // Classes in the same scope (shared cache entry with the Classes tab) for
  // the per-row Generated indicator. Only fetched while a semester is
  // selected — without one the indicator has nothing to compare against.
  const { data: scopedClasses = [] } = useAsyncQuery(
    queryKeys.admin.classes.list({
      educatorId,
      schoolYearId,
      semesterId,
    }),
    () =>
      classApi.getAll({
        educatorId,
        schoolYearId,
        semesterId,
      }),
    { enabled: !!schoolYearId && !!semesterId },
  );
  const generatedSectionIdsBySubject = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const c of scopedClasses) {
      if (!c.sectionId) continue;
      const set = map.get(c.subjectId) ?? new Set<string>();
      set.add(c.sectionId);
      map.set(c.subjectId, set);
    }
    return map;
  }, [scopedClasses]);

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
    // Built from the UNFILTERED set: removing one subject must not drop this
    // educator's links from other years as a side effect.
    const next = (assignedAll ?? []).map((s) => s.id).filter((x) => x !== subjectId);
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
        const names = row.original.sections.map((s) => s.name);
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
            {names.slice(0, MAX_SECTION_BADGES).map((n, i) => (
              <Badge key={`${row.original.sections[i].sectionId}-${n}`} variant="secondary" className="text-[11px] font-normal">
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
      id: "generated",
      header: "Generated",
      cell: ({ row }) => {
        if (!semesterId) {
          return (
            <span className="text-xs text-muted-foreground not-interactive">
              —
            </span>
          );
        }
        const handled = row.original.sections.map((s) => s.sectionId);
        if (handled.length === 0) {
          return (
            <span className="text-xs text-muted-foreground not-interactive">
              No sections
            </span>
          );
        }
        const generated =
          generatedSectionIdsBySubject.get(row.original.id) ?? new Set<string>();
        const covered = handled.filter((secId) => generated.has(secId)).length;
        if (covered === handled.length) {
          return (
            <Badge variant="default" className="text-[11px] font-normal">
              Generated
            </Badge>
          );
        }
        if (covered === 0) {
          return (
            <Badge variant="outline" className="text-[11px] font-normal">
              Not generated
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-700 dark:text-amber-400 text-[11px] font-normal"
            title={`${covered} of ${handled.length} sections have a class`}
          >
            Partial
          </Badge>
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
          assigned={assignedAll ?? []}
          claims={claims}
        />
      ) : null}
    </div>
  );
}
