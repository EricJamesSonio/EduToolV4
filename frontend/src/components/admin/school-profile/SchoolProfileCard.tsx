"use client"

import { Layers, Loader2, Database, Eye, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { toast } from "sonner"
import { isAxiosError } from "axios"
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types"
import { useSchoolProfileData, useSaveSchoolProfile } from "@/hooks/admin/useSchoolProfile"
import { useSchoolProfileDraft } from "@/hooks/admin/useSchoolProfileDraft"
import { useSchoolProfileCardState } from "./hooks/useSchoolProfileCardState"
import { DepartmentStep } from "./DepartmentStep"
import { AutomationCard } from "./AutomationCard"
import { DepartmentSection } from "./DepartmentSection"
import { Card } from "./ui/ProfileCard"

export function SchoolProfileCard() {
  const { data: profileData, isLoading } = useSchoolProfileData()
  const savedDepartments = profileData?.departments ?? []
  const draft = useSchoolProfileDraft(profileData ?? [])
  const saveMutation = useSaveSchoolProfile()

  const {
    mode,
    setMode,
    readOnly,
    savedTypes,
    visibleDepartments,
    pendingDeselect,
    setPendingDeselect,
    confirmDeselect,
    pendingMode,
    setPendingMode,
    requestModeChange,
    confirmModeChange,
    expandedCourseByDept,
    expandedLevelByDept,
    toggleCourse,
    toggleLevel,
    handleToggleDepartment,
  } = useSchoolProfileCardState(draft, savedDepartments, isLoading)

  const hasSavedConfig = savedDepartments.length > 0

  function handleSave(): void {
    saveMutation.mutate(
      { departments: Object.values(draft.departments) } as any,
      {
        onSuccess: () => {
          toast.success("Configuration saved. The Data Seeder will now use this setup.")
          draft.markSaved()
          setMode("view")
        },
        onError: (err: unknown) => {
          const message =
            isAxiosError<{ message?: string }>(err) && err.response?.data?.message
              ? err.response.data.message
              : "Failed to save configuration. Please try again."
          toast.error(message)
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground not-interactive">Loading school profile…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {hasSavedConfig && (
        <div className="inline-flex rounded-lg border bg-muted/30 p-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn("gap-1.5 rounded-md", mode === "view" && "bg-background shadow-sm")}
            onClick={() => requestModeChange("view")}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn("gap-1.5 rounded-md", mode === "edit" && "bg-background shadow-sm")}
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
            Showing your configured departments. Switch to Edit to add more or make changes.
          </p>
        ) : null}
        <DepartmentStep
          selectedTypes={readOnly ? savedTypes : draft.selectedTypes}
          onToggle={handleToggleDepartment}
          disabled={readOnly || saveMutation.isPending}
          visibleTypesOverride={readOnly ? Array.from(savedTypes) : undefined}
        />
      </Card>

      <AutomationCard />

      {visibleDepartments.map((department) => (
        <DepartmentSection
          key={department.type}
          department={department}
          readOnly={readOnly}
          saving={saveMutation.isPending}
          expandedCourseKey={expandedCourseByDept[department.type] ?? null}
          expandedLevelKey={expandedLevelByDept[department.type] ?? null}
          onToggleCourse={(key) => toggleCourse(department.type, key)}
          onToggleLevel={(key) => toggleLevel(department.type, key)}
          draft={draft}
        />
      ))}

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
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="shrink-0">
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
          if (!o) setPendingDeselect(null)
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
          if (!o) setPendingMode(null)
        }}
      />
    </div>
  )
}