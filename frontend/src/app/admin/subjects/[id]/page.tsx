"use client";

import { use, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Pencil, Lock, LockOpen,
  AlertTriangle, Eye, Share2, X,
} from "lucide-react";
import { subjectApi } from "@/api/admin/subject.api";
import { levelApi } from "@/api/admin/level.api";
import { educatorApi } from "@/api/admin/educator.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { useUnshareSubject } from "@/hooks/admin/useSubject";
import type { Subject, SubjectSharing } from "@/types/admin/subject.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShareSubjectDialog } from "@/components/admin/subject/ShareSubjectDialog";
import { EditSubjectDialog } from "@/components/admin/subject/EditSubjectDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AxiosError } from "axios";

function SharingsSection({
  subject,
  sharings,
  schoolYearId,
}: {
  subject:      Subject;
  sharings:     SubjectSharing[];
  schoolYearId: string;
}): React.JSX.Element {
  const [shareOpen, setShareOpen]         = useState(false);
  const [unshareTarget, setUnshareTarget] = useState<SubjectSharing | null>(null);
  const unshareMutation = useUnshareSubject();

  const getSharingLabel = (s: SubjectSharing): string =>
    s.courseName ?? s.strandName ?? s.levelName ?? "Unknown";

  const getSharingType = (s: SubjectSharing): string => {
    if (s.courseId) return "Course";
    if (s.strandId) return "Strand";
    if (s.levelId)  return "Level";
    return "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold not-interactive">Shared To</h2>
        <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}>
          <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
        </Button>
      </div>

      {sharings.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground not-interactive">
            Not shared to any courses or levels yet.
          </p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setShareOpen(true)}>
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            Share to a course or level
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {sharings.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-normal">
                  {getSharingType(s)}
                </Badge>
                <span className="text-sm">{getSharingLabel(s)}</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => setUnshareTarget(s)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {shareOpen && (
      <ShareSubjectDialog
        subject={subject}
        existingSharings={sharings}
        schoolYearId={schoolYearId}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
      )}

      {unshareTarget && (
        <ConfirmDialog
          open
          title="Remove sharing?"
          message={`Remove sharing to "${getSharingLabel(unshareTarget)}"? The subject will no longer appear there.`}
          confirmLabel="Remove"
          destructive
          isLoading={unshareMutation.isPending}
          onConfirm={() =>
            unshareMutation.mutate(
              { id: subject.id, sharingId: unshareTarget.id },
              {
                onSuccess: () => { toast.success("Sharing removed."); setUnshareTarget(null); },
                onError: (err: unknown) => {
                  const axiosErr = err as AxiosError<{ message: string }>;
                  toast.error(axiosErr?.response?.data?.message ?? "Failed to remove sharing.");
                  setUnshareTarget(null);
                },
              },
            )
          }
          onOpenChange={(o) => { if (!o) setUnshareTarget(null); }}
        />
      )}
    </div>
  );
}

export default function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const router  = useRouter();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen]           = useState(false);
  const [lockConfirm, setLockConfirm]     = useState(false);
  const [unlockConfirm, setUnlockConfirm] = useState(false);

  const { data: subject, isLoading } = useAsyncQuery(
    queryKeys.admin.subjects.detail(id),
    () => subjectApi.getOne(id),
  );

  const { data: levels = [] } = useAsyncQuery(
    queryKeys.admin.levels.list(),
    () => levelApi.getAll(),
  );

  const { data: educators = [] } = useAsyncQuery(
    queryKeys.admin.educators.list(),
    () => educatorApi.getAll(),
  );

  const { data: schoolYears = [] } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );

  const activeSchoolYearId =
    schoolYears.find((sy) => sy.status === "active")?.id ??
    schoolYears[0]?.id ??
    "";

  const lockMutation = useMutation({
    mutationFn: () => subjectApi.lock(id),
    onSuccess: () => {
      toast.success("Subject locked.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.subjects.detail(id) });
      setLockConfirm(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to lock.");
      setLockConfirm(false);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: () => subjectApi.unlock(id),
    onSuccess: () => {
      toast.success("Subject unlocked.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.subjects.detail(id) });
      setUnlockConfirm(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to unlock.");
      setUnlockConfirm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!subject) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center not-interactive">
        Subject not found.
      </p>
    );
  }

  const isLocked = subject.lockStatus === "locked";
  const isMinor  = subject.subjectType === "minor";
  const levelDisplayName = subject.levelName ?? subject.programName ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={subject.title}
        breadcrumbs={[
          { label: "Admin" },
          { label: "Subjects", href: "/admin/subjects" },
          { label: subject.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {!isLocked && (
              <Button size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {isLocked ? (
              <Button variant="outline" size="sm" onClick={() => setUnlockConfirm(true)}>
                <LockOpen className="mr-1.5 h-3.5 w-3.5" /> Unlock
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setLockConfirm(true)}>
                <Lock className="mr-1.5 h-3.5 w-3.5" /> Lock
              </Button>
            )}
          </div>
        }
      />

      {isLocked && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="not-interactive">This subject is locked and read-only. It will auto-unlock at the start of a new school year.</span>
        </div>
      )}

      <div className="rounded-lg border bg-card divide-y">
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0 not-interactive">Name</span>
          <span className="text-sm font-medium">{subject.title}</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0 not-interactive">Type</span>
          <Badge variant="secondary" className="font-normal capitalize">
            {subject.subjectType}
          </Badge>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0 not-interactive">Level</span>
          {levelDisplayName ? (
            <Badge variant="secondary" className="font-normal">
              {levelDisplayName}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0 not-interactive">Educator</span>
          <span className="text-sm">
            {subject.educatorName ?? (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0 not-interactive">Lock Status</span>
          <span className="text-sm">{isLocked ? "Locked" : "Unlocked"}</span>
        </div>
      </div>

      {isMinor && activeSchoolYearId && (
        <SharingsSection
          subject={subject}
          sharings={subject.sharings ?? []}
          schoolYearId={activeSchoolYearId}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold not-interactive">Linked Classes</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/admin/classes?subjectId=${subject.id}`)}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View All Classes
        </Button>
      </div>

      {editOpen && (
        <EditSubjectDialog
          subject={subject}
          levels={levels}
          educators={educators}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}

      {lockConfirm && (
        <ConfirmDialog
          open
          title="Lock this subject?"
          message={`Lock "${subject.title}"? It will become read-only.`}
          confirmLabel="Lock Subject"
          destructive={false}
          isLoading={lockMutation.isPending}
          onConfirm={() => lockMutation.mutate()}
          onOpenChange={(o) => { if (!o) setLockConfirm(false); }}
        />
      )}

      {unlockConfirm && (
        <ConfirmDialog
          open
          title="Unlock this subject?"
          message={`Unlock "${subject.title}"? It will become editable again.`}
          confirmLabel="Unlock Subject"
          destructive={false}
          isLoading={unlockMutation.isPending}
          onConfirm={() => unlockMutation.mutate()}
          onOpenChange={(o) => { if (!o) setUnlockConfirm(false); }}
        />
      )}
    </div>
  );
}
