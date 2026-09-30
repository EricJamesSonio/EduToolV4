"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Layers, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignSettingBulk } from "@/hooks/admin/useGradeLocks";
import type { GradeLock, GradeLockSetting } from "@/types/admin/grade-lock.types";

interface GradeLockApplyAllDialogProps {
  open: boolean;
  onClose: () => void;
  templates: GradeLockSetting[];
  defaultTemplateId: string;
  classIds: string[];
  /** Rows as currently rendered by the table, so locked ones can be excluded. */
  locks: GradeLock[];
}

export function GradeLockApplyAllDialog({
  open,
  onClose,
  templates,
  defaultTemplateId,
  classIds,
  locks,
}: GradeLockApplyAllDialogProps): React.ReactElement {
  const { mutate: assignBulk, isPending } = useAssignSettingBulk();
  const [templateId, setTemplateId] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setTemplateId(defaultTemplateId);
      setProgress(null);
    }
  }, [open, defaultTemplateId]);

  // Locked classes can never be reassigned (the server skips them), so they are
  // filtered out here to keep the request payload — and the 30/min throttle
  // budget — as small as possible.
  const lockedClassIds = useMemo(
    () =>
      new Set(
        locks
          .filter((l) => l.lockStatus === "locked" || l.lockStatus === "auto_locked")
          .map((l) => l.class_id),
      ),
    [locks],
  );

  const targetIds = useMemo(
    () => classIds.filter((id) => !lockedClassIds.has(id)),
    [classIds, lockedClassIds],
  );

  const skippedLockedCount = classIds.length - targetIds.length;
  const selected = templates.find((t) => t.id === templateId) ?? null;
  const running = isPending;

  const handleApply = (): void => {
    if (!templateId || targetIds.length === 0 || running) return;

    const controller = new AbortController();
    abortRef.current = controller;

    assignBulk(
      {
        classIds: targetIds,
        settingId: templateId,
        signal: controller.signal,
        onProgress: (done, total) => setProgress({ done, total }),
      },
      {
        onSettled: () => {
          abortRef.current = null;
          setProgress(null);
        },
        onSuccess: onClose,
      },
    );
  };

  const handleCancel = (): void => {
    // Stops the loop between chunks; the in-flight request still completes.
    abortRef.current?.abort();
  };

  const percent =
    progress && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <Dialog
      open={open}
      // Closing mid-run would orphan the request, so outside-click and Esc are
      // ignored while the mutation is in flight.
      onOpenChange={(v: boolean) => {
        if (!v && !running) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={!running}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Apply Template to All
          </DialogTitle>
          <DialogDescription>
            Applies to the {classIds.length} class
            {classIds.length !== 1 ? "es" : ""} currently shown
            {skippedLockedCount > 0 &&
              ` · ${skippedLockedCount} already locked will be skipped`}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 py-2">
          <label className="text-sm font-medium">Select Template</label>
          <Select
            value={templateId}
            onValueChange={(v: string | null) => setTemplateId(v ?? "")}
            disabled={running}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {selected?.name ?? "Choose a template..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                  {t.is_default ? " (default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selected?.lock_deadline && !running && (
            <p className="text-xs text-muted-foreground">
              Deadline:{" "}
              {format(new Date(selected.lock_deadline), "MMM d, yyyy h:mm a")}
            </p>
          )}

          {running && (
            <div
              className="space-y-1.5 pt-1"
              role="status"
              aria-live="polite"
            >
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width] duration-200"
                  style={{ width: `${progress ? percent : 5}%` }}
                />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Applying {progress ? progress.done.toLocaleString() : 0} /{" "}
                {targetIds.length.toLocaleString()}…
              </p>
            </div>
          )}
        </div>

        {!running && (
          <p className="text-xs text-muted-foreground">
            This may override existing lock configuration. Classes already on
            this template are left untouched.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={running ? handleCancel : onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={running || !templateId || targetIds.length === 0}
          >
            {running
              ? "Applying..."
              : targetIds.length > 0
                ? `Apply to ${targetIds.length.toLocaleString()}`
                : "Nothing to apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
