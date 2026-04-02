"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { studentApi } from "@/api/admin/student.api";
import type { Student, StudentStatus } from "@/types/admin/student.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "pending",     label: "Pending" },
  { value: "active",      label: "Active" },
  { value: "suspended",   label: "Suspended" },
  { value: "dropped",     label: "Dropped" },
  { value: "transferred", label: "Transferred" },
  { value: "graduated",   label: "Graduated" },
];

interface Props {
  open: boolean;
  student: Student;
  onClose: () => void;
}

export function UpdateStatusDialog({
  open,
  student,
  onClose,
}: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StudentStatus>(student.status);
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => studentApi.updateStatus(student.id, { status, reason: reason || undefined }),
    onSuccess: () => {
      toast.success("Student status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "students", student.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to update status.");
    },
  });

  function handleClose() {
    setStatus(student.status);
    setReason("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Student Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>New Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as StudentStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.value === student.status}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">
              Reason{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g. Student requested transfer"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || status === student.status}
          >
            {mutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}