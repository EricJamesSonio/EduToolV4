"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { programApi } from "@/api/admin/program.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import type { ProgramType } from "@/api/admin/program.api";
import type { Program } from "@/types/admin/program.types";
import type { SchoolYear } from "@/types/admin/school-year.types";
import { PageHeader } from "@/components/shared/PageHeader";
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
import {
  Plus,
  Eye,
  Trash2,
  BookOpen,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import type { AxiosError } from "axios";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  elementary: "Elementary",
  high_school: "High School",
  senior_high: "Senior High",
  college: "College",
  custom: "Custom",
};

const PROGRAM_TYPE_OPTIONS: { value: ProgramType; label: string }[] = [
  { value: "elementary", label: "Elementary" },
  { value: "high_school", label: "Junior High School" },
  { value: "senior_high", label: "Senior High School" },
  { value: "college", label: "College" },
  { value: "custom", label: "Custom" },
];

// ─── School Year Selector ─────────────────────────────────────────────────────

function SchoolYearSelector({
  schoolYears,
  isLoading,
  selectedId,
  onSelect,
}: {
  schoolYears: SchoolYear[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}): React.JSX.Element {
  if (isLoading) {
    return <Skeleton className="h-9 w-48" />;
  }

  if (schoolYears.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No school years found.</p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={selectedId ?? ""} onValueChange={onSelect}>
        <SelectTrigger className="w-52 h-9 text-sm">
          <SelectValue placeholder="Select school year" />
        </SelectTrigger>
        <SelectContent>
          {schoolYears.map((sy) => (
            <SelectItem key={sy.id} value={sy.id}>
              <div className="flex items-center gap-2">
                <span>{sy.name}</span>
                {sy.status === "active" && (
                  <Badge variant="default" className="text-xs py-0 px-1.5">
                    Active
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Create Dialog ────────────────────────────────────────────────────────────

interface CreateForm {
  name: string;
  type: ProgramType;
}

function CreateProgramDialog({
  open,
  onClose,
  schoolYearId,
}: {
  open: boolean;
  onClose: () => void;
  schoolYearId: string;
}): React.JSX.Element {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateForm>({
    defaultValues: { name: "", type: "elementary" },
  });

  const selectedType = watch("type");

  const mutation = useMutation({
    mutationFn: (values: CreateForm) =>
      programApi.create({ ...values, schoolYearId }),
    onSuccess: () => {
      toast.success("Program created.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "programs", schoolYearId],
      });
      reset();
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to create program.");
    },
  });

  const onSubmit = (values: CreateForm) => mutation.mutate(values);

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
          <DialogTitle>New Program</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label htmlFor="prog-name">Program Name</Label>
            <Input
              id="prog-name"
              placeholder="e.g. Bachelor of Science in IT"
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
            <Label>Type</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => setValue("type", v as ProgramType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROGRAM_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
              {mutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Program Card ─────────────────────────────────────────────────────────────

function ProgramCard({
  program,
  onDelete,
}: {
  program: Program;
  onDelete: (program: Program) => void;
}): React.JSX.Element {
  const router = useRouter();
  const isCustom = program.type === "custom";
  const courseCount = program.courses?.length ?? 0;
  const strandCount = program.strands?.length ?? 0;

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0 mt-0.5">
            <GraduationCap className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm leading-tight">
              {program.name}
            </h3>
            <div className="flex items-center gap-2">
              <Badge
                variant={isCustom ? "outline" : "secondary"}
                className="text-xs"
              >
                {PROGRAM_TYPE_LABELS[program.type]}
              </Badge>
              {courseCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {courseCount} {courseCount === 1 ? "course" : "courses"}
                </span>
              )}
              {strandCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {strandCount} {strandCount === 1 ? "strand" : "strands"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/programs/${program.id}`)}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View
        </Button>
        {isCustom && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={() => onDelete(program)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgramsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<
    string | null
  >(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);

  // Fetch all school years
  const { data: schoolYears = [], isLoading: syLoading } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: schoolYearApi.getAll,
  });

  // Auto-select the active school year on load
  useEffect(() => {
    if (schoolYears.length > 0 && !selectedSchoolYearId) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSelectedSchoolYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, selectedSchoolYearId]);

  // Fetch programs scoped to selected school year
  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ["admin", "programs", selectedSchoolYearId],
    queryFn: () => programApi.getAll(selectedSchoolYearId!),
    enabled: !!selectedSchoolYearId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => programApi.delete(id),
    onSuccess: () => {
      toast.success("Program deleted.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "programs", selectedSchoolYearId],
      });
      setDeleteTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete program.");
      setDeleteTarget(null);
    },
  });

  const isLoading = syLoading || programsLoading;
  const noSchoolYears = !syLoading && schoolYears.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs"
        actions={
          <div className="flex items-center gap-3">
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={syLoading}
              selectedId={selectedSchoolYearId}
              onSelect={setSelectedSchoolYearId}
            />
            <Button
              onClick={() => setCreateOpen(true)}
              disabled={!selectedSchoolYearId}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Program
            </Button>
          </div>
        }
      />

      {/* No school years at all */}
      {noSchoolYears ? (
        <EmptyState
          icon={CalendarDays}
          title="No school years found"
          description="Create a school year first before managing programs."
        />
      ) : !selectedSchoolYearId || isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : !programs?.length ? (
        <EmptyState
          icon={BookOpen}
          title="No programs for this school year"
          description="Add a program manually or run the data seeder from the Organization page."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onDelete={(p) => setDeleteTarget(p)}
            />
          ))}
        </div>
      )}

      {selectedSchoolYearId && (
        <CreateProgramDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          schoolYearId={selectedSchoolYearId}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this program?"
          message={`Delete "${deleteTarget.name}"? This cannot be undone. Make sure it has no levels, courses, or strands assigned to it first.`}
          confirmLabel="Delete Program"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}