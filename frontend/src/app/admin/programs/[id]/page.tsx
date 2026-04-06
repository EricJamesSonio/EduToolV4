"use client";
import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import { programApi } from "@/api/admin/program.api";
import { strandApi }  from "@/api/admin/strand.api";
import { courseApi }  from "@/api/admin/course.api";
import type { ProgramType } from "@/api/admin/program.api";
import type { CourseSnapshot, StrandSnapshot } from "@/types/admin/program.types";
import { ConfirmDialog }  from "@/components/shared/ConfirmDialog";
import { Button }         from "@/components/ui/button";
import { Input }          from "@/components/ui/input";
import { Label }          from "@/components/ui/label";
import { Badge }          from "@/components/ui/badge";
import { Skeleton }       from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, Plus, Pencil, Trash2, BookOpen, Layers, GraduationCap,
} from "lucide-react";
import type { AxiosError } from "axios";

const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  daycare:     "Daycare",
  kinder:      "Kindergarten",
  elementary:  "Elementary",
  jhs:         "Junior High School",
  shs:         "Senior High School",
  college:     "College",
  custom:      "Custom",
};

interface CourseDetail { id: string; name: string; code: string | null }
interface StrandDetail { id: string; name: string }
interface EditProgramForm { name: string; type: ProgramType }

// ─── Edit Program Dialog ───────────────────────────────────────────────────────

