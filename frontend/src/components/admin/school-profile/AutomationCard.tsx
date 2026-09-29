"use client"

import { Zap } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { useOrganization, useUpdateOrganization } from "@/hooks/admin/useOrganization"
import { Card } from "./ui/ProfileCard"

/**
 * "Auto-seed new school years" toggle. When on, SchoolYearService.create()
 * seeds every newly created school year from this saved School Profile
 * automatically (no prompt). When off, CreateSchoolYearDialog asks the admin
 * after creation instead. See backend school-year.service.ts#maybeAutoSeed.
 */
export function AutomationCard() {
  const { data: organization } = useOrganization()
  const updateOrgMutation = useUpdateOrganization()

  function handleToggle(checked: boolean): void {
    updateOrgMutation.mutate(
      { autoSeedNewSchoolYears: checked },
      {
        onSuccess: () => {
          toast.success(
            checked
              ? "New school years will now be seeded automatically from this configuration."
              : "You'll be asked each time a new school year is created.",
          )
        },
        onError: () => toast.error("Failed to update the setting."),
      },
    )
  }

  return (
    <Card id="automation" icon={Zap} title="Automation">
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Auto-seed new school years</p>
          <p className="text-xs text-muted-foreground not-interactive">
            When on, every new school year is automatically seeded with this
            configuration — no prompt. When off, you&apos;ll be asked each time.
          </p>
        </div>
        <Switch
          checked={!!organization?.autoSeedNewSchoolYears}
          onCheckedChange={handleToggle}
          disabled={updateOrgMutation.isPending}
        />
      </div>
    </Card>
  )
}