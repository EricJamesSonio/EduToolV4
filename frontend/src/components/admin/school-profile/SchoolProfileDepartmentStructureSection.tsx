import { LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSchoolProfileDraft } from "@/hooks/admin/useSchoolProfileDraft";
import type { DraftDepartment } from "@/hooks/admin/useSchoolProfileDraft";
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types";
import { CourseStep } from "./CourseStep";
import { StrandStep } from "./StrandStep";
import { LevelStep } from "./LevelStep";
import { SectionStep } from "./SectionStep";
import { SubjectStep } from "./SubjectStep";
import { Card, CollapsibleDepartmentCard } from "./ui/SectionCard";

type SchoolProfileDraft = ReturnType<typeof useSchoolProfileDraft>;

type Props = {
  departments: DraftDepartment[];
  draft: SchoolProfileDraft;
  readOnly: boolean;
  savePending: boolean;
  expandedCourseByDept: Record<string, string | null>;
  expandedLevelByDept: Record<string, string | null>;
  onToggleCourse: (deptType: string, courseKey: string) => void;
  onToggleLevel: (deptType: string, levelKey: string) => void;
};

export function SchoolProfileDepartmentStructureSection({
  departments,
  draft,
  readOnly,
  savePending,
  expandedCourseByDept,
  expandedLevelByDept,
  onToggleCourse,
  onToggleLevel,
}: Props) {
  return (
    <>
      {departments.map((department) => {
        const isCollege = department.type === "college";
        const isShs = department.type === "shs";
        const expandedCourseKey = expandedCourseByDept[department.type] ?? null;
        const expandedStrandKey = expandedCourseByDept[department.type] ?? null;
        const expandedLevelKey = expandedLevelByDept[department.type] ?? null;

        const activeCourse = isCollege
          ? (department.courses.find((course) => course.key === expandedCourseKey) ?? null)
          : null;
        const activeStrand = isShs
          ? (department.strands.find((strand) => strand.key === expandedStrandKey) ?? null)
          : null;

        const activeLevel = (() => {
          if (isCollege) {
            if (!activeCourse) return null;
            return activeCourse.levels.find((level) => level.key === expandedLevelKey) ?? null;
          }
          if (isShs) {
            if (!activeStrand) return null;
            return activeStrand.levels.find((level) => level.key === expandedLevelKey) ?? null;
          }
          return department.levels.find((level) => level.key === expandedLevelKey) ?? null;
        })();

        const content = (
          <div className="space-y-5">
            {isCollege && (
              <CourseStep
                departmentId={department.type}
                courses={department.courses}
                disabled={readOnly || savePending}
                onAdd={(_, name) => draft.addCourse(department.type, name)}
                onRename={(courseKey, name) =>
                  draft.renameCourse(department.type, courseKey, name)
                }
                onDelete={(courseKey) =>
                  draft.deleteCourse(department.type, courseKey)
                }
              />
            )}

            {isShs && (
              <StrandStep
                departmentId={department.type}
                strands={department.strands}
                disabled={readOnly || savePending}
                onAdd={(_, name) => draft.addStrand(department.type, name)}
                onRename={(strandKey, name) =>
                  draft.renameStrand(department.type, strandKey, name)
                }
                onDelete={(strandKey) =>
                  draft.deleteStrand(department.type, strandKey)
                }
              />
            )}

            {isCollege &&
              department.courses.map((course) => (
                <LevelStep
                  key={course.key}
                  parentId={course.key}
                  groupLabel={course.name}
                  levels={course.levels}
                  disabled={readOnly || savePending}
                  onAdd={(parentKey, name) =>
                    draft.addLevel(department.type, parentKey, name)
                  }
                  onRename={(levelKey, name) =>
                    draft.renameLevel(department.type, levelKey, name)
                  }
                  onDelete={(levelKey) =>
                    draft.deleteLevel(department.type, levelKey)
                  }
                />
              ))}

            {isShs &&
              department.strands.map((strand) => (
                <LevelStep
                  key={strand.key}
                  parentId={strand.key}
                  groupLabel={strand.name}
                  levels={strand.levels}
                  disabled={readOnly || savePending}
                  onAdd={(parentKey, name) =>
                    draft.addLevel(department.type, parentKey, name)
                  }
                  onRename={(levelKey, name) =>
                    draft.renameLevel(department.type, levelKey, name)
                  }
                  onDelete={(levelKey) =>
                    draft.deleteLevel(department.type, levelKey)
                  }
                />
              ))}

            {!isCollege && !isShs && (
              <LevelStep
                parentId={department.type}
                groupLabel="Levels"
                levels={department.levels}
                disabled={readOnly || savePending}
                onAdd={(parentKey, name) =>
                  draft.addLevel(department.type, parentKey, name)
                }
                onRename={(levelKey, name) =>
                  draft.renameLevel(department.type, levelKey, name)
                }
                onDelete={(levelKey) =>
                  draft.deleteLevel(department.type, levelKey)
                }
              />
            )}

            {isCollege && department.courses.length > 0 && (
              <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
                <p className="text-xs font-medium text-muted-foreground not-interactive">
                  Select a course to view its levels
                </p>
                <div className="flex flex-wrap gap-2">
                  {department.courses.map((course) => {
                    const selected = expandedCourseKey === course.key;
                    return (
                      <button
                        key={course.key}
                        type="button"
                        onClick={() => onToggleCourse(department.type, course.key)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-background hover:bg-muted/50 border-muted-foreground/20",
                        )}
                      >
                        {course.name}
                      </button>
                    );
                  })}
                </div>
                {activeCourse && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground not-interactive">
                      Levels in {activeCourse.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[...activeCourse.levels]
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((level) => {
                          const selected = expandedLevelKey === level.key;
                          return (
                            <button
                              key={level.key}
                              type="button"
                              onClick={() => onToggleLevel(department.type, level.key)}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "bg-background hover:bg-muted/50 border-muted-foreground/20",
                              )}
                            >
                              {level.name}
                            </button>
                          );
                        })}
                    </div>
                    {activeCourse.levels.length === 0 && (
                      <p className="text-xs text-muted-foreground not-interactive">
                        No levels in this course yet. Add one above.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {isShs && department.strands.length > 0 && (
              <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
                <p className="text-xs font-medium text-muted-foreground not-interactive">
                  Select a strand to view its levels
                </p>
                <div className="flex flex-wrap gap-2">
                  {department.strands.map((strand) => {
                    const selected = expandedStrandKey === strand.key;
                    return (
                      <button
                        key={strand.key}
                        type="button"
                        onClick={() => onToggleCourse(department.type, strand.key)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-background hover:bg-muted/50 border-muted-foreground/20",
                        )}
                      >
                        {strand.name}
                      </button>
                    );
                  })}
                </div>
                {activeStrand && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground not-interactive">
                      Levels in {activeStrand.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[...activeStrand.levels]
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((level) => {
                          const selected = expandedLevelKey === level.key;
                          return (
                            <button
                              key={level.key}
                              type="button"
                              onClick={() => onToggleLevel(department.type, level.key)}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "bg-background hover:bg-muted/50 border-muted-foreground/20",
                              )}
                            >
                              {level.name}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isCollege && !isShs && department.levels.length > 0 && (
              <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
                <p className="text-xs font-medium text-muted-foreground not-interactive">
                  Select a level to edit sections & subjects
                </p>
                <div className="flex flex-wrap gap-2">
                  {[...department.levels]
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((level) => {
                      const selected = expandedLevelKey === level.key;
                      return (
                        <button
                          key={level.key}
                          type="button"
                          onClick={() => onToggleLevel(department.type, level.key)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "bg-background hover:bg-muted/50 border-muted-foreground/20",
                          )}
                        >
                          {level.name}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {activeLevel ? (
              <div className="space-y-3">
                <SectionStep
                  levelId={activeLevel.key}
                  levelLabel={`${activeLevel.name} — Sections`}
                  sections={activeLevel.sections}
                  disabled={readOnly || savePending}
                  onAdd={(levelKey, name, capacity) =>
                    draft.addSection(department.type, activeLevel.key, name, capacity)
                  }
                  onUpdate={(sectionKey, name, capacity) =>
                    draft.updateSection(
                      department.type,
                      activeLevel.key,
                      sectionKey,
                      name,
                      capacity,
                    )
                  }
                  onDelete={(sectionKey) =>
                    draft.deleteSection(department.type, activeLevel.key, sectionKey)
                  }
                />
                <SubjectStep
                  levelId={activeLevel.key}
                  levelLabel={`${activeLevel.name} — Subjects`}
                  subjects={activeLevel.subjects}
                  disabled={readOnly || savePending}
                  onAdd={(levelKey, name) =>
                    draft.addSubject(department.type, activeLevel.key, name)
                  }
                  onRename={(subjectKey, name) =>
                    draft.renameSubject(
                      department.type,
                      activeLevel.key,
                      subjectKey,
                      name,
                    )
                  }
                  onDelete={(subjectKey) =>
                    draft.deleteSubject(
                      department.type,
                      activeLevel.key,
                      subjectKey,
                    )
                  }
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground not-interactive rounded-lg border border-dashed p-3 text-center">
                {isCollege && !activeCourse
                  ? "Select a course above to see its levels."
                  : isShs && !activeStrand
                    ? "Select a strand above to see its levels."
                    : isCollege || isShs
                      ? "Select a level to edit its sections & subjects."
                      : "Select a level above to edit its sections & subjects."}
              </p>
            )}
          </div>
        );

        const cardProps = {
          key: department.type,
          id: "structure",
          icon: LayoutList,
          title: PROGRAM_TYPE_LABELS[department.type],
        };

        return readOnly ? (
          <CollapsibleDepartmentCard {...cardProps} defaultOpen={false}>
            {content}
          </CollapsibleDepartmentCard>
        ) : (
          <Card {...cardProps}>{content}</Card>
        );
      })}
    </>
  );
}
