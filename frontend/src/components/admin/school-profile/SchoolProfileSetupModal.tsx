"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Database, Layers, ListChecks, School } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useSchoolProfileData } from "@/hooks/admin/useSchoolProfile"
import { useOrganization } from "@/hooks/admin/useOrganization"
import { ICON_TONES, type IconTone } from "@/lib/palette"
import {
  SCHOOL_PROFILE_SETUP_PROMPT,
  hasPromptBeenShown,
  markPromptShown,
} from "@/utils/sessionPrompts"

const SCHOOL_PROFILE_ROUTE = "/admin/data-seeder"

const STEPS: { icon: typeof Layers; tone: IconTone; text: string }[] = [
  { icon: Layers, tone: "blue", text: "Select the departments your school offers" },
  { icon: ListChecks, tone: "purple", text: "Add courses, strands, levels, sections, and subjects" },
  { icon: Database, tone: "green", text: "Save it — the school year seeder builds on it" },
]

/**
 * Shows once per login session when the school has no saved profile.
 * Mount once in the admin layout (next to AdminWelcomeModal).
 *
 * The flag is set the moment the modal opens, so dismissing it — or visiting
 * again without a profile — won't reopen it. Logout clears the flag.
 */
export function SchoolProfileSetupModal() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: organization } = useOrganization()
  const { data: profileData } = useSchoolProfileData()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Wait for real data; skip if no org yet (AdminWelcomeModal handles that).
    if (!organization || profileData === undefined) return
    if ((profileData.departments?.length ?? 0) > 0) return
    if (hasPromptBeenShown(SCHOOL_PROFILE_SETUP_PROMPT)) return

    markPromptShown(SCHOOL_PROFILE_SETUP_PROMPT)
    setOpen(true)
  }, [organization, profileData])

  function handleConfigure() {
    setOpen(false)
    if (pathname !== SCHOOL_PROFILE_ROUTE) router.push(SCHOOL_PROFILE_ROUTE)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-3">
          <div className={`icon-container ${ICON_TONES.yellow}`}>
            <School className="h-4.5 w-4.5" />
          </div>
          <DialogTitle className="text-lg">Set up your school profile</DialogTitle>
          <DialogDescription>
            Your school doesn&apos;t have a profile yet. Configure it once and every new
            school year can be seeded from it.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5">
          {STEPS.map(({ icon: Icon, tone, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ICON_TONES[tone]}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-muted-foreground">{text}</span>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Maybe later
          </Button>
          <Button type="button" onClick={handleConfigure}>
            {pathname === SCHOOL_PROFILE_ROUTE ? "Get started" : "Configure now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}