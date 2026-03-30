"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Eye, CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { SchoolYear } from "@/types/admin/school-year.types";
import { cn } from "@/lib/utils";
import type { AxiosError } from "axios";

// ─── Create Dialog ────────────────────────────────────────────────────────────

interface CreateForm {
  name: string;
}

function CreateSchoolYearDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({ defaultValues: { name: "" } });

  const mutation = useMutation({
    mutationFn: schoolYearApi.create,
    onSuccess: () => {
      toast.success("School year created.");
      queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] });
      reset();
      onClose();
    },
    onError: () => toast.error("Failed to create school year."),
  });

  const onSubmit = (values: CreateForm) => mutation.mutate({ name: values.name });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New School Year</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label htmlFor="sy-name">Title</Label>
            <Input
              id="sy-name"
              placeholder="e.g. School Year 2026-2027"
              {...register("name", {
                required: "Title is required",
                minLength: { value: 2, message: "At least 2 characters" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { reset(); onClose(); }}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── School Year Card ─────────────────────────────────────────────────────────

function SchoolYearCard({
  year,
  hasActive,
}: {
  year: SchoolYear;
  hasActive: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [confirmAction, setConfirmAction] = useState<"activate" | "end" | null>(null);

  const activateMutation = useMutation({
    mutationFn: () => schoolYearApi.activate(year.id),
    onSuccess: () => {
      toast.success("School year activated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] });
      setConfirmAction(null);
    },
    onError: (err: AxiosError<{ message: string }>)=> {
      toast.error(err?.response?.data?.message ?? "Failed to activate.");
      setConfirmAction(null);
    },
  });

  const endMutation = useMutation({
    mutationFn: () => schoolYearApi.end(year.id),
    onSuccess: () => {
      toast.success("School year ended.");
      queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] });
      setConfirmAction(null);
    },
    onError: () => {
      toast.error("Failed to end school year.");
      setConfirmAction(null);
    },
  });

  const isMutating = activateMutation.isPending || endMutation.isPending;

  const confirmCopy = confirmAction === "activate"
    ? {
        title: "Activate this school year?",
        message: "This will make it the active school year. This cannot be undone.",
        confirmLabel: "Activate",
        destructive: false,
      }
    : {
        title: "End this school year?",
        message: "It will become read-only and archived. This cannot be undone.",
        confirmLabel: "End School Year",
        destructive: true,
      };

  return (
    <>
      <div
        className={cn(
          "rounded-lg border bg-card p-5 space-y-4",
          year.status === "active" && "border-primary/30 bg-primary/5"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-base">{year.name}</h3>
          </div>
          <StatusBadge status={year.status} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/school-years/${year.id}`)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            View
          </Button>

          {year.status === "pending" && !hasActive && (
            <Button
              variant="outline"
              size="sm"
              className="text-primary border-primary/30 hover:bg-primary/10"
              onClick={() => setConfirmAction("activate")}
              disabled={isMutating}
            >
              Set Active
            </Button>
          )}

          {year.status === "active" && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={() => setConfirmAction("end")}
              disabled={isMutating}
            >
              End School Year
            </Button>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <ConfirmDialog
          open
          title={confirmCopy.title}
          message={confirmCopy.message}
          confirmLabel={confirmCopy.confirmLabel}
          destructive={confirmCopy.destructive}
          isLoading={isMutating}
          onConfirm={() =>
            confirmAction === "activate"
              ? activateMutation.mutate()
              : endMutation.mutate()
          }
          onOpenChange={(o) => { if (!o) setConfirmAction(null); }}
        />
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchoolYearsPage(): React.JSX.Element {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: schoolYears, isLoading } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: schoolYearApi.getAll,
  });

  const hasActive = schoolYears?.some((y) => y.status === "active") ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Years"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New School Year
          </Button>
        }
      />

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : !schoolYears?.length ? (
        <EmptyState
          icon={CalendarDays}
          title="No school years yet"
          description="Create your first school year to get started."
        />
      ) : (
        <div className="space-y-3">
          {schoolYears.map((year) => (
            <SchoolYearCard key={year.id} year={year} hasActive={hasActive} />
          ))}
        </div>
      )}

      <CreateSchoolYearDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}