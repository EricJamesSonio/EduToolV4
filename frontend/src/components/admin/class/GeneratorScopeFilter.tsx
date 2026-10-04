"use client";

import { Label } from "@/components/ui/label";
import type {
  ScopeDepartment,
  ScopeSelection,
} from "@/utils/generatorScope";

interface GeneratorScopeFilterProps {
  tree: ScopeDepartment[];
  selection: ScopeSelection;
  visibleSectionCount: number;
  onToggleAllPrograms: (selectAll: boolean) => void;
  onToggleProgram: (programId: string) => void;
  onToggleCourse: (courseId: string) => void;
  onToggleStrand: (strandId: string) => void;
  onToggleSection: (sectionId: string) => void;
  onToggleLevelSections: (levelSectionIds: string[], allOn: boolean) => void;
  onToggleGroupSections: (groupSectionIds: string[], allOn: boolean) => void;
}

const pillClass = (on: boolean): string =>
  `rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
    on
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-muted-foreground hover:bg-muted"
  }`;

const chipClass = (on: boolean): string =>
  `rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
    on
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-muted-foreground hover:bg-muted"
  }`;

/**
 * Department → course/strand → level → section selector for class
 * generation. Departments without courses/strands render their levels
 * directly. Every tier shows counts and has select/clear control; section
 * unchecks survive scope changes (the page re-adds only newly revealed
 * sections, never ones the admin cleared).
 */
export function GeneratorScopeFilter({
  tree,
  selection,
  visibleSectionCount,
  onToggleAllPrograms,
  onToggleProgram,
  onToggleCourse,
  onToggleStrand,
  onToggleSection,
  onToggleLevelSections,
  onToggleGroupSections,
}: GeneratorScopeFilterProps): React.JSX.Element {
  const { programIds, courseIds, strandIds, sectionIds } = selection;
  const allOn =
    tree.length > 0 && tree.every((d) => programIds.includes(d.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">
          Scope{" "}
          <span className="font-normal">
            ({sectionIds.length} of {visibleSectionCount} sections selected)
          </span>
        </Label>
        {tree.length > 0 ? (
          <button
            type="button"
            onClick={() => onToggleAllPrograms(!allOn)}
            className="shrink-0 text-[11px] text-primary hover:underline"
          >
            {allOn ? "Clear all" : "All departments"}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tree.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No departments in this school year.
          </p>
        ) : (
          tree.map((d) => {
            const on = programIds.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={on}
                onClick={() => onToggleProgram(d.id)}
                className={pillClass(on)}
              >
                {d.name}
              </button>
            );
          })
        )}
      </div>

      {programIds.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Pick at least one department to see its levels and sections.
        </p>
      ) : (
        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {tree
            .filter((d) => programIds.includes(d.id))
            .map((d) => {
              const deptSectionIds = d.groups.flatMap((g) =>
                g.levels.flatMap((l) => l.sections.map((s) => s.id)),
              );
              const deptVisible = d.groups.flatMap((g) =>
                g.kind === "course" && !courseIds.includes(g.id)
                  ? []
                  : g.kind === "strand" && !strandIds.includes(g.id)
                    ? []
                    : g.levels.flatMap((l) => l.sections.map((s) => s.id)),
              );
              if (deptSectionIds.length === 0) {
                return (
                  <div key={d.id} className="rounded-md border p-2">
                    <p className="text-xs font-medium">{d.name}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      No levels in this department yet.
                    </p>
                  </div>
                );
              }
              return (
                <div key={d.id} className="space-y-2">
                  {d.groups.map((g) => {
                    const groupOn =
                      g.kind === "course"
                        ? courseIds.includes(g.id)
                        : g.kind === "strand"
                          ? strandIds.includes(g.id)
                          : true;
                    const groupSectionIds = g.levels.flatMap((l) =>
                      l.sections.map((s) => s.id),
                    );
                    const groupAllOn =
                      groupSectionIds.length > 0 &&
                      groupSectionIds.every((id) => sectionIds.includes(id));
                    return (
                      <div key={g.id} className="rounded-md border p-2">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            {g.kind ? (
                              <button
                                type="button"
                                aria-pressed={groupOn}
                                onClick={() =>
                                  g.kind === "course"
                                    ? onToggleCourse(g.id)
                                    : onToggleStrand(g.id)
                                }
                                title={`Toggle ${g.name}`}
                                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border text-[10px] leading-none transition-colors ${
                                  groupOn
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-transparent hover:bg-muted"
                                }`}
                              >
                                ✓
                              </button>
                            ) : null}
                            <p className="truncate text-xs font-medium">
                              {g.kind ? (
                                g.name
                              ) : (
                                <>
                                  {d.name}
                                  <span className="font-normal text-muted-foreground">
                                    {" "}
                                    · levels
                                  </span>
                                </>
                              )}
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                ·{" "}
                                {
                                  groupSectionIds.filter((id) =>
                                    sectionIds.includes(id),
                                  ).length
                                }
                                /{groupSectionIds.length}
                              </span>
                            </p>
                          </div>
                          {groupOn && groupSectionIds.length > 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                onToggleGroupSections(
                                  groupSectionIds,
                                  groupAllOn,
                                )
                              }
                              className="shrink-0 text-[11px] text-primary hover:underline"
                            >
                              {groupAllOn ? "Clear" : "All"}
                            </button>
                          ) : null}
                        </div>
                        {!groupOn ? (
                          <p className="text-[11px] text-muted-foreground">
                            Excluded from this run — check the box to include
                            it.
                          </p>
                        ) : g.levels.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">
                            No levels here yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {g.levels.map((l) => {
                              const ids = l.sections.map((s) => s.id);
                              const allLevelOn =
                                ids.length > 0 &&
                                ids.every((id) => sectionIds.includes(id));
                              return (
                                <div key={l.id} className="rounded border p-1.5">
                                  <div className="mb-1 flex items-center justify-between gap-2">
                                    <p className="truncate text-[11px] font-medium">
                                      {l.name}
                                    </p>
                                    {ids.length > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onToggleLevelSections(
                                            ids,
                                            allLevelOn,
                                          )
                                        }
                                        className="shrink-0 text-[11px] text-primary hover:underline"
                                      >
                                        {allLevelOn ? "Clear" : "All"}
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
                                            onClick={() => onToggleSection(s.id)}
                                            className={chipClass(on)}
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
                    );
                  })}
                  {deptVisible.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                      Every course/strand in {d.name} is excluded — nothing
                      from it will generate.
                    </p>
                  ) : null}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
