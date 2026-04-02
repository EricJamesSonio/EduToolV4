"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import { classApi } from "@/api/admin/class.api";
import type { EnrollmentResponse } from "@/api/admin/class.api";
import type { Class } from "@/types/admin/class.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";

import { ClassDetailHeader } from "@/components/class/detail/ClassDetailHeader";
import { ClassInfoCard } from "@/components/class/detail/ClassInfoCard";
import { EnrolledStudentsList } from "@/components/class/detail/EnrolledStudentsList";
import { EditClassDialog } from "@/components/class/detail/EditClassDialog";
import { EnrollStudentDialog } from "@/components/class/detail/EnrollStudentDialog";
import { toArray } from "@/components/class/utils/classDetail.utils";

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{
    enrollmentId: string;
    studentName: string;
  } | null>(null);

  const { data: cls, isLoading: clsLoading } = useQuery({
    queryKey: ["admin", "classes", id],
    queryFn: () => classApi.getOne(id),
  });

  const { data: enrollmentsRaw, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["admin", "classes", id, "enrollments"],
    queryFn: () => classApi.getEnrollments(id),
    enabled: !!id,
  });
  const enrollments = toArray<EnrollmentResponse>(enrollmentsRaw);

  const archiveMutation = useMutation({
    mutationFn: () => classApi.archive(id),
    onSuccess: () => {
      toast.success("Class archived.");
      queryClient.invalidateQueries({ queryKey: ["admin", "classes"] });
      setArchiveConfirm(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to archive class.");
      setArchiveConfirm(false);
    },
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      classApi.removeEnrollment(id, enrollmentId),
    onSuccess: () => {
      toast.success("Student removed.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "classes", id, "enrollments"],
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "classes", id] });
      setRemoveTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to remove student.");
      setRemoveTarget(null);
    },
  });

  if (clsLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!cls) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Class not found.
      </p>
    );
  }

  const isArchived = cls.status === "archived";
  const enrolledCount = cls.enrolledCount ?? enrollments.length;

  return (
    <div className="space-y-6 max-w-4xl">
      <ClassDetailHeader
        cls={cls}
        onEdit={() => setEditOpen(true)}
        onArchive={() => setArchiveConfirm(true)}
      />

      <ClassInfoCard cls={cls} enrolledCount={enrolledCount} />

      <EnrolledStudentsList
        enrollments={enrollments}
        isLoading={enrollmentsLoading}
        enrolledCount={enrolledCount}
        isArchived={isArchived}
        onEnroll={() => setEnrollOpen(true)}
        onRemove={setRemoveTarget}
      />

      {editOpen && (
        <EditClassDialog
          cls={cls}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}

      {enrollOpen && (
        <EnrollStudentDialog
          classId={id}
          open={enrollOpen}
          onClose={() => setEnrollOpen(false)}
        />
      )}

      {archiveConfirm && (
        <ConfirmDialog
          open
          title="Archive this class?"
          message="Archive this class? It will become read-only and hidden from active views."
          confirmLabel="Archive Class"
          destructive
          isLoading={archiveMutation.isPending}
          onConfirm={() => archiveMutation.mutate()}
          onOpenChange={(o) => { if (!o) setArchiveConfirm(false); }}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          open
          title="Remove this student?"
          message={`Remove "${removeTarget.studentName}" from this class? Their grades and submissions may be affected.`}
          confirmLabel="Remove Student"
          destructive
          isLoading={removeEnrollmentMutation.isPending}
          onConfirm={() =>
            removeEnrollmentMutation.mutate(removeTarget.enrollmentId)
          }
          onOpenChange={(o) => { if (!o) setRemoveTarget(null); }}
        />
      )}
    </div>
  );
}