// ===== File: frontend\src\components\admin\grade-lock\GradeLockApplyTemplateDialog.tsx =====
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignSetting } from "@/hooks/admin/useGradeLocks";
import type { GradeLock, GradeLockSetting } from "@/types/admin/grade-lock.types";

interface GradeLockApplyTemplateDialogProps {
  target: GradeLock | null;
  templates: GradeLockSetting[];
  defaultTemplateId: string;
  onClose: () => void;
}

export function GradeLockApplyTemplateDialog({
  target,
  templates,
  defaultTemplateId,
  onClose,
}: GradeLockApplyTemplateDialogProps): React.ReactElement | null {
  const { mutate: assignSetting, isPending } = useAssignSetting();
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  useEffect(() => {
    if (target) {
      setSelectedTemplateId(defaultTemplateId);
    }
  }, [target, defaultTemplateId]);

  if (!target) return null;

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

  const handleApply = () => {
    if (!selectedTemplateId) return;
    assignSetting(
      { classId: target.class_id, settingId: selectedTemplateId },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-background p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Apply Template
        </h2>

        <p className="text-sm text-muted-foreground">
          Applying to: <span className="font-medium text-foreground">{target.className}</span>
        </p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Select Template</label>
          <Select value={selectedTemplateId} onValueChange={(v) => setSelectedTemplateId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue>{selectedTemplate?.name ?? "Choose a template..."}</SelectValue>
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

          {selectedTemplate?.lock_deadline && (
            <p className="text-xs text-muted-foreground">
              Deadline: {format(new Date(selectedTemplate.lock_deadline), "MMM d, yyyy h:mm a")}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          This may override existing lock configuration.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isPending || !selectedTemplateId} onClick={handleApply}>
            {isPending ? "Applying..." : "Yes, Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}