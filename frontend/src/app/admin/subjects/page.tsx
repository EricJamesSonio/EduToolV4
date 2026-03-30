"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { subjectApi } from "@/api/admin/subject.api";
import type {
  CreateSubjectRequest,
  UpdateSubjectRequest,
} from "@/api/admin/subject.api";
import { levelApi } from "@/api/admin/level.api";
import { educatorApi } from "@/api/admin/educator.api";
import type { Subject } from "@/types/admin/subject.types";
import type { Level } from "@/types/admin/level.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
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
import { Plus, Eye, Lock, LockOpen, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AxiosError } from "axios";

interface SubjectFormValues {
  name: string;
  levelId: string;
  educatorId: string;
}

function SubjectDialog({
  subject,
  levels,
  educators,
  open,
  onClose,
  onSaved,
}: {
  subject?: Subject;
  levels: Level[];
  educators: { id: string; fullName: string }[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}): React.JSX.Element {
  const isEdit = !!subject;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    defaultValues: {
      // ✅ subject.title (not .name), subject.programId (not .levelId)
      name: subject?.title ?? "",
      levelId: subject?.programId ?? "",
      educatorId: subject?.educatorId ?? "",
    },
  });

  const selectedLevelId = watch("levelId");
  const selectedEducatorId = watch("educatorId");

  const mutation = useMutation({
    mutationFn: (values: SubjectFormValues) => {
      const payload = {
        // ✅ API uses `name` (CreateSubjectRequest / UpdateSubjectRequest)
        name: values.name,
        levelId: values.levelId,
        educatorId: values.educatorId || undefined,
      };
      return isEdit
        ? subjectApi.update(subject!.id, payload as UpdateSubjectRequest)
        : subjectApi.create(payload as CreateSubjectRequest);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Subject updated." : "Subject created.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      onSaved();
      reset();
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to save subject.");
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
          <DialogTitle>{isEdit ? "Edit Subject" : "New Subject"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4 mt-1"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Subject Name</Label>
            <Input
              placeholder="e.g. Mathematics, English, Science"
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

          {/* Level */}
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
            {errors.levelId && (
              <p className="text-xs text-destructive">
                {errors.levelId.message}
              </p>
            )}
          </div>

          {/* Educator (optional) */}
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
            <Button
              type="submit"
              disabled={mutation.isPending || !selectedLevelId}
            >
              {mutation.isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Subject"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SubjectsPage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filterLevelId, setFilterLevelId] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [lockTarget, setLockTarget] = useState<Subject | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<Subject | null>(null);

  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["admin", "levels", "all"],
    queryFn: () => levelApi.getAll(),
  });

  const { data: educators = [], isLoading: educatorsLoading } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn: () => educatorApi.getAll(),
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ["admin", "subjects", filterLevelId],
    queryFn: () =>
      subjectApi.getAll(
        filterLevelId !== "all" ? { levelId: filterLevelId } : undefined
      ),
  });

  const lockMutation = useMutation({
    mutationFn: (id: string) => subjectApi.lock(id),
    onSuccess: () => {
      toast.success("Subject locked.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      setLockTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to lock subject.");
      setLockTarget(null);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (id: string) => subjectApi.unlock(id),
    onSuccess: () => {
      toast.success("Subject unlocked.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      setUnlockTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to unlock subject.");
      setUnlockTarget(null);
    },
  });

  const isLoading = levelsLoading || subjectsLoading || educatorsLoading;

  const columns = [
    {
      header: "Title",
      // ✅ row.title (not row.name)
      accessor: (row: Subject) => (
        <span className="font-medium">{row.title}</span>
      ),
    },
    {
      header: "Level",
      // ✅ row.programName (not row.levelName)
      accessor: (row: Subject) => (
        <Badge variant="secondary" className="font-normal">
          {row.programName ?? "—"}
        </Badge>
      ),
    },
    {
      header: "Educator",
      accessor: (row: Subject) => (
        <span className="text-sm text-muted-foreground">
          {row.educatorName ?? "Unassigned"}
        </span>
      ),
    },
    {
      header: "Lock Status",
      // ✅ row.lockStatus === "locked" (not row.isLocked)
      accessor: (row: Subject) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
            row.lockStatus === "locked"
              ? "bg-muted text-muted-foreground"
              : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
          )}
        >
          {row.lockStatus === "locked" ? (
            <Lock className="h-3 w-3" />
          ) : (
            <LockOpen className="h-3 w-3" />
          )}
          {row.lockStatus === "locked" ? "Locked" : "Unlocked"}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row: Subject) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => router.push(`/admin/subjects/${row.id}`)}
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Button>
          {/* ✅ row.lockStatus === "locked" (not row.isLocked) */}
          {row.lockStatus === "locked" ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setUnlockTarget(row)}
            >
              <LockOpen className="mr-1 h-3.5 w-3.5" />
              Unlock
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setLockTarget(row)}
            >
              <Lock className="mr-1 h-3.5 w-3.5" />
              Lock
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        actions={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Subject
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Select
          value={filterLevelId}
          onValueChange={(v) => setFilterLevelId(v ?? "all")}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects found"
          description={
            filterLevelId !== "all"
              ? "No subjects for this level yet."
              : "Create your first subject to get started."
          }
          // ✅ EmptyState.action expects { label, onClick }, not a ReactElement
          action={{ label: "New Subject", onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <DataTable columns={columns} data={subjects} />
      )}

      {/* Create dialog */}
      {createOpen && (
        <SubjectDialog
          levels={levels}
          educators={educators}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={() =>
            queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] })
          }
        />
      )}

      {/* Lock confirm */}
      {lockTarget && (
        <ConfirmDialog
          open
          title="Lock this subject?"
          // ✅ lockTarget.title (not lockTarget.name)
          message={`Lock "${lockTarget.title}"? It will become read-only. You can unlock it between school years.`}
          confirmLabel="Lock Subject"
          destructive={false}
          isLoading={lockMutation.isPending}
          onConfirm={() => lockMutation.mutate(lockTarget.id)}
          onOpenChange={(o) => {
            if (!o) setLockTarget(null);
          }}
        />
      )}

      {/* Unlock confirm */}
      {unlockTarget && (
        <ConfirmDialog
          open
          title="Unlock this subject?"
          // ✅ unlockTarget.title (not unlockTarget.name)
          message={`Unlock "${unlockTarget.title}"? It will become editable again.`}
          confirmLabel="Unlock Subject"
          destructive={false}
          isLoading={unlockMutation.isPending}
          onConfirm={() => unlockMutation.mutate(unlockTarget.id)}
          onOpenChange={(o) => {
            if (!o) setUnlockTarget(null);
          }}
        />
      )}
    </div>
  );
}