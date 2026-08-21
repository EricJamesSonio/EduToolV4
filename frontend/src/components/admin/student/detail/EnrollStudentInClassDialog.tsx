"use client";

import { useState } from "react";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
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
  const [selectedClassId, setSelectedClassId] = useState("");

  const { data: classesRaw, isLoading: classesLoading } = useAsyncQuery(
    queryKeys.admin.classes.list(),
    () => classApi.getAll(),
    { enabled: open },
  );

  const programSet = new Set(programIds);

  const classes = toArray<Class>(classesRaw).filter(
    (c) => c.status !== "archived" && c.programId && programSet.has(c.programId),
  );

  const mutation = useMutationWithInvalidation(
    () => studentApi.addEnrollment(studentId, selectedClassId),
    {
      invalidateKeys: [queryKeys.admin.students.enrollments(studentId)],
      onSuccess: (data) => {
        if (data.overflow) {
          toast.warning(data.message ?? "Class is at capacity but student was enrolled.");
        } else {
          toast.success("Student enrolled successfully.");
        }
        handleClose();
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(err?.response?.data?.message ?? "Failed to enroll student.");
      },
    },
  );

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
                          ? "No classes available for this department"
                          : "Select a class"
                    }
                  >
                    {selectedClassId && (classes.find((c) => c.id === selectedClassId)?.subjectName ?? selectedClassId)}
                  </SelectValue>
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
                No classes match the student&apos;s department. Ensure the subject&apos;s department is set.
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