"use client"

import { useEffect, useState } from "react"
import { School } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide"
import { SeederCard } from "@/components/admin/data-seeder/SeederCard"
import { SchoolProfileCard } from "@/components/admin/school-profile/SchoolProfileCard"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useNavigationGuard } from "@/context/NavigationGuardContext"
import { useSchoolProfileData } from "@/hooks/admin/useSchoolProfile"
import { cn } from "@/lib/utils"

type Mode = "seed" | "configure"

export default function DataSeederPage(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>("configure")
  const [pendingMode, setPendingMode] = useState<Mode | null>(null)
  const { isDirty } = useNavigationGuard()
  const { data: profileData, isLoading: profileLoading } = useSchoolProfileData()

  // A profile counts as configured once at least one department is saved.
  // Seeding a school year builds on that structure, so it stays locked until
  // then — the seeder is never usable against an empty blueprint.
  const hasProfile = (profileData?.departments?.length ?? 0) > 0
  const seedDisabled = profileLoading || !hasProfile

  // Never leave the Seeder mounted if the profile disappears underneath us
  // (e.g. the last department was removed and saved).
  useEffect(() => {
    if (mode === "seed" && seedDisabled) setMode("configure")
  }, [mode, seedDisabled])

  function requestMode(next: Mode) {
    if (next === mode) return
    if (next === "seed" && seedDisabled) return
    if (isDirty()) {
      setPendingMode(next)
      return
    }
    setMode(next)
  }

  const showProfileNotice = !profileLoading && !hasProfile

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Profile"
        actions={<HelpGuide slug="admin_data_seeder" />}
      />

      {showProfileNotice && (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="icon-container bg-[#BFDBFE] text-[#0B1E3A] border border-[#93C5FD] shrink-0 mt-0.5">
              <School className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg leading-tight not-interactive">
                No school profile configured yet
              </h3>
              <p className="text-xs text-muted-foreground not-interactive">
                Configure and save your school profile first. Select the
                departments you offer and define their courses, strands,
                levels, sections, and subjects — the school year seeder builds
                on that configuration.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => setMode("configure")}
          >
            Configure School Profile
          </Button>
        </div>
      )}

      <div className="inline-flex rounded-lg border bg-muted/30 p-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(
            "rounded-md",
            mode === "configure" && "bg-background shadow-sm",
          )}
          onClick={() => requestMode("configure")}
        >
          Configure School Profile
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={seedDisabled}
          title={
            seedDisabled
              ? "Configure and save your school profile first."
              : undefined
          }
          className={cn(
            "rounded-md",
            mode === "seed" && "bg-background shadow-sm",
          )}
          onClick={() => requestMode("seed")}
        >
          Seed a School Year
        </Button>
      </div>

      {mode === "seed" ? <SeederCard /> : <SchoolProfileCard />}

      <ConfirmDialog
        open={!!pendingMode}
        title="Discard unsaved changes?"
        message="You have unsaved edits that will be discarded if you switch. Continue?"
        confirmLabel="Discard and switch"
        destructive
        onConfirm={() => {
          if (pendingMode) setMode(pendingMode)
          setPendingMode(null)
        }}
        onOpenChange={(o) => {
          if (!o) setPendingMode(null)
        }}
      />
    </div>
  )
}