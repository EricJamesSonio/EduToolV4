"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { studentApi } from "@/api/admin/student.api";
import { classApi } from "@/api/admin/class.api";
import type { Class } from "@/types/admin/class.types";
import { toArray } from "@/utils/classes.utils";
import { Modal, ModalFooter } from "@/components/shared/Modal";
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
  programIds: string[];
  onClose: () => void;
}

export function EnrollStudentInClassDialog({
  open,
  studentId,
  programIds,
  onClose,
}: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState("");

  const { data: classesRaw, isLoading: classesLoading } = useQuery({
    queryKey: ["admin", "classes"],
    queryFn: () => classApi.getAll(),
    enabled: open,
  });

  const programSet = new Set(programIds);

  const classes = toArray<Class>(classesRaw).filter(
    (c) => c.status !== "archived" && c.programId && programSet.has(c.programId),
  );

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
    <Modal open={open} onClose={handleClose} title="Enroll in Class" size="sm">

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Select Class</Label>
            <Select
              value={selectedClassId}
              onValueChange={(value) => setSelectedClassId(value ?? "")}
              disabled={classesLoading || classes.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    classesLoading
                      ? "Loading classes..."
                      : classes.length === 0
                        ? "No classes available for this program"
                        : "Select a class"
                  }
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
            {classes.length === 0 && !classesLoading && (
              <p className="text-xs text-muted-foreground">
                No classes match the student&apos;s program. Ensure the subject&apos;s program is set.
              </p>
            )}
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !selectedClassId}
          >
            {mutation.isPending ? "Enrolling..." : "Enroll"}
          </Button>
        </ModalFooter>
    </Modal>
  );
}