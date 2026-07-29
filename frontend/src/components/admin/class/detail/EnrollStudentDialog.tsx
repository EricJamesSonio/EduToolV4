"use client";

import { useState } from "react";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { Search } from "lucide-react";

import { classApi } from "@/api/admin/class.api";
import { studentApi } from "@/api/admin/student.api";

import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { toArray } from "../utils/classDetail.utils";

interface EnrollStudentDialogProps {
  classId: string;
  open: boolean;
  onClose: () => void;
}

interface StudentOption {
  id: string;
  fullName: string;
  studentId?: string;
  status?: string;
}

export function EnrollStudentDialog({
  classId,
  open,
  onClose,
}: EnrollStudentDialogProps): React.JSX.Element {
  const [search, setSearch] = useState("");

  const { data: studentsRaw, isLoading } = useAsyncQuery(
    queryKeys.admin.students.list({ search: search || undefined }),
    () => studentApi.getAll({ search: search || undefined }),
    { enabled: search.length >= 2 },
  );
  const students = toArray<StudentOption>(studentsRaw);

  const enrollMutation = useMutationWithInvalidation(
    (studentId: string) => classApi.enroll(classId, studentId),
    {
      invalidateKeys: [
        queryKeys.admin.classes.enrolled(classId),
        queryKeys.admin.classes.detail(classId),
      ],
      onSuccess: (result) => {
        if ("overflow" in result && result.overflow) {
          toast.warning(result.message);
        } else {
          toast.success("Student enrolled.");
        }
        onClose();
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(err?.response?.data?.message ?? "Failed to enroll student.");
      },
    },
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enroll Student"
      description="Search by name or Student ID to find and enroll a student."
      size="md"
    >

        <div className="space-y-3 mt-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or Student ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="rounded-md border min-h-[120px] max-h-64 overflow-y-auto">
            {search.length < 2 ? (
              <div className="flex items-center justify-center h-28 text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : isLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="flex items-center justify-center h-28 text-sm text-muted-foreground">
                No students found
              </div>
            ) : (
              <div className="divide-y">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => enrollMutation.mutate(student.id)}
                    disabled={
                      enrollMutation.isPending || student.status !== "active"
                    }
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div>
                      <p className="text-sm font-medium">{student.fullName}</p>
                      {student.studentId && (
                        <p className="text-xs text-muted-foreground">
                          ID: {student.studentId}
                        </p>
                      )}
                    </div>
                    {student.status && student.status !== "active" && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {student.status}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
    </Modal>
  );
}