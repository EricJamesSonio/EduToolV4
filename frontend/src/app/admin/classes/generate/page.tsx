"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  TriangleAlert,
  Wand2,
} from "lucide-react";

import { programApi } from "@/api/admin/program.api";
import { semesterApi } from "@/api/admin/semester.api";
import { sectionApi } from "@/api/admin/section.api";
import { subjectApi } from "@/api/admin/subject.api";
import { levelApi } from "@/api/admin/level.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import type { SchoolYear } from "@/types/admin/school-year.types";
import {
  useCommitGenerated,
  useGeneratePreview,
  useGeneratorReadiness,
  useGeneratorRoster,
} from "@/hooks/admin/useClassGenerator";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toArray } from "@/utils/classes.utils";

import { PageHeader } from "@/components/shared/PageHeader";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DAY_LABELS,
  PreviewStep,
  GeneratorReadinessIssues,
} from "@/components/admin/class/ClassGeneratorPanels";
import { GeneratorScopeFilter } from "@/components/admin/class/GeneratorScopeFilter";
import type { GenerateRequest } from "@/types/admin/class-generator.types";
import {
  buildScopeTree,
  computeCoverage,
  subjectsInScope,
  visibleSectionIds,
} from "@/utils/generatorScope";

type Step = "configure" | "preview";

/**
 * Reconcile a checked-id list against what is currently selectable: drop
 * ids that vanished, add ids that newly appeared, keep manual unchecks
 * untouched. Returns the previous array when nothing changed.
 */
function syncChecked(
  prev: string[],
  selectable: string[],
  prevSelectable: string[],
): string[] {
  const selectableSet = new Set(selectable);
  const kept = prev.filter((id) => selectableSet.has(id));
  const fresh = selectable.filter((id) => !prevSelectable.includes(id));
  const next = [...new Set([...kept, ...fresh])];
  return next.length === prev.length && next.every((id, i) => id === prev[i])
    ? prev
    : next;
}

