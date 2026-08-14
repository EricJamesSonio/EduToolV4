"use client";

import { useMemo, useState } from "react";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { Search, UserX } from "lucide-react";

import { classApi } from "@/api/admin/class.api";

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
  levelName?: string | null;
  programName?: string | null;
  courseName?: string | null;
  strandName?: string | null;
}

function EmptyState({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-2 h-28 text-sm text-muted-foreground">
      <UserX className="h-5 w-5 text-muted-foreground/50" />
      <span className="px-4 text-center">{message}</span>
    </div>
  );
}

export function EnrollStudentDialog({
  classId,
  open,
  onClose,
}: EnrollStudentDialogProps): React.JSX.Element {
  const [search, setSearch] = useState("");

  const { data: eligibleRaw, isLoading } = useAsyncQuery(
    queryKeys.admin.classes.eligibleStudents(classId),
    () => classApi.getEligibleStudents(classId),
    { enabled: open && !!classId },
  );
  const eligible = toArray<StudentOption>(eligibleRaw);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return eligible;
    return eligible.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q),
    );
  }, [eligible, search]);

  const enrollMutation = useMutationWithInvalidation(
    (studentId: string) => classApi.enroll(classId, studentId),
    {
      invalidateKeys: [
        queryKeys.admin.classes.enrolled(classId),
        queryKeys.admin.classes.detail(classId),
        queryKeys.admin.classes.eligibleStudents(classId),
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
      description="Only students matching this class's program, course/strand, and level are listed."
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
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : eligible.length === 0 ? (
            <EmptyState message="No eligible students available for this class." />
          ) : filtered.length === 0 ? (
            <EmptyState message="No students found matching your search." />
          ) : (
            <div className="divide-y">
              {filtered.map((student) => {
                const structure = [
                  student.programName,
                  student.courseName ?? student.strandName,
                  student.levelName,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <button
                    key={student.id}
                    onClick={() => enrollMutation.mutate(student.id)}
                    disabled={enrollMutation.isPending}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div>
                      <p className="text-sm font-medium">{student.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.studentId
                          ? `ID: ${student.studentId}${structure ? " · " : ""}`
                          : ""}
                        {structure}
                      </p>
                    </div>
                    {structure && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        Eligible
                      </Badge>
                    )}
                  </button>
                );
              })}
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