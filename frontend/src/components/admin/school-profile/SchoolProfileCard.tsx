"use client";

import { useEffect, useMemo, useRef, useState } from "react"
import { Layers, LayoutList, Loader2, Database, Eye, Pencil, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useNavigationGuard } from "@/context/NavigationGuardContext"
import { toast } from "sonner"
import { isAxiosError } from "axios"
import type { ProgramType } from "@/types/admin/program.types"
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types"
import { useSchoolProfileData, useSaveSchoolProfile } from "@/hooks/admin/useSchoolProfile"
import { useSchoolProfileDraft } from "@/hooks/admin/useSchoolProfileDraft"
import { DepartmentStep } from "./DepartmentStep"
import { CourseStep } from "./CourseStep"
import { StrandStep } from "./StrandStep"
import { LevelStep } from "./LevelStep"
import { SectionStep } from "./SectionStep"
import { SubjectStep } from "./SubjectStep"
import { SharedSubjectStep } from "./SharedSubjectStep"
import type { DraftDepartment, DraftLevel } from "@/hooks/admin/useSchoolProfileDraft"

type Mode = "view" | "edit"

function LevelPillLabel({ level }: { level: DraftLevel }) {
  return (
    <span className="flex items-center gap-1.5">
      <span>{level.name}</span>
      <span className="text-[10px] font-normal opacity-70">
        {level.sections.length} sec · {level.subjects.length} subj
      </span>
    </span>
  );
}

