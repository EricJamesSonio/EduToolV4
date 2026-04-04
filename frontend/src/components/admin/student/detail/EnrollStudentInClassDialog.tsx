"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { studentApi } from "@/api/admin/student.api";
import { classApi } from "@/api/admin/class.api";
import { toArray } from "@/utils/classes.utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  studentId: string;
  onClose: () => void;
}

export function EnrollStudentInClassDialog({
  open,
  studentId,
  onClose,
}: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState("");

  const { data: classesRaw, isLoading: classesLoading } = useQuery({
    queryKey: ["admin", "classes"],
    queryFn: () => classApi.getAll(),
    enabled: open,
  });

  const classes = toArray<{ id: string; subjectName?: string; subjectId: string; status: string }>(
    classesRaw,
  ).filter((c) => c.status !== "archived");

  const mutation = useMutation({
    mutationFn: () => studentApi.addEnrollment(studentId, selectedClassId),
    onSuccess: (data) => {
      if (data.overflow) {
        toast.warning(data.message ?? "Class is at capacity but student was enrolled.");
      } else {
        toast.success("Student enrolled successfully.");
      }
      queryClient.invalidateQueries({
        queryKey: ["admin", "students", studentId, "enrollments"],
      });
      handleClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to enroll student.");
    },
  });

  function handleClose() {
    setSelectedClassId("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Enroll in Class</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Select Class</Label>
            <Select
              value={selectedClassId}
              onValueChange={(value) => setSelectedClassId(value ?? "")}
              disabled={classesLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={classesLoading ? "Loading classes..." : "Select a class"}
                />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.subjectName ?? c.subjectId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !selectedClassId}
          >
            {mutation.isPending ? "Enrolling..." : "Enroll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}