function GeneratePageInner(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialYear = searchParams.get("schoolYearId") ?? undefined;

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(
    initialYear ?? null,
  );
  const [step, setStep] = useState<Step>("configure");
  const [programIds, setProgramIds] = useState<string[]>([]);
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [strandIds, setStrandIds] = useState<string[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  // null = every educator selected. An explicit array (possibly empty) is
  // the admin's own choice; empty blocks preview rather than meaning "all".
  const [selectedEducatorIds, setSelectedEducatorIds] = useState<
    string[] | null
  >(null);
  const [useWindow, setUseWindow] = useState(false);
  const [windowStart, setWindowStart] = useState("08:00");
  const [windowEnd, setWindowEnd] = useState("15:00");
  const [rosterFilter, setRosterFilter] = useState("");
  const [plan, setPlan] = useState<import("@/types/admin/class-generator.types").GeneratePreview | null>(null);

  const previewMutation = useGeneratePreview();
  const commitMutation = useCommitGenerated(() => {
    setPlan(null);
    setStep("configure");
  });

  // ===== School years (auto-selects the active one) =====
  const { data: schoolYearsRaw, isLoading: isYearsLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    () => schoolYearApi.getAll(),
  );
  const schoolYears = toArray<SchoolYear>(schoolYearsRaw);

  // A new year resets every dependent selection: a semester or section id
  // from another year must never linger and silently scope the plan.
  const initYearRef = useRef<string | null>(null);
  const prevCoursesRef = useRef<string[]>([]);
  const prevStrandsRef = useRef<string[]>([]);
  const prevVisibleRef = useRef<string[]>([]);
  useEffect(() => {
    setProgramIds([]);
    setCourseIds([]);
    setStrandIds([]);
    setSemesterId("");
    setSectionIds([]);
    setSelectedEducatorIds(null);
    setPlan(null);
    setStep("configure");
    initYearRef.current = null;
    prevCoursesRef.current = [];
    prevStrandsRef.current = [];
    prevVisibleRef.current = [];
  }, [selectedSchoolYearId]);

  // ===== Scope lists =====
  const { data: programs = [] } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId: selectedSchoolYearId }),
    () => programApi.getAll(selectedSchoolYearId!),
    { enabled: !!selectedSchoolYearId },
  );
  const { data: semesters = [] } = useAsyncQuery(
    queryKeys.admin.semesters.list({ schoolYearId: selectedSchoolYearId }),
    () => semesterApi.getAll(selectedSchoolYearId!),
    { enabled: !!selectedSchoolYearId },
  );
  const { data: levels = [] } = useAsyncQuery(
    queryKeys.admin.levels.list({ schoolYearId: selectedSchoolYearId }),
    () => levelApi.getBySchoolYear(selectedSchoolYearId!),
    { enabled: !!selectedSchoolYearId },
  );
  const { data: sectionsRaw } = useAsyncQuery(
    queryKeys.admin.sections.list({ schoolYearId: selectedSchoolYearId }),
    () => sectionApi.getAll(selectedSchoolYearId!),
    { enabled: !!selectedSchoolYearId },
  );
  const { data: subjectsRaw } = useAsyncQuery(
    [...queryKeys.admin.subjects.all, "all", selectedSchoolYearId] as const,
    () => subjectApi.getAll({ schoolYearId: selectedSchoolYearId! }),
    { enabled: !!selectedSchoolYearId },
  );
  const sections = toArray<{ id: string; name: string; level_id: string }>(sectionsRaw);
  const subjects = toArray<{
    id: string;
    title: string;
    programId: string;
    programName: string;
    levelId: string | null;
    courseId: string | null;
    strandId: string | null;
    effectiveSessionsPerWeek?: number;
  }>(subjectsRaw);
  const rosterQuery = useGeneratorRoster(selectedSchoolYearId ?? undefined);

  // Default to the first semester, and repair a stale id (e.g. from another
  // year) instead of rendering a raw UUID in the trigger.
  useEffect(() => {
    if (semesters.length === 0) return;
    if (!semesterId || !semesters.some((s) => s.id === semesterId)) {
      setSemesterId(semesters[0].id);
    }
  }, [semesters, semesterId]);

  // Department → course/strand → level → section shape for the filter.
  const scopeTree = useMemo(
    () => buildScopeTree(programs, levels, sections),
    [programs, levels, sections],
  );

  // Courses/strands selectable right now = ones inside selected departments.
  const selectableCourseIds = useMemo(
    () =>
      scopeTree
        .filter((d) => programIds.includes(d.id))
        .flatMap((d) => d.groups)
        .filter((g) => g.kind === "course")
        .map((g) => g.id),
    [scopeTree, programIds],
  );
  const selectableStrandIds = useMemo(
    () =>
      scopeTree
        .filter((d) => programIds.includes(d.id))
        .flatMap((d) => d.groups)
        .filter((g) => g.kind === "strand")
        .map((g) => g.id),
    [scopeTree, programIds],
  );
  const visibleIds = useMemo(
    () =>
      visibleSectionIds(scopeTree, { programIds, courseIds, strandIds }),
    [scopeTree, programIds, courseIds, strandIds],
  );
  const selectableCourseKey = useMemo(
    () => [...selectableCourseIds].sort().join(","),
    [selectableCourseIds],
  );
  const selectableStrandKey = useMemo(
    () => [...selectableStrandIds].sort().join(","),
    [selectableStrandIds],
  );
  const visibleKey = useMemo(
    () => [...visibleIds].sort().join(","),
    [visibleIds],
  );

  // Default to every department on the first load of a school year, so
  // preview works immediately. A manual clear-all persists until the year
  // (or its department list) changes — this runs on program identity, not
  // on every refetch.
  const programKey = useMemo(
    () => programs.map((p) => p.id).sort().join(","),
    [programs],
  );
  useEffect(() => {
    if (!selectedSchoolYearId || programs.length === 0) return;
    const stamp = `${selectedSchoolYearId}:${programKey}`;
    if (initYearRef.current === stamp) return;
    initYearRef.current = stamp;
    setProgramIds(programs.map((p) => p.id));
  }, [selectedSchoolYearId, programs, programKey]);

  // Keep checks in sync with what is visible: prune what disappeared,
  // auto-check what newly appeared, never resurrect a manual uncheck.
  // Converges within a render or two as each key stabilizes.
  useEffect(() => {
    setCourseIds((prev) =>
      syncChecked(prev, selectableCourseIds, prevCoursesRef.current),
    );
    prevCoursesRef.current = selectableCourseIds;
    setStrandIds((prev) =>
      syncChecked(prev, selectableStrandIds, prevStrandsRef.current),
    );
    prevStrandsRef.current = selectableStrandIds;
    setSectionIds((prev) => syncChecked(prev, visibleIds, prevVisibleRef.current));
    prevVisibleRef.current = visibleIds;
  }, [
    selectableCourseIds,
    selectableStrandIds,
    visibleIds,
    selectableCourseKey,
    selectableStrandKey,
    visibleKey,
  ]);

  // A full house is sent as "no filter": the backend treats an omitted
  // list as the whole scope, which also keeps subjects with no course set
  // included. Only a strict subset narrows.
  const effectiveCourseIds =
    courseIds.length > 0 && courseIds.length < selectableCourseIds.length
      ? courseIds
      : undefined;
  const effectiveStrandIds =
    strandIds.length > 0 && strandIds.length < selectableStrandIds.length
      ? strandIds
      : undefined;

  const readiness = useGeneratorReadiness(
    selectedSchoolYearId ?? undefined,
    programIds,
    {
      courseIds: effectiveCourseIds,
      strandIds: effectiveStrandIds,
      educatorIds: selectedEducatorIds ?? undefined,
    },
    selectedEducatorIds === null || selectedEducatorIds.length > 0,
  );

  const subjectById = useMemo(() => {
    const map = new Map<string, (typeof subjects)[number]>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const sectionNameById = useMemo(() => {
    const map = new Map<string, string>();
    sections.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sections]);

  const buildRequest = useMemo(
    (): GenerateRequest => ({
      schoolYearId: selectedSchoolYearId!,
      programIds,
      semesterId,
      ...(sectionIds.length > 0 ? { sectionIds } : {}),
      ...(effectiveCourseIds ? { courseIds: effectiveCourseIds } : {}),
      ...(effectiveStrandIds ? { strandIds: effectiveStrandIds } : {}),
      ...(selectedEducatorIds && selectedEducatorIds.length > 0
        ? { educatorIds: selectedEducatorIds }
        : {}),
      ...(useWindow ? { windowStart, windowEnd } : {}),
    }),
    [
      selectedSchoolYearId,
      programIds,
      semesterId,
      sectionIds,
      effectiveCourseIds,
      effectiveStrandIds,
      selectedEducatorIds,
      useWindow,
      windowStart,
      windowEnd,
    ],
  );

  const hasEducatorsSelected =
    selectedEducatorIds === null || selectedEducatorIds.length > 0;
  const canPreview =
    !!selectedSchoolYearId &&
    programIds.length > 0 &&
    !!semesterId &&
    sectionIds.length > 0 &&
    hasEducatorsSelected;

  const runPreview = () => {
    previewMutation.mutate(buildRequest, {
      onSuccess: (result) => {
        setPlan(result);
        setStep("preview");
      },
    });
  };

  const toggleProgram = (id: string) => {
    setProgramIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const toggleAllPrograms = (selectAll: boolean) => {
    setProgramIds(selectAll ? programs.map((p) => p.id) : []);
  };

  const toggleCourse = (id: string) => {
    setCourseIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const toggleStrand = (id: string) => {
    setStrandIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const toggleSection = (id: string) => {
    setSectionIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const toggleLevelSections = (levelSectionIds: string[], allOn: boolean) => {
    setSectionIds((prev) =>
      allOn
        ? prev.filter((s) => !levelSectionIds.includes(s))
        : [...new Set([...prev, ...levelSectionIds])],
    );
  };

  const toggleGroupSections = toggleLevelSections;

  const toggleEducator = (id: string) => {
    setSelectedEducatorIds((prev) => {
      const current =
        prev ?? (rosterQuery.data?.educators ?? []).map((e) => e.educatorId);
      return current.includes(id)
        ? current.filter((e) => e !== id)
        : [...current, id];
    });
  };

  const toggleAllEducators = (selectAll: boolean) => {
    setSelectedEducatorIds(selectAll ? null : []);
  };

  const rosterEducators = useMemo(() => {
    const q = rosterFilter.trim().toLowerCase();
    const list = rosterQuery.data?.educators ?? [];
    if (!q) return list;
    return list.filter((e) =>
      (e.name ?? "").toLowerCase().includes(q),
    );
  }, [rosterQuery.data, rosterFilter]);

  // Frontend-instant coverage: which in-scope subjects lose every teachable
  // educator under the current selection. The backend re-validates the same
  // thing in readiness (scope_no_coverage), so this is a preview, not truth.
  const teachableByEducator = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const e of rosterQuery.data?.educators ?? []) {
      map.set(e.educatorId, e.teachableSubjectIds);
    }
    return map;
  }, [rosterQuery.data]);
  const inScopeSubjects = useMemo(
    () => subjectsInScope(subjects, { programIds, courseIds, strandIds }),
    [subjects, programIds, courseIds, strandIds],
  );
  const coverage = useMemo(
    () => computeCoverage(inScopeSubjects, teachableByEducator, selectedEducatorIds),
    [inScopeSubjects, teachableByEducator, selectedEducatorIds],
  );
  const subjectTitleById = useMemo(() => {
    const map = new Map<string, string>();
    subjects.forEach((s) => map.set(s.id, s.title));
    return map;
  }, [subjects]);
  const educatorTotal = rosterQuery.data?.educators.length ?? 0;
  const educatorSelectedCount =
    selectedEducatorIds === null ? educatorTotal : selectedEducatorIds.length;
  const educatorsAllSelected =
    educatorTotal > 0 && educatorSelectedCount === educatorTotal;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auto-generate classes"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/classes")}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Classes
            </Button>
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={isYearsLoading}
              selectedId={selectedSchoolYearId}
              onSelect={setSelectedSchoolYearId}
            />
          </div>
        }
      />
      <p className="-mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Wand2 className="h-3.5 w-3.5" />
        Choose what to generate, review the plan, then approve. Nothing is
        written until you click Create.
      </p>

      {step === "configure" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* ===== Configure ===== */}
          <div className="space-y-4 rounded-lg border bg-card p-4">
            <GeneratorScopeFilter
              tree={scopeTree}
              selection={{ programIds, courseIds, strandIds, sectionIds }}
              visibleSectionCount={visibleIds.length}
              onToggleAllPrograms={toggleAllPrograms}
              onToggleProgram={toggleProgram}
              onToggleCourse={toggleCourse}
              onToggleStrand={toggleStrand}
              onToggleSection={toggleSection}
              onToggleLevelSections={toggleLevelSections}
              onToggleGroupSections={toggleGroupSections}
            />

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Semester</Label>
              <Select
                value={semesterId}
                onValueChange={(v) => setSemesterId(v ?? "")}
              >
                           <SelectTrigger>
                  <SelectValue placeholder="Select a semester">
                    {semesters.find((s) => s.id === semesterId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="use-window"
                  checked={useWindow}
                  onCheckedChange={(v) => setUseWindow(!!v)}
                />
                <Label htmlFor="use-window" className="text-xs font-normal">
                  Limit to a daily time window
                </Label>
              </div>
              {useWindow ? (
                <div className="grid grid-cols-2 gap-2 pl-6">
                  <Input
                    type="time"
                    step={60}
                    value={windowStart}
                    onChange={(e) => setWindowStart(e.target.value)}
                    aria-label="Window start"
                    className="h-9"
                  />
                  <Input
                    type="time"
                    step={60}
                    value={windowEnd}
                    onChange={(e) => setWindowEnd(e.target.value)}
                    aria-label="Window end"
                    className="h-9"
                  />
                </div>
              ) : null}
            </div>

            {readiness.data && selectedSchoolYearId ? (
              <GeneratorReadinessIssues
                data={readiness.data}
                schoolYearId={selectedSchoolYearId}
              />
            ) : null}

            <div className="flex justify-end">
              <Button
                onClick={runPreview}
                disabled={!canPreview || previewMutation.isPending}
              >
                {previewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1.5" />
                )}
                Preview plan
              </Button>
            </div>
          </div>

          {/* ===== Educator roster ===== */}
                  <div className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs text-muted-foreground">
                Educators{" "}
                <span className="font-normal">
                  ({educatorSelectedCount} of {educatorTotal} selected) —
                  uncheck to exclude from generation
                </span>
              </Label>
              {educatorTotal > 0 ? (
                <button
                  type="button"
                  onClick={() => toggleAllEducators(!educatorsAllSelected)}
                  className="shrink-0 text-[11px] text-primary hover:underline"
                >
                  {educatorsAllSelected ? "Clear" : "All"}
                </button>
              ) : null}
            </div>
            {coverage.uncoveredSubjectIds.length > 0 ? (
              <div className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  {coverage.uncoveredSubjectIds.length} in-scope subject
                  {coverage.uncoveredSubjectIds.length === 1 ? "" : "s"} ha
                  {coverage.uncoveredSubjectIds.length === 1 ? "s" : "ve"} no
                  selected educator:{" "}
                  {coverage.uncoveredSubjectIds
                    .slice(0, 5)
                    .map((id) => subjectTitleById.get(id) ?? id.slice(0, 8))
                    .join(", ")}
                  {coverage.uncoveredSubjectIds.length > 5
                    ? ` +${coverage.uncoveredSubjectIds.length - 5} more`
                    : ""}
                  . They will stay unplaced unless re-selected.
                </p>
              </div>
            ) : null}
            {!hasEducatorsSelected ? (
              <p className="text-xs text-muted-foreground">
                Every educator is deselected — select at least one to preview.
              </p>
            ) : null}
            <Input
              placeholder="Filter educators…"
              value={rosterFilter}
              onChange={(e) => setRosterFilter(e.target.value)}
              className="h-9"
            />
            {rosterQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : rosterEducators.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No educators found{rosterFilter ? " for this filter" : " in this organization"}.
              </p>
            ) : (
              <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                {rosterEducators.map((e) => {
                  const inScopeIds = new Set(inScopeSubjects.map((s) => s.id));
                  const teachable = e.teachableSubjectIds
                    .map((id) => subjectById.get(id))
                    .filter((s) => s && inScopeIds.has(s.id));
                  const others =
                    e.teachableSubjectIds.length - teachable.length;
                  const educatorOn =
                    selectedEducatorIds === null ||
                    selectedEducatorIds.includes(e.educatorId);
                  const covered =
                    coverage.coveredCountByEducator.get(e.educatorId) ?? 0;
                  return (
                    <div
                      key={e.educatorId}
                      className={`rounded-md border p-2 ${educatorOn ? "" : "opacity-60"}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-pressed={educatorOn}
                          onClick={() => toggleEducator(e.educatorId)}
                          title={
                            educatorOn
                              ? "Exclude from generation"
                              : "Include in generation"
                          }
                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border text-[10px] leading-none transition-colors ${
                            educatorOn
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-transparent hover:bg-muted"
                          }`}
                        >
                          ✓
                        </button>
                        <p className="text-sm font-medium">
                          {e.name ?? "Unnamed educator"}
                        </p>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.effectiveWeekdays.map((d) => (
                          <Badge
                            key={d}
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            {DAY_LABELS[d]}
                          </Badge>
                        ))}
                        {e.useCustomAvailability ? null : (
                          <span className="text-[10px] text-muted-foreground">
                            all school days
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Covers {covered} of {inScopeSubjects.length} in-scope
                        subject{inScopeSubjects.length === 1 ? "" : "s"}
                        {educatorOn ? "" : " — excluded from this run"}.
                      </p>
                      {teachable.length > 0 ? (
                        <div className="mt-1 space-y-0.5">
                          {teachable.map((s) => {
                            const weekly =
                              s!.effectiveSessionsPerWeek || 0;
                            const handled = (
                              e.sectionsBySubject[s!.id] ?? []
                            ).map((id) => {
                              const picked =
                                e.slotsBySubject?.[s!.id]?.[id] ?? [];
                              const name =
                                sectionNameById.get(id) ?? id.slice(0, 8);
                              return picked.length > 0 &&
                                picked.length < weekly
                                ? `${name} (${picked.length}/${weekly} slots)`
                                : name;
                            });
                            return (
                              <p
                                key={s!.id}
                                className="text-[11px] text-muted-foreground"
                              >
                                <span className="font-medium text-foreground">
                                  {s!.title}
                                </span>
                                {handled.length > 0 ? (
                                  <> → {handled.join(", ")}</>
                                ) : (
                                  " → no sections"
                                )}
                              </p>
                            );
                          })}
                          {others > 0 ? (
                            <p className="text-[11px] text-muted-foreground">
                              +{others} outside the current scope
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          No teachable subjects in the current scope.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <PreviewStep
          plan={plan}
          committing={commitMutation.isPending}
          onBack={() => setStep("configure")}
          onConfirm={() =>
            commitMutation.mutate({ ...buildRequest, confirmed: true })
          }
        />
      )}
    </div>
  );
}

export default function GenerateClassesPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <GeneratePageInner />
    </Suspense>
  );
}