function Card({ id, icon: Icon, title, children }: { id: string; icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className={`icon-container bg-[#BFDBFE] text-[#0B1E3A] border border-[#93C5FD] shrink-0 mt-0.5`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <h3 className="font-semibold text-lg leading-tight not-interactive">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function CollapsibleDepartmentCard({
  id,
  icon: Icon,
  title,
  defaultOpen,
  children,
}: {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  useEffect(() => setOpen(defaultOpen ?? false), [defaultOpen])
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className={`icon-container bg-[#BFDBFE] text-[#0B1E3A] border border-[#93C5FD] shrink-0 mt-0.5`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <h3 className="font-semibold text-lg leading-tight not-interactive">{title}</h3>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && <div className="px-6 pb-6 space-y-5">{children}</div>}
    </div>
  )
}

export function SchoolProfileCard() {
  const { data: profileData, isLoading } = useSchoolProfileData();
  const savedDepartments = profileData?.departments ?? [];
  const draft = useSchoolProfileDraft(profileData ?? []);
  const saveMutation = useSaveSchoolProfile();

  const hasSavedConfig = savedDepartments.length > 0;
  const [mode, setMode] = useState<Mode>("view");

  // Default to View the first time a saved config is detected (e.g. after
  // the initial fetch resolves); never force it back to View on later
  // renders so an admin actively editing isn't kicked out mid-edit.
  const [modeInitialized, setModeInitialized] = useState(false);
  useEffect(() => {
    if (!modeInitialized && !isLoading) {
      setMode(hasSavedConfig ? "view" : "edit");
      setModeInitialized(true);
    }
  }, [modeInitialized, isLoading, hasSavedConfig]);

  const readOnly = mode === "view";

  const [pendingDeselect, setPendingDeselect] = useState<ProgramType | null>(
    null,
  );
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);

  // Level-scoped accordion: single expanded course/strand and level per department.
  // Separate pill row (better UX) controls which Section/Subject editors are visible.
  // Close does not exclude data — seed still includes all levels.
  const [expandedCourseByDept, setExpandedCourseByDept] = useState<
    Record<string, string | null>
  >({});
  const [expandedLevelByDept, setExpandedLevelByDept] = useState<
    Record<string, string | null>
  >({});

  function toggleCourse(deptType: string, courseKey: string): void {
    setExpandedCourseByDept((prev) => {
      const cur = prev[deptType] ?? null;
      const next = cur === courseKey ? null : courseKey;
      return { ...prev, [deptType]: next };
    });
    setExpandedLevelByDept((prev) => ({ ...prev, [deptType]: null }));
  }

  function toggleLevel(deptType: string, levelKey: string): void {
    setExpandedLevelByDept((prev) => {
      const cur = prev[deptType] ?? null;
      const next = cur === levelKey ? null : levelKey;
      return { ...prev, [deptType]: next };
    });
  }

  const { setGuard } = useNavigationGuard();
  useEffect(() => {
    setGuard(() => !readOnly && draft.dirty);
    return () => setGuard(null);
  }, [draft.dirty, readOnly, setGuard]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!readOnly && draft.dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [draft.dirty, readOnly]);

  const savedTypes = useMemo(
    () => new Set(savedDepartments.map((d) => d.type as ProgramType)),
    [savedDepartments],
  );

  // View mode only ever shows departments that are actually saved/selected.
  // Edit mode shows every department (configured + untouched) via the
  // existing DepartmentStep toggle grid.
  // After the hydration fix, draft.departments mirrors savedDepartments when
  // not dirty, so filtering draft is stable; we also fallback to savedTypes
  // for pills so View never appears empty during the brief hydration window.
  const visibleDepartments = useMemo(() => {
    if (!readOnly) return Object.values(draft.departments);
    return Object.values(draft.departments).filter((d) =>
      savedTypes.has(d.type),
    );
  }, [readOnly, draft.departments, savedTypes]);

  // Open the first course/strand + its first level automatically so the
  // Sections & Subjects editors are visible without hunting for a pill.
  // The ref guard makes this a one-time action per department: once the user
  // collapses a pill we must not fight them and re-expand it.
  const autoOpenedDepartments = useRef<Set<string>>(new Set());

  useEffect(() => {
    const nextCourses: Record<string, string> = {};
    const nextLevels: Record<string, string> = {};

    for (const dept of Object.values(draft.departments)) {
      if (autoOpenedDepartments.current.has(dept.type)) continue;

      const groups =
        dept.type === "college"
          ? dept.courses
          : dept.type === "shs"
            ? dept.strands
            : [];
      const firstGroup = groups[0];
      const levels = firstGroup ? firstGroup.levels : dept.levels;

      if (firstGroup && expandedCourseByDept[dept.type] === undefined) {
        nextCourses[dept.type] = firstGroup.key;
      }
      if (levels.length > 0 && expandedLevelByDept[dept.type] === undefined) {
        const sorted = [...levels].sort((a, b) => a.orderIndex - b.orderIndex);
        nextLevels[dept.type] = sorted[0].key;
      }

      autoOpenedDepartments.current.add(dept.type);
    }

    if (Object.keys(nextCourses).length > 0) {
      setExpandedCourseByDept((prev) => ({ ...prev, ...nextCourses }));
    }
    if (Object.keys(nextLevels).length > 0) {
      setExpandedLevelByDept((prev) => ({ ...prev, ...nextLevels }));
    }
  }, [draft.departments, expandedCourseByDept, expandedLevelByDept]);
  const handleToggleDepartment = (type: ProgramType) => {
    if (readOnly) return;
    if (draft.selectedTypes.has(type)) {
      setPendingDeselect(type);
    } else {
      draft.selectDepartment(type);
    }
  };

  const confirmDeselect = () => {
    if (!pendingDeselect) return;
    draft.deselectDepartment(pendingDeselect);
    setPendingDeselect(null);
  };

  function requestModeChange(next: Mode): void {
    if (next === mode) return;
    // Switching away from edit with unsaved changes discards edits.
    if (!readOnly && draft.dirty) {
      setPendingMode(next);
      return;
    }
    setMode(next);
  }

  function confirmModeChange(): void {
    if (!pendingMode) return;
    draft.discardChanges();
    setMode(pendingMode);
    setPendingMode(null);
  }

  const handleSave = () => {
    saveMutation.mutate(
      {
        departments: Object.values(draft.departments),
      } as any,
      {
        onSuccess: () => {
          toast.success(
            "Configuration saved. The Data Seeder will now use this setup.",
          );
          draft.markSaved();
          setMode("view");
        },
        onError: (err: unknown) => {
          const message =
            isAxiosError<{ message?: string }>(err) &&
            err.response?.data?.message
              ? err.response.data.message
              : "Failed to save configuration. Please try again.";
          toast.error(message);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground not-interactive">
          Loading school profile…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasSavedConfig && (
        <div className="inline-flex rounded-lg border bg-muted/30 p-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn(
              "gap-1.5 rounded-md",
              mode === "view" && "bg-background shadow-sm",
            )}
            onClick={() => requestModeChange("view")}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn(
              "gap-1.5 rounded-md",
              mode === "edit" && "bg-background shadow-sm",
            )}
            onClick={() => requestModeChange("edit")}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      )}

      <Card id="departments" icon={Layers} title="Departments">
        {readOnly ? (
          <p className="text-xs text-muted-foreground not-interactive">
            Showing your configured departments. Switch to Edit to add more or
            make changes.
          </p>
        ) : null}
        <DepartmentStep
          selectedTypes={readOnly ? savedTypes : draft.selectedTypes}
          onToggle={handleToggleDepartment}
          disabled={readOnly || saveMutation.isPending}
          visibleTypesOverride={readOnly ? Array.from(savedTypes) : undefined}
        />
      </Card>

      {visibleDepartments.map((department) => {
        const isCollege = department.type === "college"
        const isShs = department.type === "shs"
        const expandedCourseKey = expandedCourseByDept[department.type] ?? null
        const expandedStrandKey = expandedCourseByDept[department.type] ?? null
        const expandedLevelKey = expandedLevelByDept[department.type] ?? null

        const activeCourse = isCollege ? department.courses.find((c) => c.key === expandedCourseKey) ?? null : null
        const activeStrand = isShs ? department.strands.find((s) => s.key === expandedStrandKey) ?? null : null

        const getActiveLevel = (): (typeof department.levels)[number] | null => {
          if (isCollege) {
            if (!activeCourse) return null
            return activeCourse.levels.find((l) => l.key === expandedLevelKey) ?? null
          }
          if (isShs) {
            if (!activeStrand) return null
            return activeStrand.levels.find((l) => l.key === expandedLevelKey) ?? null
          }
          return department.levels.find((l) => l.key === expandedLevelKey) ?? null
        }
        const levelOptions = isCollege
          ? department.courses.flatMap((c) =>
              c.levels.map((l) => ({ key: l.key, label: `${c.name} · ${l.name}` })),
            )
          : isShs
            ? department.strands.flatMap((s) =>
                s.levels.map((l) => ({ key: l.key, label: `${s.name} · ${l.name}` })),
              )
            : department.levels.map((l) => ({ key: l.key, label: l.name }))
        const activeLevel = getActiveLevel()

        const content = (
          <div className="space-y-5">
            {isCollege && (
              <CourseStep
                departmentId={department.type}
                courses={department.courses}
                disabled={readOnly || saveMutation.isPending}
                onAdd={(_, name) => draft.addCourse(department.type, name)}
                onRename={(courseKey, name) => draft.renameCourse(department.type, courseKey, name)}
                onDelete={(courseKey) => draft.deleteCourse(department.type, courseKey)}
              />
            )}

            {isShs && (
              <StrandStep
                departmentId={department.type}
                strands={department.strands}
                disabled={readOnly || saveMutation.isPending}
                onAdd={(_, name) => draft.addStrand(department.type, name)}
                onRename={(strandKey, name) => draft.renameStrand(department.type, strandKey, name)}
                onDelete={(strandKey) => draft.deleteStrand(department.type, strandKey)}
              />
            )}

            {isCollege &&
              department.courses.map((course) => (
                <LevelStep
                  key={course.key}
                  parentId={course.key}
                  groupLabel={course.name}
                  levels={course.levels}
                  disabled={readOnly || saveMutation.isPending}
                  onAdd={(parentKey, name) => draft.addLevel(department.type, parentKey, name)}
                  onRename={(levelKey, name) => draft.renameLevel(department.type, levelKey, name)}
                  onDelete={(levelKey) => draft.deleteLevel(department.type, levelKey)}
                />
              ))}

            {isShs &&
              department.strands.map((strand) => (
                <LevelStep
                  key={strand.key}
                  parentId={strand.key}
                  groupLabel={strand.name}
                  levels={strand.levels}
                  disabled={readOnly || saveMutation.isPending}
                  onAdd={(parentKey, name) => draft.addLevel(department.type, parentKey, name)}
                  onRename={(levelKey, name) => draft.renameLevel(department.type, levelKey, name)}
                  onDelete={(levelKey) => draft.deleteLevel(department.type, levelKey)}
                />
              ))}

            {!isCollege && !isShs && (
              <LevelStep
                parentId={department.type}
                groupLabel="Levels"
                levels={department.levels}
                disabled={readOnly || saveMutation.isPending}
                onAdd={(parentKey, name) => draft.addLevel(department.type, parentKey, name)}
                onRename={(levelKey, name) => draft.renameLevel(department.type, levelKey, name)}
                onDelete={(levelKey) => draft.deleteLevel(department.type, levelKey)}
              />
            )}

            {/* Separate pill row — level scoped accordion (course/strand → level) */}
            {isCollege && department.courses.length > 0 && (
              <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
                <p className="text-xs font-medium text-muted-foreground not-interactive">Select a course, then a level to edit its sections &amp; subjects</p>
                <div className="flex flex-wrap gap-2">
                  {department.courses.map((course) => {
                    const selected = expandedCourseKey === course.key
                    return (
                      <button
                        key={course.key}
                        type="button"
                        onClick={() => toggleCourse(department.type, course.key)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-background hover:bg-muted/50 border-muted-foreground/20",
                        )}
                      >
                        {course.name}
                      </button>
                    )
                  })}
                </div>
                {activeCourse && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground not-interactive">Levels in {activeCourse.name} — sections &amp; subjects</p>
                    <div className="flex flex-wrap gap-2">
                      {[...activeCourse.levels]
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((level) => {
                          const selected = expandedLevelKey === level.key
                          return (
                            <button
                              key={level.key}
                              type="button"
                              onClick={() => toggleLevel(department.type, level.key)}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "bg-background hover:bg-muted/50 border-muted-foreground/20",
                              )}
                            >
                              <LevelPillLabel level={level} />
                            </button>
                          )
                        })}
                    </div>
                    {activeCourse.levels.length === 0 && (
                      <p className="text-xs text-muted-foreground not-interactive">No levels in this course yet. Add one above.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {isShs && department.strands.length > 0 && (
              <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
                <p className="text-xs font-medium text-muted-foreground not-interactive">Select a strand, then a level to edit its sections &amp; subjects</p>
                <div className="flex flex-wrap gap-2">
                  {department.strands.map((strand) => {
                    const selected = expandedStrandKey === strand.key
                    return (
                      <button
                        key={strand.key}
                        type="button"
                        onClick={() => toggleCourse(department.type, strand.key)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-background hover:bg-muted/50 border-muted-foreground/20",
                        )}
                      >
                        {strand.name}
                      </button>
                    )
                  })}
                </div>
                {activeStrand && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground not-interactive">Levels in {activeStrand.name} — sections &amp; subjects</p>
                    <div className="flex flex-wrap gap-2">
                      {[...activeStrand.levels]
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((level) => {
                          const selected = expandedLevelKey === level.key
                          return (
                            <button
                              key={level.key}
                              type="button"
                              onClick={() => toggleLevel(department.type, level.key)}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "bg-background hover:bg-muted/50 border-muted-foreground/20",
                              )}
                            >
                              <LevelPillLabel level={level} />
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isCollege && !isShs && department.levels.length > 0 && (
              <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
                <p className="text-xs font-medium text-muted-foreground not-interactive">Select a level to edit its sections &amp; subjects</p>
                <div className="flex flex-wrap gap-2">
                  {[...department.levels]
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((level) => {
                      const selected = expandedLevelKey === level.key
                      return (
                        <button
                          key={level.key}
                          type="button"
                          onClick={() => toggleLevel(department.type, level.key)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "bg-background hover:bg-muted/50 border-muted-foreground/20",
                          )}
                        >
                          <LevelPillLabel level={level} />
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Level-scoped editors — single expanded level only (accordion) */}
            {activeLevel ? (
              <div className="space-y-3">
                <SectionStep
                  levelId={activeLevel.key}
                  levelLabel={`${activeLevel.name} — Sections`}
                  sections={activeLevel.sections}
                  disabled={readOnly || saveMutation.isPending}
                  onAdd={(levelKey, name, capacity) => draft.addSection(department.type, activeLevel.key, name, capacity)}
                  onUpdate={(sectionKey, name, capacity) => draft.updateSection(department.type, activeLevel.key, sectionKey, name, capacity)}
                  onDelete={(sectionKey) => draft.deleteSection(department.type, activeLevel.key, sectionKey)}
                />
                <SubjectStep
                  levelId={activeLevel.key}
                  levelLabel={`${activeLevel.name} — Subjects`}
                  subjects={activeLevel.subjects}
                  disabled={readOnly || saveMutation.isPending}
                  onAdd={(levelKey, name, subjectType) => draft.addSubject(department.type, activeLevel.key, name, subjectType)}
                  onRename={(subjectKey, name) => draft.renameSubject(department.type, activeLevel.key, subjectKey, name)}
                  onDelete={(subjectKey) => draft.deleteSubject(department.type, activeLevel.key, subjectKey)}
                  onSetType={(subjectKey, subjectType) => draft.setSubjectType(department.type, activeLevel.key, subjectKey, subjectType)}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground not-interactive rounded-lg border border-dashed p-3 text-center">
                {isCollege && department.courses.length === 0
                  ? "This department has no courses yet. Add a course above to create its levels, sections & subjects."
                  : isShs && department.strands.length === 0
                    ? "This department has no strands yet. Add a strand above to create its levels, sections & subjects."
                    : isCollege && activeCourse && activeCourse.levels.length === 0
                      ? "This course has no levels yet. Add one above to create its sections & subjects."
                      : isShs && activeStrand && activeStrand.levels.length === 0
                        ? "This strand has no levels yet. Add one above to create its sections & subjects."
                        : isCollege || isShs
                          ? "Select a level above to edit its sections & subjects."
                          : "Select a level above to edit its sections & subjects."}
              </p>
            )}
            <SharedSubjectStep
              subjects={department.subjects}
              levelOptions={levelOptions}
              disabled={readOnly || saveMutation.isPending}
              onAdd={(name) => draft.addSubject(department.type, activeLevel?.key ?? "", name, "minor")}
              onRename={(subjectKey, name) => draft.renameSharedSubject(department.type, subjectKey, name)}
              onDelete={(subjectKey) => draft.deleteSharedSubject(department.type, subjectKey)}
              onPromote={(subjectKey, levelKey) => draft.promoteSharedSubjectToLevel(department.type, subjectKey, levelKey)}
            />
          </div>
        )
        return readOnly ? (
          <CollapsibleDepartmentCard
            key={department.type}
            id="structure"
            icon={LayoutList}
            title={PROGRAM_TYPE_LABELS[department.type]}
            defaultOpen={false}
          >
            {content}
          </CollapsibleDepartmentCard>
        ) : (
          <Card key={department.type} id="structure" icon={LayoutList} title={PROGRAM_TYPE_LABELS[department.type]}>
            {content}
          </Card>
        )
      })}

      {/*
        Grading scales/schemes and semester terms are global setups managed on
        their dedicated pages — not part of the school profile.
      */}
      {!readOnly && draft.selectedTypes.size > 0 && (
        <Card id="save" icon={Database} title="Save Configuration">
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground not-interactive">
              Saving replaces the Data Seeder&apos;s predefined data for your
              selected departments with this configuration. Unselected
              departments are left untouched.
            </p>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="shrink-0"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!pendingDeselect}
        title="Remove this department?"
        message={
          pendingDeselect
            ? `This removes "${PROGRAM_TYPE_LABELS[pendingDeselect]}" from your configuration draft. It won't be saved unless you click Save Configuration — your existing saved data (if any) stays untouched until then.`
            : ""
        }
        confirmLabel="Remove from Draft"
        destructive
        onConfirm={confirmDeselect}
        onOpenChange={(o) => {
          if (!o) setPendingDeselect(null);
        }}
      />

      <ConfirmDialog
        open={!!pendingMode}
        title="Discard unsaved changes?"
        message="You have unsaved configuration edits. Switching mode will discard them."
        confirmLabel="Discard changes"
        destructive
        onConfirm={confirmModeChange}
        onOpenChange={(o) => {
          if (!o) setPendingMode(null);
        }}
      />
    </div>
  );
}
