"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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

interface AssignStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[] | undefined;
  onAssign: (selectedIds: string[]) => Promise<void>;
  assigning: boolean;
}

export function AssignStudentsDialog({
  open,
  onOpenChange,
  students,
  onAssign,
  assigning,
}: AssignStudentsDialogProps): React.JSX.Element {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function handleOpenChange(open: boolean) {
    if (!open) setSelectedIds([]);
    onOpenChange(open);
  }

  async function handleAssign() {
    if (!selectedIds.length) return;
    await onAssign(selectedIds);
    setSelectedIds([]);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign to Students</DialogTitle>
          <DialogDescription>
            Select students to give access to this assessment.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto space-y-1">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedIds.length || assigning}>
            {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign ({selectedIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
