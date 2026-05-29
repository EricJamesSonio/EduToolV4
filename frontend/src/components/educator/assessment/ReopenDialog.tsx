"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface Student {
  id: string;
  fullName: string;
  email?: string;
}

interface ReopenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[] | undefined;
  onReopen: (selectedIds: string[], reopenUntil: string) => Promise<void>;
  reopening: boolean;
}

export function ReopenDialog({
  open,
  onOpenChange,
  students,
  onReopen,
  reopening,
}: ReopenDialogProps): React.JSX.Element {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reopenUntil, setReopenUntil] = useState("");

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSelectedIds([]);
      setReopenUntil("");
    }
    onOpenChange(open);
  }

  async function handleReopen() {
    if (!selectedIds.length || !reopenUntil) return;
    await onReopen(selectedIds, reopenUntil);
    setSelectedIds([]);
    setReopenUntil("");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reopen for Students</DialogTitle>
          <DialogDescription>
            Select students and set a deadline for retake.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="max-h-48 overflow-y-auto space-y-1">
            {students?.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No enrolled students.
              </p>
            )}

            {students?.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(s.id)}
                  onChange={(e) =>
                    setSelectedIds(
                      e.target.checked
                        ? [...selectedIds, s.id]
                        : selectedIds.filter((id) => id !== s.id)
                    )
                  }
                />
                <span>{s.fullName}</span>
                {s.email && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {s.email}
                  </span>
                )}
              </label>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Reopen until</Label>
            <Input
              type="datetime-local"
              value={reopenUntil}
              onChange={(e) => setReopenUntil(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReopen}
            disabled={!selectedIds.length || !reopenUntil || reopening}
          >
            {reopening && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reopen ({selectedIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
