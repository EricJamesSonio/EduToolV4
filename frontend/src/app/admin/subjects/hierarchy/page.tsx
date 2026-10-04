"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubjectHierarchyFilter, type HierarchyFilterValue } from "@/components/admin/subject/hierarchy/SubjectHierarchyFilter";
import { SubjectHierarchyGraph } from "@/components/admin/subject/hierarchy/SubjectHierarchyGraph";
import { SubjectHierarchyLegend } from "@/components/admin/subject/hierarchy/SubjectHierarchyLegend";
import {
  findScopeProgram,
  hierarchyScopePrompt,
  isHierarchyScopeReady,
} from "@/components/admin/subject/hierarchy/hierarchyScope";
import { useHierarchyPrograms } from "@/hooks/admin/useHierarchyPrograms";
import { useSubjectHierarchy } from "@/hooks/admin/useSubjectHierarchy";
import { YEAR_COLORS } from "@/lib/palette";

const HEADER_COLLAPSED_KEY = "subject-hierarchy-header-collapsed";

/** Persisted so the "focus on the subjects" preference survives navigation. */
function usePersistedCollapsed(): [boolean, (v: boolean) => void] {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(HEADER_COLLAPSED_KEY) === "true");
    } catch {
      // Private mode / disabled storage — fall back to the default (expanded).
    }
  }, []);

  const toggle = (next: boolean) => {
    setCollapsed(next);
    try {
      window.localStorage.setItem(HEADER_COLLAPSED_KEY, String(next));
    } catch {
      // Preference is a nicety; never let a storage failure break the page.
    }
  };

  return [collapsed, toggle];
}

export default function SubjectHierarchyPage(): React.JSX.Element {
  const router = useRouter();
  const [filter, setFilter] = useState<HierarchyFilterValue>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = usePersistedCollapsed();

  // Same cache entry the filter reads — no duplicate department request.
  const { data: programs = [] } = useHierarchyPrograms(filter.schoolYearId);
  const selectedProgram = useMemo(
    () => findScopeProgram(programs, filter.programId),
    [programs, filter.programId],
  );

  // Subjects load only for a scope that is actually meaningful: a course for a
  // college department that has courses, a strand for an SHS department that
  // has strands, and the department alone when it has neither. See
  // `isHierarchyScopeReady` for why this mirrors the filter's dropdown rules.
  const scopeReady = isHierarchyScopeReady(filter, selectedProgram);
  const prompt = hierarchyScopePrompt(filter, selectedProgram);

  const { data, isLoading, columns } = useSubjectHierarchy(
    {
      schoolYearId: filter.schoolYearId,
      programId: filter.programId,
      courseId: filter.courseId,
      strandId: filter.strandId,
      levelId: filter.levelId,
    },
    scopeReady,
  );

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
            data.edges.filter((e) => e.to === selected.id && e.from !== e.to).map((e) => e.from),
    );
    return data.nodes.filter((n) => fromIds.has(n.id));
  }, [data, selected]);
  const dependentsOfSelected = useMemo(() => {
    if (!selected || !data) return [];
    const toIds = new Set(
           data.edges.filter((e) => e.from === selected.id && e.from !== e.to).map((e) => e.to),
    );
    return data.nodes.filter((n) => toIds.has(n.id));
  }, [data, selected]);

  const summary = data
    ? `${data.nodes.length} subjects · ${data.edges.length} prerequisite links · ${columns.length} years`
    : null;

  const headerContent = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subject Hierarchy</h1>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          aria-expanded={!collapsed}
          aria-controls="hierarchy-header-body"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
          {collapsed ? "Show filters" : "Hide filters"}
        </Button>
      </div>

      {/* Kept mounted (hidden rather than unmounted) so `aria-controls` on the
          toggle always resolves to a real node in the DOM. */}
      <div id="hierarchy-header-body" className="space-y-3" hidden={collapsed}>
        <SubjectHierarchyFilter
          value={filter}
          levels={data?.levels}
          onChange={(v) => {
            setFilter(v);
            setSelectedId(null);
          }}
        />
        {prompt === "course" && (
          <p className="text-sm text-muted-foreground">
            Pick a course to see its subjects and levels.
          </p>
        )}
        {prompt === "strand" && (
          <p className="text-sm text-muted-foreground">
            Pick a strand to see its subjects and levels.
          </p>
        )}
        {!filter.programId && (
          <p className="text-sm text-muted-foreground">
            Select a school year and department — pick a course for College or a strand for SHS — then narrow to a level to see only that level&apos;s subjects.
          </p>
        )}
        {data && (
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
            <SubjectHierarchyLegend ranks={ranks} levelNameOf={levelNameOf} />
            <p className="text-xs text-muted-foreground">
              {summary}
              {data.truncated && (
                <span className="ml-2 text-amber-600">Large scope truncated — narrow by course/strand.</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Collapsed: keep the scope context visible so the admin still knows what
          they are looking at, without the chrome eating graph height. */}
      {collapsed && (
        <p className="text-xs text-muted-foreground">
          {summary ?? "No subjects loaded for this scope yet."}
        </p>
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[520px] flex-col gap-3">
      <nav
        aria-label="Breadcrumb"
        className="flex shrink-0 flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
      >
        <span>Admin</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/admin/subjects" className="hover:text-foreground hover:underline">
          Subjects
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">Hierarchy</span>
      </nav>

      <div className="min-h-0 flex-1">
        {data ? (
          <div className="relative h-full">
            <SubjectHierarchyGraph
              fill
              header={headerContent}
              nodes={data.nodes}
              edges={data.edges}
              selectedId={selectedId}
              onSelect={(s) => setSelectedId(s.id || null)}
              levelNameOf={levelNameOf}
            />
            {selected && (
              <Card className="absolute right-4 top-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto p-5 space-y-3 shadow-xl">
                <div className="flex items-start gap-2">
                  <span
                    className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: YEAR_COLORS[(selected.yearRank - 1) % YEAR_COLORS.length].swatch }}
                  />
                  <h3 className="font-semibold leading-snug">{selected.name}</h3>
                  <button
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedId(null)}
                  >
                    ✕
                  </button>
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
              </Card>
            )}
          </div>
        ) : (
          <Card className="h-full p-5">
            {headerContent}
            {isLoading && (
              <p className="text-sm text-muted-foreground py-10 text-center">Loading hierarchy…</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}