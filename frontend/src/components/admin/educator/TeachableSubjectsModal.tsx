"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, Loader2 } from "lucide-react";

import {
  useSetSubjectSlots,
  useSetTeachableSubjects,
  useEducatorCapacity,
} from "@/hooks/admin/useEducators";
import { useSubjects } from "@/hooks/admin/useSubject";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { programApi } from "@/api/admin/program.api";
import { levelApi } from "@/api/admin/level.api";
import { sectionApi } from "@/api/admin/section.api";
import type {
  TeachableSubject,
  SubjectSlotAssignment,
} from "@/api/admin/educator.api";
import { Modal, ModalFooter } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "all";

type Picks = Record<string, Record<string, number[]>>;
type Claim = { educatorId: string; educatorName: string; slots: number[] };

interface TeachableSubjectsModalProps {
  open: boolean;
  onClose: () => void;
  educatorId: string;
  schoolYearId?: string;
  /** Current links, with their section/slot picks. Seeds the form on open. */
  assigned: TeachableSubject[];
  /** subject id -> section id -> holder + slot positions (saved state). */
  claims?: Record<string, Record<string, Claim>>;
}

/** Drops empty sections/subjects and sorts slots so picks compare stably. */
function normalize(p: Picks): Picks {
  const out: Picks = {};
  for (const [subjectId, secs] of Object.entries(p)) {
    const clean: Record<string, number[]> = {};
    for (const [sectionId, slots] of Object.entries(secs)) {
      if (slots.length > 0) {
        clean[sectionId] = [...slots].sort((a, b) => a - b);
      }
    }
    if (Object.keys(clean).length > 0) out[subjectId] = clean;
  }
  return out;
}

function countSlots(p: Picks, info: Map<string, { minutes: number }>): number {
  let total = 0;
  for (const [subjectId, secs] of Object.entries(p)) {
    const minutes = info.get(subjectId)?.minutes ?? 0;
    for (const slots of Object.values(secs)) total += slots.length * minutes;
  }
  return total;
}

