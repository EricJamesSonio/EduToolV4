"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import {
  BookOpen,
  X,
} from "lucide-react";

import {
  useTeachableSubjects,
  useSetTeachableBundle,
} from "@/hooks/admin/useEducators";
import { useGeneratorRoster } from "@/hooks/admin/useClassGenerator";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { classApi } from "@/api/admin/class.api";
import type {
  TeachableSubject,
  SubjectSlotAssignment,
} from "@/api/admin/educator.api";
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

const MAX_SECTION_BADGES = 3;

export function EducatorTeachableSubjectsCard({
  educatorId,
  schoolYearId,
  semesterId,
}: EducatorTeachableSubjectsCardProps): React.JSX.Element {
  // Year-filtered rows for display and counts: sections arrive resolved
  // server-side, so there is no client-side section lookup and no raw-id
  // fallback anywhere in this card. Teachability itself is global — the
  // bundle write preserves other years server-side, so one filtered query
  // safely seeds both the table and the modal.
  const { data: assigned, isLoading } = useTeachableSubjects(
    educatorId,
    schoolYearId,
  );
  const bundleMutation = useSetTeachableBundle();

  const [modalOpen, setModalOpen] = useState(false);

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

  const removeSubject = (subjectId: string, subjectName: string) => {
    if (!schoolYearId) {
      toast.error("Pick a school year first.");
      return;
    }
    // Unticking removes the GLOBAL link (it applies to all school years).
    // The bundle replaces this year's picks only, so other years are
    // preserved server-side; retained subjects keep their picks as-is.
    const remaining = (assigned ?? []).filter((s) => s.id !== subjectId);
    const assignments: SubjectSlotAssignment[] = remaining.map((s) => ({
      subjectId: s.id,
      sections: s.sectionSlots.map((p) => ({
        sectionId: p.sectionId,
        slots: [...p.slots],
      })),
    }));
    bundleMutation.mutate(
      {
        educatorId,
        schoolYearId,
        subjectIds: remaining.map((s) => s.id),
        assignments,
      },
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
          disabled={bundleMutation.isPending}
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
          handle. Teachability applies to all school years; sections and slots
          are picked per year. The class generator places only assigned pairs.
        </p>
        {isLoading ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <div className="flex flex-wrap gap-2">
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
