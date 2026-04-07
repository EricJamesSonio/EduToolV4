"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateGradeLockSetting,
  useUpdateGradeLockSetting,
} from "@/hooks/admin/useGradeLocks";

interface GradeLockSettingModalProps {
  open: boolean;
  onClose: () => void;
  schoolYearId: string;
  existingDeadline?: string | null;
}

export function GradeLockSettingModal({
  open,
  onClose,
  schoolYearId,
  existingDeadline,
}: GradeLockSettingModalProps): React.ReactElement {
  const isEdit = !!existingDeadline;
  const [deadline, setDeadline] = useState(
    existingDeadline
      ? new Date(existingDeadline).toISOString().slice(0, 16)
      : ""
  );

  const createMutation = useCreateGradeLockSetting();
  const updateMutation = useUpdateGradeLockSetting();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (): Promise<void> => {
    if (!deadline) return;
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          schoolYearId,
          lockDeadline: new Date(deadline).toISOString(),
        });
      } else {
        await createMutation.mutateAsync({
          schoolYearId,
          lockDeadline: new Date(deadline).toISOString(),
        });
      }
      toast.success(
        isEdit
          ? "Lock window updated."
          : "Lock window opened. Educators have been notified."
      );
      onClose();
    } catch {
      toast.error("Failed to save grade lock setting.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isEdit ? "Update Lock Window" : "Open Lock Window"}
          </DialogTitle>
          <DialogDescription>
            Set the deadline by which educators must lock their class grades.
            After this date, grades will be auto-locked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="lock-deadline">Lock Deadline</Label>
            <Input
              id="lock-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Educators will be notified and must lock grades by this date.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!deadline || isPending}>
            {isPending
              ? "Saving…"
              : isEdit
              ? "Update Window"
              : "Open Window"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}