export function TeachableSubjectsModal({
  open,
  onClose,
  educatorId,
  schoolYearId,
  assigned,
  claims,
}: TeachableSubjectsModalProps): React.JSX.Element {
  const [programId, setProgramId] = useState(ALL);
  const [levelId, setLevelId] = useState(ALL);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  /** Live picks: subject -> section -> 1-based weekly positions. */
  const [picksBySubject, setPicksBySubject] = useState<Picks>({});
  /** Seed snapshot for dirty-checking. */
  const [seedPicks, setSeedPicks] = useState<Picks>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const saveSubjects = useSetTeachableSubjects();
  const saveSlots = useSetSubjectSlots();
  const saving = saveSubjects.isPending || saveSlots.isPending;
  const capacityQuery = useEducatorCapacity(
    educatorId,
    open ? schoolYearId : undefined,
  );

  const { data: programs = [] } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId!),
    { enabled: open && !!schoolYearId },
  );
  const { data: levels = [] } = useAsyncQuery(
    queryKeys.admin.levels.list({ schoolYearId, programId }),
    () =>
      levelApi.getBySchoolYear(
        schoolYearId!,
        programId !== ALL ? programId : undefined,
      ),
    { enabled: open && !!schoolYearId },
  );
  const { data: subjects = [] } = useSubjects(
    open && schoolYearId
      ? {
          schoolYearId,
          programId: programId !== ALL ? programId : undefined,
          levelId: levelId !== ALL ? levelId : undefined,
          search: search.trim() || undefined,
        }
      : undefined,
  );
  // Unfiltered year subjects: weekly count + minutes per subject.
  const { data: allYearSubjects = [] } = useSubjects(
    open && schoolYearId ? { schoolYearId } : undefined,
  );
  const subjectInfoById = useMemo(() => {
    const map = new Map<
      string,
      { positions: number; minutes: number; levelId: string | null }
    >();
    for (const s of allYearSubjects) {
      map.set(s.id, {
        positions: s.effectiveSessionsPerWeek,
        minutes: s.effectiveSessionMinutes,
        levelId: s.levelId,
      });
    }
    return map;
  }, [allYearSubjects]);

  // Seed from the current links every time the modal opens. Legacy rows
  // (section ids with no slot picks) expand to the full weekly count.
  useEffect(() => {
    if (!open) return;
    setSelected(assigned.map((s) => s.id));
    const picks: Picks = {};
    for (const s of assigned) {
      const perSection: Record<string, number[]> = {};
      const explicit = new Map(
        (s.sectionSlots ?? []).map((p) => [p.sectionId, [...p.slots]]),
      );
      const positions = subjectInfoById.get(s.id)?.positions ?? 0;
      for (const sectionId of s.sectionIds) {
        const slots = explicit.get(sectionId);
        if (slots && slots.length > 0) {
          perSection[sectionId] = [...slots].sort((a, b) => a - b);
        } else if (positions > 0) {
          perSection[sectionId] = Array.from(
            { length: positions },
            (_, i) => i + 1,
          );
        }
      }
      for (const p of s.sectionSlots ?? []) {
        if (!(p.sectionId in perSection) && p.slots.length > 0) {
          perSection[p.sectionId] = [...p.slots].sort((a, b) => a - b);
        }
      }
      if (Object.keys(perSection).length > 0) picks[s.id] = perSection;
    }
    setPicksBySubject(picks);
    setSeedPicks(JSON.parse(JSON.stringify(picks)) as Picks);
    setExpanded(null);
  }, [open, assigned, subjectInfoById]);

  const expandedSubject = useMemo(
    () => subjects.find((s) => s.id === expanded) ?? null,
    [subjects, expanded],
  );
  const { data: levelSections = [], isLoading: sectionsLoading } =
    useAsyncQuery(
      queryKeys.admin.sections.list({
        schoolYearId,
        levelId: expandedSubject?.levelId ?? undefined,
      }),
      () => sectionApi.getAll(schoolYearId!, expandedSubject!.levelId!),
      { enabled: open && !!expandedSubject?.levelId },
    );
  const { data: yearSections = [] } = useAsyncQuery(
    queryKeys.admin.sections.list({ schoolYearId }),
    () => sectionApi.getAll(schoolYearId!),
    { enabled: open && !!schoolYearId },
  );
  const sectionsByLevel = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    for (const sec of yearSections) {
      const list = map.get(sec.level_id) ?? [];
      list.push(sec);
      map.set(sec.level_id, list);
    }
    return map;
  }, [yearSections]);

  /** A claim only blocks slots when someone else holds it. */
  const otherClaim = (subjectId: string, sectionId: string) => {
    const c = claims?.[subjectId]?.[sectionId];
    return c && c.educatorId !== educatorId ? c : undefined;
  };

  /**
   * Coverage per listed subject: a section is covered when this educator's
   * live slots plus anyone else's slots fill every weekly position.
   */
  const subjectCoverage = useMemo(() => {
    const m = new Map<string, { total: number; covered: number }>();
    for (const s of subjects) {
      const levelSecs = s.levelId
        ? (sectionsByLevel.get(s.levelId) ?? [])
        : [];
      const positions = subjectInfoById.get(s.id)?.positions ?? 1;
      let covered = 0;
      for (const sec of levelSecs) {
        const taken = new Set<number>(picksBySubject[s.id]?.[sec.id] ?? []);
        const c = claims?.[s.id]?.[sec.id];
        if (c && c.educatorId !== educatorId) {
          c.slots.forEach((n) => taken.add(n));
        }
        if (taken.size >= Math.max(1, positions)) covered += 1;
      }
      m.set(s.id, { total: levelSecs.length, covered });
    }
    return m;
  }, [
    subjects,
    sectionsByLevel,
    subjectInfoById,
    picksBySubject,
    claims,
    educatorId,
  ]);

  const needsSubjects = useMemo(
    () =>
      subjects.filter((s) => {
        const c = subjectCoverage.get(s.id);
        return !c || c.total === 0 || c.covered < c.total;
      }),
    [subjects, subjectCoverage],
  );
  const doneSubjects = useMemo(
    () =>
      subjects.filter((s) => {
        const c = subjectCoverage.get(s.id);
        return !!c && c.total > 0 && c.covered >= c.total;
      }),
    [subjects, subjectCoverage],
  );

  const toggleSubject = (id: string) => {
    const on = selected.includes(id);
    if (on) {
      // Unticking drops that subject's picks too.
      setPicksBySubject((m) => {
        const next = { ...m };
        delete next[id];
        return next;
      });
      if (expanded === id) setExpanded(null);
      setSelected((prev) => prev.filter((x) => x !== id));
    } else {
      setSelected((prev) => [...prev, id]);
    }
  };

  const setSectionSlots = (
    subjectId: string,
    sectionId: string,
    slots: number[],
  ) => {
    setPicksBySubject((m) => {
      const perSection = { ...(m[subjectId] ?? {}) };
      if (slots.length === 0) delete perSection[sectionId];
      else perSection[sectionId] = [...slots].sort((a, b) => a - b);
      const next = { ...m };
      if (Object.keys(perSection).length === 0) delete next[subjectId];
      else next[subjectId] = perSection;
      return next;
    });
  };

  const toggleSlot = (subjectId: string, sectionId: string, slot: number) => {
    const current = picksBySubject[subjectId]?.[sectionId] ?? [];
    setSectionSlots(
      subjectId,
      sectionId,
      current.includes(slot)
        ? current.filter((x) => x !== slot)
        : [...current, slot],
    );
  };

  const assignedIds = useMemo(
    () => assigned.map((s) => s.id).sort(),
    [assigned],
  );
  const dirty =
    JSON.stringify([...selected].sort()) !== JSON.stringify(assignedIds) ||
    JSON.stringify(normalize(picksBySubject)) !==
      JSON.stringify(normalize(seedPicks));

  // Live capacity: server remaining, adjusted by unsaved pick changes.
  const remainingMin = capacityQuery.data
    ? capacityQuery.data.remainingMin -
      (countSlots(picksBySubject, subjectInfoById) -
        countSlots(seedPicks, subjectInfoById))
    : null;

  const save = () => {
    saveSubjects.mutate(
      { educatorId, subjectIds: selected },
      {
        onSuccess: () => {
          if (!schoolYearId) {
            onClose();
            return;
          }
          // Include subjects whose picks were all cleared so the server
          // drops their old slots instead of keeping them.
          const assignments: SubjectSlotAssignment[] = selected
            .filter(
              (id) =>
                Object.keys(picksBySubject[id] ?? {}).length > 0 ||
                Object.keys(seedPicks[id] ?? {}).length > 0,
            )
            .map((subjectId) => ({
              subjectId,
              sections: Object.entries(picksBySubject[subjectId] ?? {}).map(
                ([sectionId, slots]) => ({
                  sectionId,
                  slots: [...slots].sort((a, b) => a - b),
                }),
              ),
            }));
          if (assignments.length === 0) {
            onClose();
            return;
          }
          saveSlots.mutate(
            { educatorId, schoolYearId, assignments },
            { onSuccess: () => onClose() },
          );
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select teachable subjects"
      description="Tick subjects this educator can teach, then expand a subject to choose which sections and weekly slots they handle. The generator only places classes for assigned slots."
      size="5xl"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects…"
            className="h-9"
            aria-label="Search subjects"
          />
          <Select
            value={programId}
            onValueChange={(v) => {
              setProgramId(v ?? ALL);
              setLevelId(ALL);
            }}
          >
            <SelectTrigger aria-label="Department filter" className="w-full">
              <SelectValue placeholder="All Departments">
                {programId === ALL
                  ? "All Departments"
                  : programs.find((p) => p.id === programId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Departments</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={levelId}
            onValueChange={(v) => setLevelId(v ?? ALL)}
            disabled={programId === ALL && levels.length === 0}
          >
            <SelectTrigger aria-label="Level filter" className="w-full">
              <SelectValue placeholder="All Levels">
                {levelId === ALL
                  ? "All Levels"
                  : levels.find((l) => l.id === levelId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Levels</SelectItem>
              {levels.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[38vh] rounded-md border bg-card">
          {subjects.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">
              No subjects match these filters for this school year.
            </p>
          ) : (
            <div>
              {needsSubjects.length > 0 ? (
                <>
                  <p className="sticky top-0 bg-muted/60 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                    Needs educator ({needsSubjects.length})
                  </p>
                  <div className="divide-y">
                    {needsSubjects.map((s) => renderSubjectRow(s, "needs"))}
                  </div>
                </>
              ) : null}
              {doneSubjects.length > 0 ? (
                <>
                  <p className="sticky top-0 bg-muted/60 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                    All sections have educator ({doneSubjects.length})
                  </p>
                  <div className="divide-y">
                    {doneSubjects.map((s) => renderSubjectRow(s, "done"))}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </ScrollArea>

        <ModalFooter>
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {remainingMin !== null
                ? `Weekly capacity remaining: ${remainingMin} min${
                    remainingMin < 0 ? " (over capacity)" : ""
                  }`
                : "Classes this educator is assigned to teach."}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={save} disabled={!dirty || saving}>
                {saving ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : null}
                Save
              </Button>
            </div>
          </div>
        </ModalFooter>
      </div>
    </Modal>
  );

  /** One subject row. A plain closure so state lives in the modal and rows
      never remount on each keystroke. */
  function renderSubjectRow(
    s: (typeof subjects)[number],
    group: "needs" | "done",
  ): React.JSX.Element {
    const on = selected.includes(s.id);
    const picks = picksBySubject[s.id] ?? {};
    const pickedSections = Object.keys(picks).length;
    const isOpen = expanded === s.id;
    const cov = subjectCoverage.get(s.id);
    const positions = Math.max(1, subjectInfoById.get(s.id)?.positions ?? 1);
    const statusText =
      group === "done"
        ? null
        : !cov || cov.total === 0
          ? s.levelId
            ? `No sections in ${s.levelName ?? "this level"} yet — nothing to assign.`
            : "No level — sections cannot be assigned."
          : `${cov.total - cov.covered} of ${cov.total} sections still need an educator.`;

    return (
      <div key={s.id} className="px-2 py-1">
        <div className="flex w-full items-center gap-2 rounded px-1 py-1.5 text-left text-xs">
          <button
            type="button"
            onClick={() => toggleSubject(s.id)}
            aria-pressed={on}
            className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-0.5 hover:bg-muted"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
            >
              {on ? <Check className="h-3 w-3" /> : null}
            </span>
            <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="truncate font-medium">{s.title}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {[s.programName, s.levelName].filter(Boolean).join(" · ")}
              </span>
            </span>
          </button>
          {on ? (
            <div className="flex shrink-0 items-center gap-1.5">
              {pickedSections > 0 ? (
                <Badge variant="secondary" className="text-[10px]">
                  {pickedSections} section{pickedSections === 1 ? "" : "s"}
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  no sections
                </span>
              )}
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : s.id)}
                aria-label={isOpen ? "Hide sections" : "Choose sections"}
                className="rounded border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          ) : null}
        </div>
        {statusText ? (
          <p className="ml-7 text-[10px] text-amber-600 dark:text-amber-400">
            {statusText}
          </p>
        ) : null}
        {on && isOpen ? (
          <div className="ml-7 mt-1 space-y-1.5 rounded-md border bg-muted/30 p-2">
            {!s.levelId ? (
              <p className="text-[11px] text-muted-foreground">
                This subject has no level, so no sections can be picked.
              </p>
            ) : sectionsLoading ? (
              <p className="text-[11px] text-muted-foreground">
                Loading sections…
              </p>
            ) : levelSections.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                No sections in {s.levelName ?? "this level"} yet.
              </p>
            ) : (
              levelSections.map((sec) => {
                const mine = picks[sec.id] ?? [];
                const other = otherClaim(s.id, sec.id);
                const blocked = new Set(other?.slots ?? []);
                const free = Array.from(
                  { length: positions },
                  (_, i) => i + 1,
                ).filter((n) => !blocked.has(n));
                const allOn =
                  free.length > 0 && free.every((n) => mine.includes(n));
                return (
                  <div
                    key={sec.id}
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    <span className="w-28 truncate text-[11px] font-medium">
                      {sec.name}
                    </span>
                    {Array.from({ length: positions }, (_, i) => i + 1).map(
                      (n) => {
                        const isMine = mine.includes(n);
                        if (blocked.has(n)) {
                          return (
                            <button
                              key={n}
                              type="button"
                              aria-pressed={false}
                              title={`${other!.educatorName} already handles slot ${n}`}
                              onClick={() =>
                                toast.warning(
                                  `${other!.educatorName} is already assigned to ${sec.name} (slot ${n}) for ${s.title}.`,
                                )
                              }
                              className="cursor-not-allowed rounded-md border border-border bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground/60"
                            >
                              {n}
                            </button>
                          );
                        }
                        return (
                          <button
                            key={n}
                            type="button"
                            aria-pressed={isMine}
                            onClick={() => toggleSlot(s.id, sec.id, n)}
                            className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                              isMine
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {n}
                          </button>
                        );
                      },
                    )}
                    {free.length > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSectionSlots(s.id, sec.id, allOn ? [] : free)
                        }
                        className="rounded-md px-2 py-1 text-[10px] text-muted-foreground underline hover:text-foreground"
                      >
                        {allOn ? "Clear" : "All"}
                      </button>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    );
  }
}