function EditProgramDialog({
  program, open, onClose,
}: {
  program: { id: string; name: string; type: ProgramType };
  open: boolean;
  onClose: () => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<EditProgramForm>({ defaultValues: { name: program.name, type: program.type } });
  const selectedType = watch("type");

  const mutation = useMutation({
    mutationFn: (values: EditProgramForm) => programApi.update(program.id, values),
    onSuccess: () => {
      toast.success("Program updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "programs", program.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to update program.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Edit Program</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Program Name</Label>
            <Input {...register("name", {
              required: "Name is required",
              minLength: { value: 2, message: "At least 2 characters" },
              maxLength: { value: 100, message: "Max 100 characters" },
            })} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={selectedType} onValueChange={(v) => setValue("type", v as ProgramType)}>
              <SelectTrigger>
                <span>{PROGRAM_TYPE_LABELS[selectedType] ?? "Select type"}</span>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROGRAM_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}
              disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Course Dialog ─────────────────────────────────────────────────────────────

interface CourseForm { name: string; code: string }

function CourseDialog({
  programId, schoolYearId, course, open, onClose, onSaved,
}: {
  programId:    string;
  schoolYearId: string;   // ← added
  course?:      CourseDetail;
  open:         boolean;
  onClose:      () => void;
  onSaved:      () => void;
}): React.JSX.Element {
  const isEdit = !!course;
  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<CourseForm>({
      defaultValues: { name: course?.name ?? "", code: course?.code ?? "" },
    });

  const mutation = useMutation({
    mutationFn: (values: CourseForm) =>
      isEdit
        ? courseApi.update(course!.id, { name: values.name, code: values.code || undefined })
        : courseApi.create({
            schoolYearId,                    // ← now included
            programId,
            name: values.name,
            code: values.code || undefined,
          }),
    onSuccess: () => {
      toast.success(isEdit ? "Course updated." : "Course added.");
      onSaved();
      reset();
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to save course.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Course" : "Add Course"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Course Name</Label>
            <Input placeholder="e.g. Bachelor of Science in IT"
              {...register("name", { required: "Name is required" })} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Code <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="e.g. BSIT" {...register("code")} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}
              disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Course"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Strand Dialog ─────────────────────────────────────────────────────────────

interface StrandForm { name: string }

function StrandDialog({
  programId, schoolYearId, strand, open, onClose, onSaved,
}: {
  programId:    string;
  schoolYearId: string;   // ← added
  strand?:      StrandDetail;
  open:         boolean;
  onClose:      () => void;
  onSaved:      () => void;
}): React.JSX.Element {
  const isEdit = !!strand;
  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<StrandForm>({ defaultValues: { name: strand?.name ?? "" } });

  const mutation = useMutation({
    mutationFn: (values: StrandForm) =>
      isEdit
        ? strandApi.update(strand!.id, { name: values.name })
        : strandApi.create({
            schoolYearId,                    // ← now included
            program_id: programId,
            name: values.name,
          }),
    onSuccess: () => {
      toast.success(isEdit ? "Strand updated." : "Strand added.");
      onSaved();
      reset();
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to save strand.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Strand" : "Add Strand"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Strand Name</Label>
            <Input placeholder="e.g. STEM, ABM, HUMSS"
              {...register("name", { required: "Name is required" })} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}
              disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Strand"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Courses Section ───────────────────────────────────────────────────────────

function CoursesSection({
  programId, schoolYearId, courses, onRefresh,
}: {
  programId:    string;
  schoolYearId: string;   // ← added
  courses:      CourseSnapshot[];
  onRefresh:    () => void;
}): React.JSX.Element {
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; course?: CourseDetail } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CourseSnapshot | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => courseApi.remove(id),
    onSuccess: () => { toast.success("Course deleted."); onRefresh(); setDeleteTarget(null); },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete course.");
      setDeleteTarget(null);
    },
  });

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Courses</span>
            <Badge variant="secondary" className="text-xs font-normal">{courses.length}</Badge>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs px-3"
            onClick={() => setDialog({ mode: "create" })}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Course
          </Button>
        </div>
        {courses.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No courses yet.</p>
            <button onClick={() => setDialog({ mode: "create" })}
              className="mt-1 text-xs text-primary hover:underline">
              Add the first course
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {courses.map((course) => (
              <div key={course.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 group hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm truncate">{course.name}</span>
                  {course.code && (
                    <Badge variant="outline" className="text-xs font-mono shrink-0">{course.code}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => setDialog({ mode: "edit", course: { id: course.id, name: course.name, code: course.code } })}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(course)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {dialog && (
        <CourseDialog
          programId={programId}
          schoolYearId={schoolYearId}   // ← passed down
          course={dialog.course}
          open
          onClose={() => setDialog(null)}
          onSaved={onRefresh}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog open
          title="Delete this course?"
          message={`Delete "${deleteTarget.name}"? Any subjects or classes linked to this course may be affected.`}
          confirmLabel="Delete Course" destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </>
  );
}

// ─── Strands Section ───────────────────────────────────────────────────────────

function StrandsSection({
  programId, schoolYearId, strands, onRefresh,
}: {
  programId:    string;
  schoolYearId: string;   // ← added
  strands:      StrandSnapshot[];
  onRefresh:    () => void;
}): React.JSX.Element {
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; strand?: StrandDetail } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StrandSnapshot | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => strandApi.remove(id),
    onSuccess: () => { toast.success("Strand deleted."); onRefresh(); setDeleteTarget(null); },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete strand.");
      setDeleteTarget(null);
    },
  });

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Strands</span>
            <Badge variant="secondary" className="text-xs font-normal">{strands.length}</Badge>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs px-3"
            onClick={() => setDialog({ mode: "create" })}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Strand
          </Button>
        </div>
        {strands.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No strands yet.</p>
            <button onClick={() => setDialog({ mode: "create" })}
              className="mt-1 text-xs text-primary hover:underline">
              Add the first strand
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {strands.map((strand) => (
              <div key={strand.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 group hover:bg-muted/20 transition-colors">
                <span className="text-sm truncate">{strand.name}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => setDialog({ mode: "edit", strand: { id: strand.id, name: strand.name } })}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(strand)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {dialog && (
        <StrandDialog
          programId={programId}
          schoolYearId={schoolYearId}   // ← passed down
          strand={dialog.strand}
          open
          onClose={() => setDialog(null)}
          onSaved={onRefresh}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog open
          title="Delete this strand?"
          message={`Delete "${deleteTarget.name}"? Any subjects linked to this strand may be affected.`}
          confirmLabel="Delete Strand" destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { data: program, isLoading } = useQuery({
    queryKey: ["admin", "programs", id],
    queryFn:  () => programApi.getOne(id),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "programs", id] });

  const isCollege    = program?.type === "college";
  const isSeniorHigh = program?.type === "shs";
  const showCourses  = isCollege;
  const showStrands  = isSeniorHigh;

  // school_year_id comes from the program record returned by the backend
  const schoolYearId = program?.school_year_id ?? "";

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!program) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Program not found.
      </p>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/programs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" /> Programs
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{program.name}</h1>
            <Badge variant={program.type === "custom" ? "outline" : "secondary"}>
              {PROGRAM_TYPE_LABELS[program.type as ProgramType] ?? program.type}
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
        </Button>
      </div>

      <div className="rounded-lg border bg-card divide-y">
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-32 text-sm text-muted-foreground shrink-0">Name</span>
          <span className="text-sm font-medium">{program.name}</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-32 text-sm text-muted-foreground shrink-0">Type</span>
          <Badge variant={program.type === "custom" ? "outline" : "secondary"}>
            {PROGRAM_TYPE_LABELS[program.type as ProgramType] ?? program.type}
          </Badge>
        </div>
        {showCourses && (
          <div className="flex items-center gap-4 px-4 py-3">
            <span className="w-32 text-sm text-muted-foreground shrink-0">Courses</span>
            <span className="text-sm">{program.courses?.length ?? 0}</span>
          </div>
        )}
        {showStrands && (
          <div className="flex items-center gap-4 px-4 py-3">
            <span className="w-32 text-sm text-muted-foreground shrink-0">Strands</span>
            <span className="text-sm">{program.strands?.length ?? 0}</span>
          </div>
        )}
      </div>

      {showCourses && (
        <CoursesSection
          programId={id}
          schoolYearId={schoolYearId}   // ← sourced from program record
          courses={program.courses ?? []}
          onRefresh={refresh}
        />
      )}
      {showStrands && (
        <StrandsSection
          programId={id}
          schoolYearId={schoolYearId}   // ← sourced from program record
          strands={program.strands ?? []}
          onRefresh={refresh}
        />
      )}
      {!showCourses && !showStrands && (
        <div className="rounded-lg border bg-card px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            This program type doesn&apos;t use courses or strands.
          </p>
        </div>
      )}

      {editOpen && (
        <EditProgramDialog
          program={program}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}