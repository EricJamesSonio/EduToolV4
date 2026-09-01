"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Layers,
  Loader2,
  Database,
  Eye,
  Pencil,
  Scale,
  BarChart3,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useNavigationGuard } from "@/context/NavigationGuardContext";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import type { ProgramType } from "@/types/admin/program.types";
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types";
import {
  useSchoolProfileData,
  useSaveSchoolProfile,
} from "@/hooks/admin/useSchoolProfile";
import { useSchoolProfileDraft } from "@/hooks/admin/useSchoolProfileDraft";
import { DepartmentStep } from "./DepartmentStep";
import { Card } from "./ui/SectionCard";
import { SchoolProfileDepartmentStructureSection } from "./SchoolProfileDepartmentStructureSection";
import { SchoolProfileGradingScaleSection } from "./SchoolProfileGradingScaleSection";
import { SchoolProfileGradingSchemeSection } from "./SchoolProfileGradingSchemeSection";
import { SchoolProfileSemesterTermsSection } from "./SchoolProfileSemesterTermsSection";

type Mode = "view" | "edit";

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
        gradingScales: Object.values(draft.gradingScales),
        gradingSchemes: Object.values(draft.gradingSchemes),
        semesterTermConfigs: Object.values(draft.semesterConfigs),
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

      <SchoolProfileDepartmentStructureSection
        departments={visibleDepartments}
        draft={draft}
        readOnly={readOnly}
        savePending={saveMutation.isPending}
        expandedCourseByDept={expandedCourseByDept}
        expandedLevelByDept={expandedLevelByDept}
        onToggleCourse={toggleCourse}
        onToggleLevel={toggleLevel}
      />

      {visibleDepartments.length > 0 && (
        <Card id="grading-scales" icon={BarChart3} title="Grading Scales — Configuration">
          {readOnly ? (
            <p className="text-xs text-muted-foreground not-interactive">
              Showing configured grading scales. Switch to Edit to modify.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground not-interactive">
              One scale per department. Edit name and grade ranges. Changes will
              be used by the Data Seeder.
            </p>
          )}
          <SchoolProfileGradingScaleSection
            departments={visibleDepartments}
            draft={draft}
            readOnly={readOnly}
            saveMutationPending={saveMutation.isPending}
          />
        </Card>
      )}

      {visibleDepartments.length > 0 && (
        <Card id="grading-schemes" icon={Scale} title="Grading Schemes — Configuration">
          {readOnly ? (
            <p className="text-xs text-muted-foreground not-interactive">
              Showing configured grading schemes. Switch to Edit to modify.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground not-interactive">
              One scheme per department. Weights must sum to 100. Configured
              here, seeded in Data Seeder.
            </p>
          )}
          <SchoolProfileGradingSchemeSection
            departments={visibleDepartments}
            draft={draft}
            readOnly={readOnly}
            saveMutationPending={saveMutation.isPending}
          />
        </Card>
      )}

      {visibleDepartments.length > 0 && (
        <Card id="semester-terms" icon={Calendar} title="Semester Terms — Configuration">
          {readOnly ? (
            <p className="text-xs text-muted-foreground not-interactive">
              Showing configured semester term names. Data Seeder generates
              semesters from the academic calendar; each semester gets these
              terms.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground not-interactive">
              One term list per department. Edit term names; the Data Seeder
              will create N semesters from the calendar, each with these terms.
              College default: Prelim / Midterm / Finals.
            </p>
          )}
          <SchoolProfileSemesterTermsSection
            departments={visibleDepartments}
            draft={draft}
            readOnly={readOnly}
            saveMutationPending={saveMutation.isPending}
          />
        </Card>
      )}

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
