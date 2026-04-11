"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm }   from "react-hook-form";
import { toast }     from "sonner";
import Link          from "next/link";
import { useRouter } from "next/navigation";

import { schoolYearApi }       from "@/api/admin/school-year.api";
import { academicCalendarApi } from "@/api/admin/academic-calendar.api";
import { programApi }          from "@/api/admin/program.api";
import { levelApi }            from "@/api/admin/level.api";
import { sectionApi }          from "@/api/admin/section.api";

import type { CalendarEventType } from "@/types/admin/calendar.types";
import type { CalendarEvent }     from "@/types/admin/calendar.types";
import type { SchoolYear }        from "@/types/admin/school-year.types";
import type { Program }           from "@/types/admin/program.types";
import type { Level }             from "@/types/admin/level.types";
import type { Section }           from "@/types/admin/section.types";

import { EnrollmentTab }  from "@/components/admin/enrollment/EnrollmentTab";
import { ProgramGroup }   from "@/components/admin/levels/ProgramGroup";
import { CoursesSection } from "@/components/admin/program/CoursesSection";
import { StrandsSection } from "@/components/admin/program/StrandsSection";
import { StatusBadge }    from "@/components/shared/StatusBadge";
import { ConfirmDialog }  from "@/components/shared/ConfirmDialog";
import { DataTable }      from "@/components/shared/DataTable";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge }    from "@/components/ui/badge";
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
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Users,
  BookOpen,
  GraduationCap,
  Layers,
  X,
} from "lucide-react";

import { ColumnDef }  from "@tanstack/react-table";
import { cn }         from "@/lib/utils";
import { formatDate } from "@/utils/date.util";
import { PROGRAM_TYPE_LABELS, PROGRAM_TYPE_COLORS } from "@/types/admin/program.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "enrollments" | "programs" | "calendar";

const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  holiday:       "Holiday",
  no_class_day:  "No Class Day",
  exam_week:     "Exam Week",
  special_event: "Special Event",
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ schoolYear }: { schoolYear: SchoolYear }): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-card divide-y">
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-32 text-sm text-muted-foreground shrink-0">Title</span>
        <span className="text-sm font-medium">{schoolYear.name}</span>
      </div>
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-32 text-sm text-muted-foreground shrink-0">Status</span>
        <StatusBadge status={schoolYear.status} />
      </div>
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-32 text-sm text-muted-foreground shrink-0">Start Date</span>
        <span className="text-sm">
          {schoolYear.start_date ? formatDate(schoolYear.start_date) : "—"}
        </span>
      </div>
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-32 text-sm text-muted-foreground shrink-0">End Date</span>
        <span className="text-sm">
          {schoolYear.end_date ? formatDate(schoolYear.end_date) : "—"}
        </span>
      </div>
    </div>
  );
}

// ─── Sections Panel (per level) ───────────────────────────────────────────────

interface SectionFormValues {
  name:     string;
  capacity: string;
}

interface SectionsPanelProps {
  level:        Level;
  schoolYearId: string;
  isEnded:      boolean;
}

