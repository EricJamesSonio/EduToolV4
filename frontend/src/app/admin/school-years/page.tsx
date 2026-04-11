// frontend/src/app/admin/school-years/page.tsx

"use client";

import { useState }                          from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm }                           from "react-hook-form";
import { toast }                             from "sonner";
import { useRouter }                         from "next/navigation";
import { isAxiosError }                      from "axios";

import { schoolYearApi }   from "@/api/admin/school-year.api";
import { PageHeader }      from "@/components/shared/PageHeader";
import { ConfirmDialog }   from "@/components/shared/ConfirmDialog";
import { StatusBadge }     from "@/components/shared/StatusBadge";
import { EmptyState }      from "@/components/shared/EmptyState";
import { Button }          from "@/components/ui/button";
import { Input }           from "@/components/ui/input";
import { Label }           from "@/components/ui/label";
import { Skeleton }        from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Eye, CalendarDays } from "lucide-react";

import type { SchoolYear } from "@/types/admin/school-year.types";
import { cn }         from "@/lib/utils";
import { formatDate } from "@/utils/date.util";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateForm {
  name:       string;
  start_date: string;
  end_date:   string;
}

interface ShortDurationWarning {
  pendingValues: CreateForm;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isShortDurationError(err: unknown): boolean {
  return (
    isAxiosError(err) &&
    err.response?.data?.error === "SHORT_DURATION_WARNING"
  );
}

// ---------------------------------------------------------------------------
// CreateSchoolYearDialog
// ---------------------------------------------------------------------------

function CreateSchoolYearDialog({
  open,
  onClose,
}: {
  open:    boolean;
  onClose: () => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();

  const [shortDurationWarning, setShortDurationWarning] =
    useState<ShortDurationWarning | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({
    defaultValues: { name: "", start_date: "", end_date: "" },
  });

  const mutation = useMutation({
    mutationFn: (payload: CreateForm & { confirm_short_duration?: boolean }) =>
      schoolYearApi.create({
        name:                    payload.name,
        start_date:              payload.start_date  || undefined,
        end_date:                payload.end_date    || undefined,
        confirm_short_duration:  payload.confirm_short_duration,
      }),

    onSuccess: () => {
      toast.success("School year created.");
      queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] });
      reset();
      setShortDurationWarning(null);
      onClose();
    },

    onError: (err: unknown, variables) => {
      if (isShortDurationError(err)) {
        // Intercept — show confirmation dialog instead of error toast
        setShortDurationWarning({ pendingValues: variables });
        return;
      }
      toast.error("Failed to create school year.");
    },
  });

  const onSubmit = (values: CreateForm) => mutation.mutate(values);

  const handleClose = () => {
    reset();
    setShortDurationWarning(null);
    onClose();
  };

  // User confirmed despite the short-duration warning — re-submit with flag
  const handleConfirmShortDuration = () => {
    if (!shortDurationWarning) return;
    mutation.mutate({
      ...shortDurationWarning.pendingValues,
      confirm_short_duration: true,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
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
                  required:  "Title is required",
                  minLength: { value: 2,   message: "At least 2 characters" },
                  maxLength: { value: 100, message: "Max 100 characters" },
                })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                type="date"
                {...register("start_date", {
                  required: "Start date is required",
                })}
              />
              {errors.start_date && (
                <p className="text-xs text-destructive">{errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input
                type="date"
                {...register("end_date", {
                  required: "End date is required",
                })}
              />
              {errors.end_date && (
                <p className="text-xs text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
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

      {/* Short-duration warning confirmation */}
      <ConfirmDialog
        open={!!shortDurationWarning}
        title="School year looks short"
        message="This school year doesn't span a full year. This might be a mistake — are you sure you want to proceed?"
        confirmLabel="Yes, create it"
        destructive={false}
        isLoading={mutation.isPending}
        onConfirm={handleConfirmShortDuration}
        onOpenChange={(o) => {
          if (!o) setShortDurationWarning(null);
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// SchoolYearCard
// ---------------------------------------------------------------------------

function SchoolYearCard({
  year,
  hasActive,
}: {
  year:      SchoolYear;
  hasActive: boolean;
}): React.JSX.Element {
  const router      = useRouter();
  const queryClient = useQueryClient();

  const [confirmAction, setConfirmAction] = useState<"activate" | "end" | null>(null);

  const activateMutation = useMutation({
    mutationFn: () => schoolYearApi.activate(year.id),
    onSuccess: () => {
      toast.success("School year activated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] });
      setConfirmAction(null);
    },
    onError: (err: unknown) => {
      const msg = isAxiosError(err)
        ? (err.response?.data?.message ?? "Failed to activate.")
        : "Failed to activate.";
      toast.error(msg);
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

  const confirmCopy =
    confirmAction === "activate"
      ? {
          title:        "Activate this school year?",
          message:      "This will make it the active school year. This cannot be undone.",
          confirmLabel: "Activate",
          destructive:  false,
        }
      : {
          title:        "End this school year?",
          message:      "It will become read-only and archived. This cannot be undone.",
          confirmLabel: "End School Year",
          destructive:  true,
        };

  return (
    <>
      <div
        className={cn(
          "rounded-lg border bg-card p-5 space-y-4",
          year.status === "active" && "border-primary/30 bg-primary/5"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-base">{year.name}</h3>
            {(year.start_date || year.end_date) && (
              <p className="text-xs text-muted-foreground">
                {year.start_date ? formatDate(year.start_date) : "—"}
                {" "}–{" "}
                {year.end_date ? formatDate(year.end_date) : "—"}
              </p>
            )}
          </div>
          <StatusBadge status={year.status} />
        </div>

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SchoolYearsPage(): React.JSX.Element {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: schoolYears, isLoading } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn:  schoolYearApi.getAll,
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