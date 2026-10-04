"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
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
import type { GenerateRequest } from "@/types/admin/class-generator.types";

type Step = "configure" | "preview";

function GeneratePageInner(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialYear = searchParams.get("schoolYearId") ?? undefined;

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(
    initialYear ?? null,
  );
  const [step, setStep] = useState<Step>("configure");
  const [programIds, setProgramIds] = useState<string[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [sectionIds, setSectionIds] = useState<string[]>([]);
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
  useEffect(() => {
    setProgramIds([]);
    setSemesterId("");
    setSectionIds([]);
    setPlan(null);
    setStep("configure");
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

  // Levels in the selected departments, with their sections.
  const levelsInScope = useMemo(
    () =>
      levels
        .filter((l) => programIds.includes(l.program_id))
        .map((l) => ({
          ...l,
          programName: programs.find((p) => p.id === l.program_id)?.name ?? "",
          sections: sections.filter((s) => s.level_id === l.id),
        })),
    [levels, programIds, programs, sections],
  );
  const inScopeSectionIds = useMemo(
    () => levelsInScope.flatMap((l) => l.sections.map((s) => s.id)),
    [levelsInScope],
  );
  const inScopeKey = useMemo(
    () => [...inScopeSectionIds].sort().join(","),
    [inScopeSectionIds],
  );

  // Default to every in-scope section so preview works immediately; the admin
  // unchecks what they do not want. Re-defaults only when the scope itself
  // changes, never on plain refetches.
  useEffect(() => {
    setSectionIds((prev) => {
      const prevKey = [...prev].sort().join(",");
      return prevKey === inScopeKey ? prev : [...inScopeSectionIds];
    });
  }, [inScopeKey, inScopeSectionIds]);

  const readiness = useGeneratorReadiness(
    selectedSchoolYearId ?? undefined,
    programIds,
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
      ...(useWindow ? { windowStart, windowEnd } : {}),
    }),
    [selectedSchoolYearId, programIds, semesterId, sectionIds, useWindow, windowStart, windowEnd],
  );

  const canPreview =
    !!selectedSchoolYearId &&
    programIds.length > 0 &&
    !!semesterId &&
    sectionIds.length > 0;

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

  const rosterEducators = useMemo(() => {
    const q = rosterFilter.trim().toLowerCase();
    const list = rosterQuery.data?.educators ?? [];
    if (!q) return list;
    return list.filter((e) =>
      (e.name ?? "").toLowerCase().includes(q),
    );
  }, [rosterQuery.data, rosterFilter]);

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
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Departments</Label>
              <div className="flex flex-wrap gap-1.5">
                {programs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No departments in this school year.
                  </p>
                ) : (
                  programs.map((p) => {
                    const on = programIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleProgram(p.id)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

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

            {/* ===== Sections ===== */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Sections{" "}
                <span className="font-normal">
                  ({sectionIds.length} of {inScopeSectionIds.length} selected)
                </span>
              </Label>
              {programIds.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Pick at least one department to see its sections.
                </p>
              ) : levelsInScope.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No levels in the selected departments.
                </p>
              ) : (
                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                  {levelsInScope.map((l) => {
                    const ids = l.sections.map((s) => s.id);
                    const allOn =
                      ids.length > 0 && ids.every((id) => sectionIds.includes(id));
                    return (
                      <div key={l.id} className="rounded-md border p-2">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-medium">
                            {l.name}
                            {l.programName ? (
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                · {l.programName}
                              </span>
                            ) : null}
                          </p>
                          {ids.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => toggleLevelSections(ids, allOn)}
                              className="shrink-0 text-[11px] text-primary hover:underline"
                            >
                              {allOn ? "Clear" : "All"}
                            </button>
                          ) : null}
                        </div>
                        {ids.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">
                            No sections in this level yet.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {l.sections.map((s) => {
                              const on = sectionIds.includes(s.id);
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  aria-pressed={on}
                                  onClick={() => toggleSection(s.id)}
                                  className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                    on
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  {s.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
                  ({rosterQuery.data?.educators.length ?? 0}) — teachable
                  subjects and available days
                </span>
              </Label>
            </div>
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
                  const teachable = e.teachableSubjectIds
                    .map((id) => subjectById.get(id))
                    .filter((s) => s && (programIds.length === 0 || programIds.includes(s.programId)));
                  const others =
                    e.teachableSubjectIds.length - teachable.length;
                  return (
                    <div key={e.educatorId} className="rounded-md border p-2">
                      <p className="text-sm font-medium">
                        {e.name ?? "Unnamed educator"}
                      </p>
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
                              +{others} in other departments
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          No teachable subjects
                          {programIds.length > 0
                            ? " in the selected departments"
                            : " set"}
                          .
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
