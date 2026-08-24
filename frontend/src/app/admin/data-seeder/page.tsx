"use client"

import { useState } from "react"
import { PageHeader } from "@/components/shared/PageHeader"
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide"
import { SeederCard } from "@/components/admin/data-seeder/SeederCard"
import { SchoolProfileCard } from "@/components/admin/school-profile/SchoolProfileCard"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useNavigationGuard } from "@/context/NavigationGuardContext"
import { cn } from "@/lib/utils"

type Mode = "seed" | "configure"

export default function DataSeederPage(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>("seed")
  const [pendingMode, setPendingMode] = useState<Mode | null>(null)
  const { isDirty } = useNavigationGuard()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Seeder"
        actions={<HelpGuide slug="admin_data_seeder" />}
      />

      <div className="inline-flex rounded-lg border bg-muted/30 p-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(
            "rounded-md",
            mode === "seed" && "bg-background shadow-sm",
          )}
          onClick={() => {
            if (mode === "seed") return
            if (isDirty()) {
              setPendingMode("seed")
              return
            }
            setMode("seed")
          }}
        >
          Seed a School Year
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(
            "rounded-md",
            mode === "configure" && "bg-background shadow-sm",
          )}
          onClick={() => {
            if (mode === "configure") return
            if (isDirty()) {
              setPendingMode("configure")
              return
            }
            setMode("configure")
          }}
        >
          Configure School Profile
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