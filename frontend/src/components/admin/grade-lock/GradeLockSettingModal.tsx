"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useCreateGradeLockSetting,
  useUpdateGradeLockSetting,
} from "@/hooks/admin/useGradeLocks"

interface GradeLockSettingModalProps {
  open: boolean
  onClose: () => void
  existingSetting?: {
    id: string
    name?: string
    lock_deadline?: string | null
  } | null
  /** ISO date of the school year end; deadlines before it are rejected. */
  minDeadline?: string | null
}

const toLocalInput = (iso?: string | null): string =>
  iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : ""

export function GradeLockSettingModal({
  open,
  onClose,
  existingSetting,
  minDeadline,
}: GradeLockSettingModalProps): React.ReactElement {
  const isEdit = !!existingSetting

  const [name, setName] = useState(existingSetting?.name ?? "")
  const [deadline, setDeadline] = useState(
    toLocalInput(existingSetting?.lock_deadline),
  )

  useEffect(() => {
    setName(existingSetting?.name ?? "")
    setDeadline(toLocalInput(existingSetting?.lock_deadline))
  }, [existingSetting?.id, open]) // eslint-disable-line react-hooks/exhaustive-deps

  const createMutation = useCreateGradeLockSetting()
  const updateMutation = useUpdateGradeLockSetting()
  const isPending = createMutation.isPending || updateMutation.isPending

  const minInput = toLocalInput(minDeadline)
  const belowMin = !!deadline && !!minInput && deadline < minInput

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim() || !deadline || belowMin) return

    try {
      if (isEdit && existingSetting?.id) {
        await updateMutation.mutateAsync({
          id: existingSetting.id,
          data: {
            name,
            lock_deadline: new Date(deadline).toISOString(),
          },
        })

        toast.success("Template updated successfully")
      } else {
        await createMutation.mutateAsync({
          name,
          lock_deadline: new Date(deadline).toISOString(),
          lockType: "hard",
          allowOverride: true,
        })

        toast.success("Template created successfully")
      }

      onClose()
    } catch {
      toast.error("Failed to save grade lock template.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isEdit ? "Update Lock Template" : "Create Lock Template"}
          </DialogTitle>

          <DialogDescription>
            Create reusable grade lock templates that can be applied to school years and classes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Final Exams Lock Policy"
            />
          </div>

          <div className="space-y-2">
            <Label>Lock Deadline</Label>
            <Input
              type="datetime-local"
              value={deadline}
              min={minInput || undefined}
              onChange={(e) => setDeadline(e.target.value)}
            />
            {belowMin ? (
              <p className="text-xs text-destructive">
                Deadline cannot be before the end of the school year (
                {format(new Date(minDeadline as string), "MMM d, yyyy h:mm a")}).
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {minInput
                  ? `Must be on or after the school year end (${format(new Date(minDeadline as string), "MMM d, yyyy h:mm a")}).`
                  : "This will be used when applying the template to school years."}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !deadline || belowMin || isPending}
          >
            {isPending
              ? "Saving…"
              : isEdit
              ? "Update Template"
              : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}