function SectionsPanel({ level, schoolYearId, isEnded }: SectionsPanelProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState<Section | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);

  const qKey = ["admin", "sections", schoolYearId, level.id];

  const { data: sections = [], isLoading } = useQuery({
    queryKey: qKey,
    queryFn:  () => sectionApi.getAll(schoolYearId, level.id),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qKey });

  const createMutation = useMutation({
    mutationFn: (vals: SectionFormValues) =>
      sectionApi.create({
        levelId:      level.id,
        schoolYearId,
        name:         vals.name,
        capacity:     Number(vals.capacity),
      }),
    onSuccess: () => { toast.success("Section created."); invalidate(); setDialogOpen(false); },
    onError:   () => toast.error("Failed to create section."),
  });

  const updateMutation = useMutation({
    mutationFn: (vals: SectionFormValues) =>
      sectionApi.update(editTarget!.id, {
        name:     vals.name,
        capacity: Number(vals.capacity),
      }),
    onSuccess: () => { toast.success("Section updated."); invalidate(); setEditTarget(null); },
    onError:   () => toast.error("Failed to update section."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sectionApi.delete(id),
    onSuccess: () => { toast.success("Section deleted."); invalidate(); setDeleteTarget(null); },
    onError:   () => toast.error("Failed to delete section."),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="border-t bg-muted/10">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-2.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Sections
          {sections.length > 0 && (
            <span className="ml-1.5 font-normal normal-case">({sections.length})</span>
          )}
        </span>
        {!isEnded && (
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" />
            Add section
          </button>
        )}
      </div>

      {/* Section list */}
      {isLoading ? (
        <div className="px-6 pb-3 space-y-1.5">
          {[1, 2].map((i) => <Skeleton key={i} className="h-7 w-full rounded" />)}
        </div>
      ) : sections.length === 0 ? (
        <p className="px-6 pb-3 text-xs text-muted-foreground">No sections yet.</p>
      ) : (
        <div className="px-6 pb-3 space-y-1">
          {sections.map((sec) => (
            <div
              key={sec.id}
              className="flex items-center justify-between gap-3 group rounded px-2 py-1.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-medium truncate">{sec.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  cap. {sec.capacity}
                </span>
                {sec.studentCount > 0 && (
                  <Badge variant="secondary" className="text-xs font-normal px-1.5 py-0">
                    {sec.studentCount} student{sec.studentCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              {!isEnded && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => setEditTarget(sec)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(sec)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      {dialogOpen && (
        <SectionFormDialog
          mode="create"
          isLoading={isMutating}
          onClose={() => setDialogOpen(false)}
          onSubmit={(vals) => createMutation.mutate(vals)}
        />
      )}

      {/* Edit dialog */}
      {editTarget && (
        <SectionFormDialog
          mode="edit"
          defaultValues={{ name: editTarget.name, capacity: String(editTarget.capacity) }}
          isLoading={isMutating}
          onClose={() => setEditTarget(null)}
          onSubmit={(vals) => updateMutation.mutate(vals)}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this section?"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete Section"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}

interface SectionFormDialogProps {
  mode:          "create" | "edit";
  defaultValues?: SectionFormValues;
  isLoading:     boolean;
  onClose:       () => void;
  onSubmit:      (vals: SectionFormValues) => void;
}

function SectionFormDialog({
  mode,
  defaultValues,
  isLoading,
  onClose,
  onSubmit,
}: SectionFormDialogProps): React.JSX.Element {
  const { register, handleSubmit, formState: { errors } } = useForm<SectionFormValues>({
    defaultValues: defaultValues ?? { name: "", capacity: "40" },
  });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Section" : "Edit Section"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Section A"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input
              type="number"
              min={1}
              {...register("capacity", {
                required: "Capacity is required",
                min: { value: 1, message: "Must be at least 1" },
              })}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">{errors.capacity.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : mode === "create" ? "Add Section" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Level List with Sections (used inside program detail) ────────────────────

interface LevelWithSectionsListProps {
  schoolYearId: string;
  programId:    string;
  isEnded:      boolean;
}

function LevelWithSectionsList({
  schoolYearId,
  programId,
  isEnded,
}: LevelWithSectionsListProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [deleteTarget,   setDeleteTarget]   = useState<Level | null>(null);
  const [updatingId,     setUpdatingId]     = useState<string | null>(null);

  const qKey = ["admin", "levels-by-program", schoolYearId, programId];

  const { data: allLevels = [], isLoading } = useQuery({
    queryKey: ["admin", "levels", schoolYearId],
    queryFn:  () => levelApi.getBySchoolYear(schoolYearId),
  });

  const levels = allLevels.filter((l) => l.program_id === programId);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "levels", schoolYearId] });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => levelApi.updateOne(id, name),
    onMutate:   ({ id }) => setUpdatingId(id),
    onSuccess:  () => { toast.success("Level renamed."); invalidate(); },
    onError:    () => toast.error("Failed to rename level."),
    onSettled:  () => setUpdatingId(null),
  });

  const generateMutation = useMutation({
    mutationFn: (count: number) =>
      levelApi.bulkGenerate({ programId, schoolYearId, count }),
    onSuccess: () => { toast.success("Levels generated."); invalidate(); },
    onError:   () => toast.error("Failed to generate levels."),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => levelApi.create({ programId, name, schoolYearId }),
    onSuccess:  () => { toast.success("Level added."); invalidate(); },
    onError:    () => toast.error("Failed to add level."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => levelApi.deleteOne(id),
    onSuccess:  () => { toast.success("Level deleted."); invalidate(); setDeleteTarget(null); },
    onError:    () => toast.error("Failed to delete level."),
  });

  // We need a fake single-program levels map for ProgramGroup
  const { data: program } = useQuery({
    queryKey: ["admin", "program", programId],
    queryFn:  () => programApi.getOne(programId),
  });

  const toggleSection = (levelId: string) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(levelId)) next.delete(levelId);
      else next.add(levelId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!program) return <></>;

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Levels</span>
            <Badge variant="secondary" className="text-xs font-normal">
              {levels.length}
            </Badge>
          </div>
        </div>

        {/* Reuse ProgramGroup for the level management UI */}
        <div className="border-none">
          <ProgramGroup
            program={program}
            levels={levels}
            isEnded={isEnded}
            onUpdate={(id, name) => updateMutation.mutate({ id, name })}
            onDelete={(level) => setDeleteTarget(level)}
            onGenerate={(_programId, count) => generateMutation.mutate(count)}
            onAdd={() => {
              const name = `Level ${levels.length + 1}`;
              createMutation.mutate(name);
            }}
            isUpdating={updateMutation.isPending}
            isGenerating={generateMutation.isPending}
            isAdding={createMutation.isPending}
            updatingId={updatingId}
          />
        </div>

        {/* Sections expandable per level */}
        {levels.length > 0 && (
          <div className="border-t divide-y">
            {levels.map((level) => (
              <div key={level.id}>
                <button
                  onClick={() => toggleSection(level.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left text-sm"
                >
                  {expandedLevels.has(level.id) ? (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rotate-90 transition-transform" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform" />
                  )}
                  <span className="font-medium text-xs text-muted-foreground">{level.name}</span>
                  <span className="text-xs text-muted-foreground">— sections</span>
                </button>
                {expandedLevels.has(level.id) && (
                  <SectionsPanel
                    level={level}
                    schoolYearId={schoolYearId}
                    isEnded={isEnded}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this level?"
          message={`Delete "${deleteTarget.name}"? This cannot be undone. Any classes or students linked to this level may be affected.`}
          confirmLabel="Delete Level"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </>
  );
}

// ─── Program Detail (drill-in) ─────────────────────────────────────────────

interface ProgramDetailViewProps {
  program:      Program;
  schoolYearId: string;
  isEnded:      boolean;
  onBack:       () => void;
}

function ProgramDetailView({
  program,
  schoolYearId,
  isEnded,
  onBack,
}: ProgramDetailViewProps): React.JSX.Element {
  const showCourses = program.type === "college";
  const showStrands = program.type === "shs";
  const typeLabel   = PROGRAM_TYPE_LABELS[program.type] ?? program.type;
  const typeColor   = PROGRAM_TYPE_COLORS[program.type] ?? "";

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Programs
        </button>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0 mt-0.5">
          <GraduationCap className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{program.name}</h2>
          <Badge className={cn("text-xs border", typeColor)}>{typeLabel}</Badge>
        </div>
      </div>

      {/* Levels + Sections */}
      <LevelWithSectionsList
        schoolYearId={schoolYearId}
        programId={program.id}
        isEnded={isEnded}
      />

      {/* Courses (college only) */}
      {showCourses && (
        <CoursesSection
          programId={program.id}
          schoolYearId={schoolYearId}
          courses={program.courses ?? []}
        />
      )}

      {/* Strands (SHS only) */}
      {showStrands && (
        <StrandsSection
          programId={program.id}
          schoolYearId={schoolYearId}
          strands={program.strands ?? []}
        />
      )}

      {!showCourses && !showStrands && (
        <div className="rounded-lg border bg-card px-6 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            This program type doesn&apos;t use courses or strands.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Programs Tab ──────────────────────────────────────────────────────────────

interface ProgramsTabProps {
  schoolYearId: string;
  isEnded:      boolean;
}

function ProgramsTab({ schoolYearId, isEnded }: ProgramsTabProps): React.JSX.Element {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["admin", "programs", schoolYearId],
    queryFn:  () => programApi.getAll(schoolYearId),
  });

  // If a program is drilled into, re-fetch it fresh so courses/strands are current
  const { data: freshProgram } = useQuery({
    queryKey: ["admin", "program", selectedProgram?.id],
    queryFn:  () => programApi.getOne(selectedProgram!.id),
    enabled:  !!selectedProgram,
  });

  if (selectedProgram) {
    return (
      <ProgramDetailView
        program={freshProgram ?? selectedProgram}
        schoolYearId={schoolYearId}
        isEnded={isEnded}
        onBack={() => setSelectedProgram(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!programs.length) {
    return (
      <div className="rounded-lg border bg-card px-6 py-12 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No programs for this school year</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add programs from the{" "}
          <Link href="/admin/programs" className="text-primary hover:underline">
            Programs page
          </Link>{" "}
          or run the data seeder from Organization settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {programs.map((program) => {
        const typeLabel = PROGRAM_TYPE_LABELS[program.type] ?? program.type;
        const typeColor = PROGRAM_TYPE_COLORS[program.type] ?? "";
        const courseCount = program.courses?.length ?? 0;
        const strandCount = program.strands?.length ?? 0;

        return (
          <button
            key={program.id}
            onClick={() => setSelectedProgram(program)}
            className="w-full rounded-lg border bg-card p-4 text-left hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0 mt-0.5">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{program.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn("text-xs border", typeColor)}>{typeLabel}</Badge>
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
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Calendar Tab ──────────────────────────────────────────────────────────────

interface CalendarEventForm {
  title:       string;
  type:        CalendarEventType;
  startDate:   string;
  endDate:     string;
  description: string;
}

function EventFormDialog({
  mode,
  event,
  schoolYearId: _schoolYearId,
  isLoading,
  onClose,
  onSubmit,
}: {
  mode:         "create" | "edit";
  event?:       CalendarEvent;
  schoolYearId: string;
  isLoading:    boolean;
  onClose:      () => void;
  onSubmit:     (values: Omit<CalendarEventForm, "schoolYearId"> & { schoolYearId?: string }) => void;
}): React.JSX.Element {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CalendarEventForm>({
    defaultValues: {
      title:       event?.title ?? "",
      type:        event?.type  ?? "holiday",
      startDate:   event?.start_date?.slice(0, 10) ?? "",
      endDate:     event?.end_date?.slice(0, 10)   ?? "",
      description: event?.description ?? "",
    },
  });

  const selectedType = watch("type");

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Event" : "Edit Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              placeholder="e.g. Christmas Holiday"
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => setValue("type", v as CalendarEventType)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" {...register("startDate", { required: "Required" })} />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" {...register("endDate", { required: "Required" })} />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>
              Notes{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea rows={2} {...register("description")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : mode === "create" ? "Add Event" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CalendarTab({ schoolYearId }: { schoolYearId: string }): React.JSX.Element {
  const queryClient = useQueryClient();
  const [eventDialog, setEventDialog] = useState<{
    mode: "create" | "edit";
    event?: CalendarEvent;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin", "calendar", schoolYearId],
    queryFn:  () => academicCalendarApi.getAll(schoolYearId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "calendar", schoolYearId] });

  const createMutation = useMutation({
    mutationFn: academicCalendarApi.create,
    onSuccess: (res) => {
      if (res.warning) toast.warning(res.warning);
      else toast.success("Event added.");
      invalidate();
      setEventDialog(null);
    },
    onError: () => toast.error("Failed to add event."),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id:   string;
      data: Parameters<typeof academicCalendarApi.update>[1];
    }) => academicCalendarApi.update(id, data),
    onSuccess: (res) => {
      if (res.warning) toast.warning(res.warning);
      else toast.success("Event updated.");
      invalidate();
      setEventDialog(null);
    },
    onError: () => toast.error("Failed to update event."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => academicCalendarApi.remove(id),
    onSuccess: () => {
      toast.success("Event deleted.");
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete event."),
  });

  const columns: ColumnDef<CalendarEvent>[] = [
    {
      accessorKey: "start_date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDate(row.original.start_date)}
          {row.original.start_date !== row.original.end_date && (
            <span className="text-muted-foreground">
              {" "}– {formatDate(row.original.end_date)}
            </span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {EVENT_TYPE_LABELS[row.original.type]}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Notes",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.description ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setEventDialog({ mode: "edit", event: row.original })}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setEventDialog({ mode: "create" })}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Event
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={events ?? []}
        isLoading={isLoading}
        emptyTitle="No events yet"
        emptyDescription="Add holidays, exam weeks, or other calendar events."
      />
      {eventDialog && (
        <EventFormDialog
          mode={eventDialog.mode}
          event={eventDialog.event}
          schoolYearId={schoolYearId}
          isLoading={createMutation.isPending || updateMutation.isPending}
          onClose={() => setEventDialog(null)}
          onSubmit={(values) => {
            if (eventDialog.mode === "create") {
              createMutation.mutate({ ...values, schoolYearId });
            } else if (eventDialog.event) {
              updateMutation.mutate({ id: eventDialog.event.id, data: values });
            }
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete event?"
          message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SchoolYearDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: schoolYear, isLoading } = useQuery({
    queryKey: ["admin", "school-years", id],
    queryFn:  () => schoolYearApi.getById(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!schoolYear) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        School year not found.
      </p>
    );
  }

  const isEnded = schoolYear.status === "ended";

  const TABS: { key: Tab; label: string; icon?: React.ReactNode }[] = [
    { key: "overview",    label: "Overview" },
    { key: "enrollments", label: "Enrollments", icon: <Users className="inline mr-1.5 h-3.5 w-3.5" /> },
    { key: "programs",    label: "Programs",    icon: <BookOpen className="inline mr-1.5 h-3.5 w-3.5" /> },
    { key: "calendar",    label: "Calendar" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/admin/school-years"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        School Years
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{schoolYear.name}</h1>
        <StatusBadge status={schoolYear.status} />
      </div>

      {/* Ended banner */}
      {isEnded && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This school year has ended and is read-only.
        </div>
      )}

      {/* Tabs */}
      <div className="border-b flex gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "overview"    && <OverviewTab schoolYear={schoolYear} />}
        {activeTab === "enrollments" && <EnrollmentTab schoolYearId={id} isEnded={isEnded} />}
        {activeTab === "programs"    && <ProgramsTab schoolYearId={id} isEnded={isEnded} />}
        {activeTab === "calendar"    && <CalendarTab schoolYearId={id} />}
      </div>
    </div>
  );
}