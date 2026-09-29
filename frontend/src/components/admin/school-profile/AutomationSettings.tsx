"use client"

import { Settings2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useOrganization, useUpdateOrganization } from "@/hooks/admin/useOrganization"

/**
 * Settings icon → popover with the "Auto-seed new school years" toggle.
 * Replaces the old full-width AutomationCard.
 *
 * When on, SchoolYearService.create() seeds every newly created school year
 * from the saved School Profile automatically. When off, CreateSchoolYearDialog
 * asks the admin after creation instead (backend: school-year.service.ts#maybeAutoSeed).
 */
export function AutomationSettings() {
  const { data: organization } = useOrganization()
  const updateOrgMutation = useUpdateOrganization()
  const enabled = !!organization?.autoSeedNewSchoolYears

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
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Automation settings"
            title="Automation settings"
            className="relative h-9 w-9"
          />
        }
      >
        <Settings2 className="h-4 w-4" />
        {enabled && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#22C55E] ring-2 ring-background" />
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 gap-3 p-3">
        <PopoverHeader>
          <PopoverTitle>Automation</PopoverTitle>
        </PopoverHeader>

        <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/20 p-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">Auto-seed new school years</p>
            <p className="text-xs text-muted-foreground not-interactive">
              {enabled
                ? "On — new school years are seeded from this profile automatically."
                : "Off — you'll be asked each time a school year is created."}
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={updateOrgMutation.isPending}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}