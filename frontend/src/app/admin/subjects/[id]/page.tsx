// frontend/src/app/admin/subjects/[id]/page.tsx
"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Pencil, Lock, LockOpen,
  AlertTriangle, Eye, Share2, X, BookOpen,
} from "lucide-react";
import { subjectApi } from "@/api/admin/subject.api";
import type { UpdateSubjectRequest } from "@/api/admin/subject.api";
import { levelApi } from "@/api/admin/level.api";
import { educatorApi } from "@/api/admin/educator.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { useUnshareSubject } from "@/hooks/admin/useSubject";
import type { Subject, SubjectSharing } from "@/types/admin/subject.types";
import { ShareSubjectDialog } from "@/components/admin/subject/ShareSubjectDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AxiosError } from "axios";
import type { Level } from "@/types/admin/level.types";

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

interface EditSubjectForm {
  name:       string;
  levelId:    string;
  educatorId: string;
}

function EditSubjectDialog({
  subject,
  levels,
  educators,
  open,
  onClose,
}: {
  subject:   Subject;
  levels:    Level[];
  educators: { id: string; fullName: string }[];
  open:      boolean;
  onClose:   () => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<EditSubjectForm>({
    defaultValues: {
      name:       subject.title,
      levelId:    subject.levelId ?? "",     // ← fix
      educatorId: subject.educatorId ?? "",
    }
    });

  const selectedLevelId    = watch("levelId");
  const selectedEducatorId = watch("educatorId");

  const mutation = useMutation({
    mutationFn: (values: EditSubjectForm) =>
      subjectApi.update(subject.id, {
        name:       values.name,
        levelId:    values.levelId    || undefined,
        educatorId: values.educatorId || undefined,
      } as UpdateSubjectRequest),
    onSuccess: () => {
      toast.success("Subject updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects", subject.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to update subject.");
    },
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Subject Name</Label>
            <Input
              {...register("name", {
                required:  "Name is required",
                minLength: { value: 2,   message: "At least 2 characters" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Level</Label>
            <Select value={selectedLevelId} onValueChange={(v) => setValue("levelId", v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a level">
                  {levels.find((l) => l.id === selectedLevelId)?.name ?? "Select a level"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {levels.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Assigned Educator{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select value={selectedEducatorId} onValueChange={(v) => setValue("educatorId", v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned">
                  {educators.find((e) => e.id === selectedEducatorId)?.fullName ?? "Unassigned"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {educators.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sharings Section ─────────────────────────────────────────────────────────

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
        <h2 className="text-base font-semibold">Shared To</h2>
        <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}>
          <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
        </Button>
      </div>

      {sharings.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const { data: subject, isLoading } = useQuery({
    queryKey: ["admin", "subjects", id],
    queryFn:  () => subjectApi.getOne(id),
  });

  const { data: levels = [] } = useQuery({
    queryKey: ["admin", "levels", "all"],
    queryFn:  () => levelApi.getAll(),
  });

  const { data: educators = [] } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn:  () => educatorApi.getAll(),
    select:   (data) => (Array.isArray(data) ? data : []),
  });

  const { data: schoolYears = [] } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn:  schoolYearApi.getAll,
  });

  const activeSchoolYearId =
    schoolYears.find((sy) => sy.status === "active")?.id ??
    schoolYears[0]?.id ??
    "";

  const lockMutation = useMutation({
    mutationFn: () => subjectApi.lock(id),
    onSuccess: () => {
      toast.success("Subject locked.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects", id] });
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
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects", id] });
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
      <p className="text-sm text-muted-foreground py-12 text-center">
        Subject not found.
      </p>
    );
  }

  const isLocked = subject.lockStatus === "locked";
  const isMinor  = subject.subjectType === "minor";

  // programName is actually the level name (legacy backend field naming)
  const levelDisplayName = subject.levelName ?? subject.programName ?? null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <Link
        href="/admin/subjects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Subjects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold">{subject.title}</h1>
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
                isLocked
                  ? "bg-muted text-muted-foreground"
                  : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
              )}>
                {isLocked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                {isLocked ? "Locked" : "Unlocked"}
              </span>
              <Badge variant={isMinor ? "outline" : "secondary"} className="text-xs font-normal capitalize">
                {subject.subjectType}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isLocked && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
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
      </div>

      {/* Locked banner */}
      {isLocked && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This subject is locked and read-only. It will auto-unlock at the start of a new school year.
        </div>
      )}

      {/* Info card */}
      <div className="rounded-lg border bg-card divide-y">
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">Name</span>
          <span className="text-sm font-medium">{subject.title}</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">Type</span>
          <Badge variant="secondary" className="font-normal capitalize">
            {subject.subjectType}
          </Badge>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">Level</span>
          {levelDisplayName ? (
            <Badge variant="secondary" className="font-normal">
              {levelDisplayName}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">Educator</span>
          <span className="text-sm">
            {subject.educatorName ?? (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">Lock Status</span>
          <span className="text-sm">{isLocked ? "Locked" : "Unlocked"}</span>
        </div>
      </div>

      {/* Sharings — minor only */}
      {isMinor && activeSchoolYearId && (
        <SharingsSection
          subject={subject}
          sharings={subject.sharings ?? []}
          schoolYearId={activeSchoolYearId}
        />
      )}

      {/* Linked Classes */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Linked Classes</h2>
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