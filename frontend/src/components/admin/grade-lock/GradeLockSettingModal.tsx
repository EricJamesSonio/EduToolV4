"use client"

import { useState } from "react"
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
    lock_deadline?: string
  } | null
}

export function GradeLockSettingModal({
  open,
  onClose,
  existingSetting,
}: GradeLockSettingModalProps): React.ReactElement {
  const isEdit = !!existingSetting

  const [name, setName] = useState(existingSetting?.name ?? "")
  const [deadline, setDeadline] = useState(
    existingSetting?.lock_deadline
      ? new Date(existingSetting.lock_deadline).toISOString().slice(0, 16)
      : ""
  )

  const createMutation = useCreateGradeLockSetting()
  const updateMutation = useUpdateGradeLockSetting()
  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim() || !deadline) return

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
              onChange={(e) => setDeadline(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This will be used when applying the template to school years.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={!name || !deadline || isPending}>
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