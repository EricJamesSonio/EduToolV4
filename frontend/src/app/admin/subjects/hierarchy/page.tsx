"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubjectHierarchyFilter, type HierarchyFilterValue } from "@/components/admin/subject/hierarchy/SubjectHierarchyFilter";
import { SubjectHierarchyGraph } from "@/components/admin/subject/hierarchy/SubjectHierarchyGraph";
import { SubjectHierarchyLegend } from "@/components/admin/subject/hierarchy/SubjectHierarchyLegend";
import { useSubjectHierarchy } from "@/hooks/admin/useSubjectHierarchy";
import { YEAR_COLORS } from "@/lib/palette";

export default function SubjectHierarchyPage(): React.JSX.Element {
  const router = useRouter();
  const [filter, setFilter] = useState<HierarchyFilterValue>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, columns } = useSubjectHierarchy({
    schoolYearId: filter.schoolYearId,
    programId: filter.programId,
    courseId: filter.courseId,
    strandId: filter.strandId,
  });

  const ranks = useMemo(() => (data?.levels ?? []).map((l) => l.rank), [data]);
  const levelNameOf = useMemo(() => {
    const map = new Map((data?.levels ?? []).map((l) => [l.rank, l.name]));
    return (rank: number): string => map.get(rank) ?? `Year ${rank}`;
  }, [data]);

  const selected = useMemo(
    () => data?.nodes.find((n) => n.id === selectedId) ?? null,
    [data, selectedId],
  );
  const prereqsOfSelected = useMemo(() => {
    if (!selected || !data) return [];
    const fromIds = new Set(
      data.edges.filter((e) => e.to === selected.id).map((e) => e.from),
    );
    return data.nodes.filter((n) => fromIds.has(n.id));
  }, [data, selected]);
  const dependentsOfSelected = useMemo(() => {
    if (!selected || !data) return [];
    const toIds = new Set(
      data.edges.filter((e) => e.from === selected.id).map((e) => e.to),
    );
    return data.nodes.filter((n) => toIds.has(n.id));
  }, [data, selected]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subject Hierarchy"
        breadcrumbs={[{ label: "Admin" }, { label: "Subjects", href: "/admin/subjects" }, { label: "Hierarchy" }]}
      />

      <Card className="p-5 space-y-4">
        <SubjectHierarchyFilter value={filter} onChange={(v) => { setFilter(v); setSelectedId(null); }} />
        {!filter.programId && !filter.schoolYearId && (
          <p className="text-sm text-muted-foreground">
            Select a school year and department — pick a course for College or a strand for SHS — to load the hierarchy from 1st to highest year.
          </p>
        )}
        {data && (
          <SubjectHierarchyLegend ranks={ranks} levelNameOf={levelNameOf} />
        )}
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-10 text-center">Loading hierarchy…</p>
      ) : data ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="space-y-2">
            <SubjectHierarchyGraph
              nodes={data.nodes}
              edges={data.edges}
              selectedId={selectedId}
              onSelect={(s) => setSelectedId(s.id)}
              levelNameOf={levelNameOf}
            />
            {data.truncated && (
              <p className="text-xs text-amber-600">Large scope truncated — narrow by course/strand.</p>
            )}
            <p className="text-xs text-muted-foreground">
              {data.nodes.length} subjects · {data.edges.length} prerequisite links · {columns.length} year columns
            </p>
          </div>

          <Card className="p-5 h-fit space-y-3">
            {!selected ? (
              <p className="text-sm text-muted-foreground">Click a subject to see its prerequisites and dependents.</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: YEAR_COLORS[(selected.yearRank - 1) % YEAR_COLORS.length].swatch }}
                  />
                  <h3 className="font-semibold">{selected.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {levelNameOf(selected.yearRank)}
                  {selected.termLabel ? ` · ${selected.termLabel}` : ""}
                </p>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                    Prerequisites ({prereqsOfSelected.length})
                  </p>
                  {prereqsOfSelected.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No prerequisites — entry subject.</p>
                  ) : (
                    <ul className="space-y-1">
                      {prereqsOfSelected.map((p) => (
                        <li key={p.id}>
                          <button
                            className="text-xs text-primary hover:underline"
                            onClick={() => setSelectedId(p.id)}
                          >
                            {p.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                    Required by ({dependentsOfSelected.length})
                  </p>
                  {dependentsOfSelected.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nothing requires this yet.</p>
                  ) : (
                    <ul className="space-y-1">
                      {dependentsOfSelected.map((d) => (
                        <li key={d.id}>
                          <button
                            className="text-xs text-primary hover:underline"
                            onClick={() => setSelectedId(d.id)}
                          >
                            {d.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => router.push(`/admin/subjects/${selected.id}`)}>
                  Open subject
                </Button>
              </>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
