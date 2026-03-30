"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { subjectApi } from "@/api/admin/subject.api";
import type { UpdateSubjectRequest } from "@/api/admin/subject.api";
import { levelApi } from "@/api/admin/level.api";
import { educatorApi } from "@/api/admin/educator.api";
import type { Subject } from "@/types/admin/subject.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Pencil,
  Lock,
  LockOpen,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AxiosError } from "axios";
import type { Level } from "@/types/admin/level.types";

interface EditSubjectForm {
  name: string;
  levelId: string;
  educatorId: string;
}

function EditSubjectDialog({
  subject,
  levels,
  educators,
  open,
  onClose,
}: {
  subject: Subject;
  levels: Level[];
  educators: { id: string; fullName: string }[];
  open: boolean;
  onClose: () => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditSubjectForm>({
    defaultValues: {
      // ✅ subject.title (not .name), subject.programId (not .levelId)
      name: subject.title,
      levelId: subject.programId ?? "",
      educatorId: subject.educatorId ?? "",
    },
  });

  const selectedLevelId = watch("levelId");
  const selectedEducatorId = watch("educatorId");

  const mutation = useMutation({
    mutationFn: (values: EditSubjectForm) =>
      subjectApi.update(subject.id, {
        // ✅ API uses `name` (UpdateSubjectRequest)
        name: values.name,
        levelId: values.levelId || undefined,
        educatorId: values.educatorId || undefined,
      } as UpdateSubjectRequest),
    onSuccess: () => {
      toast.success("Subject updated.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "subjects", subject.id],
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to update subject.");
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4 mt-1"
        >
          <div className="space-y-1.5">
            <Label>Subject Name</Label>
            <Input
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "At least 2 characters" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Level</Label>
            <Select
              value={selectedLevelId}
              onValueChange={(v) => setValue("levelId", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Assigned Educator{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Select
              value={selectedEducatorId}
              onValueChange={(v) => setValue("educatorId", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {educators.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={mutation.isPending}
            >
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

export default function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [lockConfirm, setLockConfirm] = useState(false);
  const [unlockConfirm, setUnlockConfirm] = useState(false);

  const { data: subject, isLoading } = useQuery({
    queryKey: ["admin", "subjects", id],
    queryFn: () => subjectApi.getOne(id),
  });

  const { data: levels = [] } = useQuery({
    queryKey: ["admin", "levels", "all"],
    queryFn: () => levelApi.getAll(),
  });

  const { data: educators = [], isLoading: educatorsLoading } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn: () => educatorApi.getAll(),
    select: (data) => (Array.isArray(data) ? data : []),
  });

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

  // ✅ lockStatus === "locked" (not isLocked)
  const isLocked = subject.lockStatus === "locked";

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
          <div className="space-y-1">
            {/* ✅ subject.title (not subject.name) */}
            <h1 className="text-2xl font-semibold">{subject.title}</h1>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
                isLocked
                  ? "bg-muted text-muted-foreground"
                  : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              )}
            >
              {isLocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <LockOpen className="h-3 w-3" />
              )}
              {isLocked ? "Locked" : "Unlocked"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isLocked && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          {isLocked ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUnlockConfirm(true)}
            >
              <LockOpen className="mr-1.5 h-3.5 w-3.5" />
              Unlock
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLockConfirm(true)}
            >
              <Lock className="mr-1.5 h-3.5 w-3.5" />
              Lock
            </Button>
          )}
        </div>
      </div>

      {/* Locked banner */}
      {isLocked && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This subject is locked and read-only. It will auto-unlock at the start
          of a new school year.
        </div>
      )}

      {/* Info card */}
      <div className="rounded-lg border bg-card divide-y">
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">
            Name
          </span>
          {/* ✅ subject.title */}
          <span className="text-sm font-medium">{subject.title}</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">
            Level
          </span>
          {/* ✅ subject.programName (not subject.levelName) */}
          {subject.programName ? (
            <Badge variant="secondary" className="font-normal">
              {subject.programName}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">
            Educator
          </span>
          <span className="text-sm">
            {subject.educatorName ?? (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">
            Lock Status
          </span>
          {/* ✅ isLocked derived from lockStatus === "locked" above */}
          <span className="text-sm">{isLocked ? "Locked" : "Unlocked"}</span>
        </div>
      </div>

      {/* Linked Classes — Subject type does not include classes; navigate to filtered list */}
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

      {/* Edit dialog */}
      {editOpen && (
        <EditSubjectDialog
          subject={subject}
          levels={levels}
          educators={educators}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* Lock confirm */}
      {lockConfirm && (
        <ConfirmDialog
          open
          title="Lock this subject?"
          // ✅ subject.title (not subject.name)
          message={`Lock "${subject.title}"? It will become read-only.`}
          confirmLabel="Lock Subject"
          destructive={false}
          isLoading={lockMutation.isPending}
          onConfirm={() => lockMutation.mutate()}
          onOpenChange={(o) => {
            if (!o) setLockConfirm(false);
          }}
        />
      )}

      {/* Unlock confirm */}
      {unlockConfirm && (
        <ConfirmDialog
          open
          title="Unlock this subject?"
          // ✅ subject.title (not subject.name)
          message={`Unlock "${subject.title}"? It will become editable again.`}
          confirmLabel="Unlock Subject"
          destructive={false}
          isLoading={unlockMutation.isPending}
          onConfirm={() => unlockMutation.mutate()}
          onOpenChange={(o) => {
            if (!o) setUnlockConfirm(false);
          }}
        />
      )}
    </div>
  );
}

// Named import to avoid confusion with the BookOpen used inline
function BookOpen({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}