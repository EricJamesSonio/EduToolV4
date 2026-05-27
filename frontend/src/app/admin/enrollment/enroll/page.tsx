"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { usePrograms } from "@/hooks/admin/useSchoolYears";
import { useStudents } from "@/hooks/admin/useStudents";
import { useLevelsByYear } from "@/hooks/admin/useLevels";
import {
  useSchoolYearEnrollments,
  useBulkEnrollStudents,
  useEnrollInProgram,
  useUpdateProgramEnrollment,
} from "@/hooks/admin/useStudentEnrollment";
import { useSections } from "@/hooks/admin/useSchoolYears";
import { useClasses, useEnrollStudent } from "@/hooks/admin/useClasses";
import { useSubjects } from "@/hooks/admin/useSubject";
import { useEducators } from "@/hooks/admin/useEducators";
import { useSemesters } from "@/hooks/admin/useSemester";

import {
  ArrowLeft, Search, GraduationCap, Users, UserRoundCheck, CheckSquare,
  ChevronRight, BookOpen, Layers, CalendarDays,
} from "lucide-react";

import { format } from "date-fns";
import type { Class, ClassSchedule } from "@/types/admin/class.types";
import type { Subject } from "@/types/admin/subject.types";
import type { Educator } from "@/types/admin/educator.types";
import type { Semester } from "@/types/admin/semester.types";

import {
  PROGRAM_TYPE_LABELS, PROGRAM_TYPE_COLORS,
} from "@/types/admin/program.types";
import { cn } from "@/lib/utils";

import type { Student } from "@/types/admin/student.types";
import type {
  StudentSchoolYearEnrollment,
  EnrollStudentProgramRequest,
} from "@/types/admin/student-enrollment.types";

export default function EnrollWorkspacePage() {
  const router = useRouter();
  const params = useSearchParams();
  const schoolYearId = params.get("schoolYearId") ?? "";

  // ── Context selectors ──────────────────────────────────

  const [programId, setProgramId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [strandId, setStrandId] = useState("");
  const [levelId, setLevelId] = useState("");

  // ── Enroll new students ────────────────────────────────

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── Section assignment per row ────────────────────────

  const [sectionAssignments, setSectionAssignments] = useState<Record<string, string>>({});

  // ── Class enrollment ──────────────────────────────────
  const [isClassEnrollmentOpen, setIsClassEnrollmentOpen] = useState(false);
  const [selectedClassForEnrollment, setSelectedClassForEnrollment] = useState<Class | null>(null);
  const [studentsToEnrollInClass, setStudentsToEnrollInClass] = useState<Set<string>>(new Set());

  // ── Mutations ─────────────────────────────────────────

  const bulkEnrollMutation = useBulkEnrollStudents(schoolYearId);
  const enrollInProgramMutation = useEnrollInProgram(schoolYearId);
  const updateProgEnrollMutation = useUpdateProgramEnrollment(schoolYearId);
  const enrollInClassMutation = useEnrollStudent();

  // ── Handle class enroll ────────────────────────────────
  const handleClassEnroll = useCallback(async () => {
    if (!selectedClassForEnrollment || studentsToEnrollInClass.size === 0) return;

    try {
      await Promise.all(
        Array.from(studentsToEnrollInClass).map((studentId) =>
          enrollInClassMutation.mutateAsync({
            classId: selectedClassForEnrollment.id,
            studentId,
          })
        )
      );

      toast.success(`${studentsToEnrollInClass.size} student(s) enrolled in class.`);
      setIsClassEnrollmentOpen(false);
      setSelectedClassForEnrollment(null);
      setStudentsToEnrollInClass(new Set());
      router.push(`/admin/enrollment`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Failed to enroll some students in class.");
    }
  }, [selectedClassForEnrollment, studentsToEnrollInClass, enrollInClassMutation, router]);

  // ── Handle section assignment ─────────────────────────

  const handleAssignSection = useCallback(
    (programEnrollmentId: string, sectionId: string) => {
      updateProgEnrollMutation.mutate(
        { programEnrollmentId, data: { section_id: sectionId } },
        {
          onSuccess: () => toast.success("Section assigned."),
          onError: (err: unknown) => {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e?.response?.data?.message ?? "Failed to assign section.");
          },
        },
      );
    },
    [updateProgEnrollMutation],
  );

  // ── Data ──────────────────────────────────────────────

  const { data: schoolYears = [] } = useSchoolYears();
  const { data: programs = [], isLoading: progLoading } = usePrograms(schoolYearId || null);
  const { data: allLevels = [], isLoading: levelsLoading } = useLevelsByYear(schoolYearId);
  const { data: allStudents = [], isLoading: studentsLoading } = useStudents({});
  const { data: enrollments = [], isLoading: enrollLoading } = useSchoolYearEnrollments(schoolYearId);
  const { data: sections = [], isLoading: sectionsLoading } = useSections(schoolYearId || null, levelId || undefined);

  const { data: classesRaw = [], isLoading: classesLoading } = useClasses({ schoolYearId: schoolYearId || undefined });
  const { data: subjectsRaw = [], isLoading: subjectsLoading } = useSubjects();
  const { data: educatorsRaw = [], isLoading: educatorsLoading } = useEducators();
  const { data: semestersRaw = [], isLoading: semestersLoading } = useSemesters();

  const schoolYear  = schoolYears.find((sy) => sy.id === schoolYearId);
  const program     = programs.find((p) => p.id === programId);
  const isCollege   = program?.type === "college";
  const isSHS       = program?.type === "shs";
  const course      = program?.courses?.find((c) => c.id === courseId) ?? null;
  const strand      = program?.strands?.find((s) => s.id === strandId) ?? null;
  const level       = allLevels.find((l) => l.id === levelId) ?? null;

  const programLevels = useMemo(
    () => allLevels.filter((l) => l.program_id === programId),
    [allLevels, programId],
  );

  // Reset downstream when program changes
  const handleProgramChange = useCallback((v: string) => {
    setProgramId(v);
    setCourseId("");
    setStrandId("");
    setLevelId("");
  }, []);

  // ── Helper to format class schedules ────────────────
  const formatSchedule = useCallback((schedules: ClassSchedule[]) => {
    if (!schedules || schedules.length === 0) return "No schedule";
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return schedules.map(s => 
      `${weekdays[s.weekday]} ${s.startTime}–${s.endTime}`
    ).join(", ");
  }, []);

  // ── Lookup maps ────────────────────────────────────

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjectsRaw.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjectsRaw]);

  const educatorMap = useMemo(() => {
    const map = new Map<string, Educator>();
    educatorsRaw.forEach((e) => map.set(e.id, e));
    return map;
  }, [educatorsRaw]);

  const semesterMap = useMemo(() => {
    const map = new Map<string, Semester>();
    semestersRaw.forEach((s) => map.set(s.id, s));
    return map;
  }, [semestersRaw]);

  const studentMap = useMemo(() => {
    const map = new Map<string, { fullName: string; studentId: string | null }>();
    for (const s of allStudents) map.set(s.id, { fullName: s.fullName, studentId: s.studentId });
    return map;
  }, [allStudents]);

  // ── Filtered and enriched classes ────────────────────
  const filteredClasses = useMemo(() => {
    if (!schoolYearId || !programId) return [];

    let classes = classesRaw.filter(cls => cls.programId === programId);

    // Further filter by course, strand, level via subject
    classes = classes.filter(cls => {
      const subject = subjectMap.get(cls.subjectId);
      if (!subject) return false;

      let match = true;
      if (courseId && subject.courseId !== courseId) match = false;
      if (strandId && subject.strandId !== strandId) match = false;
      if (levelId && subject.levelId !== levelId) match = false;
      return match;
    });

    return classes.map(cls => ({
      ...cls,
      subjectName: subjectMap.get(cls.subjectId)?.title ?? cls.subjectName,
      educatorName: educatorMap.get(cls.educatorId)?.fullName ?? cls.educatorName,
      semesterName: semesterMap.get(cls.semesterId)?.name ?? cls.semesterName,
    }));
  }, [classesRaw, schoolYearId, programId, courseId, strandId, levelId, subjectMap, educatorMap, semesterMap]);

  // ── Eligible students (not yet enrolled) ──────────────

  const enrolledIds = useMemo(
    () => new Set(enrollments.map((e) => e.student_id)),
    [enrollments],
  );

  const eligible = useMemo(
    () => allStudents.filter((s) => !enrolledIds.has(s.id)),
    [allStudents, enrolledIds],
  );

  const filtered = useMemo(() => {
    if (!search) return eligible;
    const q = search.toLowerCase();
    return eligible.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        (s.studentId && s.studentId.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q),
    );
  }, [eligible, search]);

  // ── Selection helpers ─────────────────────────────────

  const toggleAll = useCallback(() => {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  }, [selected, filtered]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── All context students ────────────────────────────

  const allContextEnrollments = useMemo(() => {
    if (!programId) return [];
    return enrollments.filter((e) =>
      e.programEnrollments.some((pe) =>
        pe.program_id === programId &&
        (!courseId || pe.course?.id === courseId) &&
        (!strandId || pe.strand?.id === strandId) &&
        (!levelId || pe.level?.id === levelId),
      ),
    );
  }, [enrollments, programId, courseId, strandId, levelId]);

  // ── Pending section students ─────────────────────────

  const pendingSectionEnrollments = useMemo(() => {
    if (!programId) return [];
    return enrollments.filter((e) =>
      e.programEnrollments.some((pe) =>
        pe.program_id === programId &&
        pe.section === null &&
        (!courseId || pe.course?.id === courseId) &&
        (!strandId || pe.strand?.id === strandId) &&
        (!levelId || pe.level?.id === levelId),
      ),
    );
  }, [enrollments, programId, courseId, strandId, levelId]);

  // ── Students eligible for class enrollment (enrolled in program, not in class) ──
  const studentsEligibleForClassEnrollment = useMemo(() => {
    if (!programId || !levelId) return [];

    // Students enrolled in the current school year and program/level context
    const studentsInContext = allContextEnrollments.filter(enr =>
      enr.programEnrollments.some(pe =>
        pe.program_id === programId &&
        pe.level?.id === levelId &&
        !pe.section // Not yet assigned to a class in this specific program enrollment
      )
    );

    const eligibleStudents = new Map<string, any>();
    for (const enrollment of studentsInContext) {
      if (!eligibleStudents.has(enrollment.student_id)) {
        eligibleStudents.set(enrollment.student_id, enrollment);
      }
    }
    return Array.from(eligibleStudents.values()).map(enr => {
      const studentInfo = studentMap.get(enr.student_id);
      return {
        id: enr.student_id,
        fullName: studentInfo?.fullName ?? "Unknown Student",
        studentId: studentInfo?.studentId ?? "—",
      };
    });
  }, [programId, levelId, allContextEnrollments, studentMap]);

  // ── Class Columns ─────────────────────────────────────
  const classColumns: ColumnDef<Class>[] = useMemo(() => [
    {
      accessorKey: "subjectName",
      header: "Subject",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{row.original.subjectName}</p>
          <p className="text-xs text-muted-foreground truncate">{row.original.semesterName}</p>
        </div>
      ),
    },
    {
      accessorKey: "educatorName",
      header: "Educator",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.educatorName ?? "Not assigned"}</span>
      ),
    },
    {
      accessorKey: "sectionName",
      header: "Section",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.sectionName ?? "No Section"}
        </Badge>
      ),
    },
    {
      id: "schedule",
      header: "Schedule",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatSchedule(row.original.schedules)}
        </span>
      ),
    },
    {
      id: "capacity",
      header: "Capacity",
      cell: ({ row }) => {
        const { enrolledCount, capacity } = row.original;
        const isFull = enrolledCount >= capacity;
        return (
          <div className="space-y-1">
            <p className={cn("text-xs font-medium", isFull ? "text-destructive" : "text-muted-foreground")}>
              {enrolledCount} / {capacity}
            </p>
            <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all", isFull ? "bg-destructive" : "bg-primary")} 
                style={{ width: `${Math.min((enrolledCount / capacity) * 100, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={() => setSelectedClassForEnrollment(row.original)}
        >
          Select Class
        </Button>
      ),
    },
  ], [formatSchedule]);

  // ── Mutations ─────────────────────────────────────────

  const handleEnroll = useCallback(async () => {
    const students = allStudents.filter((s) => selected.has(s.id));
    if (students.length === 0) return;

    try {
      await bulkEnrollMutation.mutateAsync(
        { students: students.map((s) => ({ student_id: s.id })) },
      );

      const programData: EnrollStudentProgramRequest = {
        program_id: programId,
        ...(levelId ? { level_id: levelId } : {}),
        ...(courseId ? { course_id: courseId } : {}),
        ...(strandId ? { strand_id: strandId } : {}),
      };

      await Promise.all(
        students.map((s) =>
          enrollInProgramMutation.mutateAsync({
            studentId: s.id,
            data: programData,
          }),
        ),
      );

      toast.success(`${students.length} student(s) enrolled.`);
      router.push(`/admin/enrollment`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Failed to enroll some students.");
    }
  }, [
    selected, allStudents, bulkEnrollMutation, enrollInProgramMutation,
    programId, levelId, courseId, strandId, router,
  ]);

  // ── Table row type ────────────────────────────────

  interface ContextTableRow {
    id: string;
    peId: string;
    studentId: string | null;
    studentName: string;
    programName: string;
    sectionId: string | null;
    sectionName: string | null;
  }

  const contextColumns: ColumnDef<ContextTableRow>[] = useMemo(() => [
    {
      accessorKey: "studentId",
      header: "Student ID",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.studentId ?? "—"}</span>
      ),
    },
    {
      accessorKey: "studentName",
      header: "Name",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.studentName}</span>
      ),
    },
    {
      accessorKey: "programName",
      header: "Program",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.programName}</span>
      ),
    },
    {
      id: "section",
      header: "Section",
      cell: ({ row }) => {
        const r = row.original;
        const rowSectionId = sectionAssignments[r.peId] ?? "";
        if (r.sectionId) {
          return <span className="text-xs font-medium">{r.sectionName}</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <Select
              value={rowSectionId}
              onValueChange={(v) =>
                setSectionAssignments((prev) => ({ ...prev, [r.peId]: v ?? "" }))
              }
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Select section">
                  {(value: string | null) => {
                    if (!value) return null;
                    const s = sections.find((sec) => sec.id === value);
                    return s?.name ?? value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sections.length === 0 ? (
                  <SelectItem value="__none__" disabled className="text-xs text-muted-foreground">
                    No sections for this level
                  </SelectItem>
                ) : (
                  sections.map((sec) => (
                    <SelectItem key={sec.id} value={sec.id} className="text-xs">
                      {sec.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs shrink-0"
              disabled={!rowSectionId || updateProgEnrollMutation.isPending}
              onClick={() => handleAssignSection(r.peId, rowSectionId)}
            >
              Assign
            </Button>
          </div>
        );
      },
    },
  ], [sections, sectionAssignments, updateProgEnrollMutation]);

  // ── Loading ───────────────────────────────────────────

  const pageLoading = progLoading || levelsLoading || studentsLoading || enrollLoading || classesLoading || subjectsLoading || educatorsLoading || semestersLoading;

  return (
    <div className="space-y-6 pb-10">
      <button
        onClick={() => router.push("/admin/enrollment")}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Enrollment
      </button>

      <PageHeader title="Enroll Students" />

      {/* ── Breadcrumb ──────────────────────────────────── */}
      {(programId || courseId || strandId || levelId) && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <button onClick={() => { setProgramId(""); setCourseId(""); setStrandId(""); setLevelId(""); }} className="hover:text-foreground transition-colors">
            {schoolYear?.name ?? "School Year"}
          </button>
          {program && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <button onClick={() => { setCourseId(""); setStrandId(""); setLevelId(""); }} className="hover:text-foreground transition-colors font-medium text-foreground">
                {program.name}
              </button>
            </>
          )}
          {course && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <button onClick={() => setLevelId("")} className="hover:text-foreground transition-colors font-medium text-foreground">
                {course.code ?? course.name}
              </button>
            </>
          )}
          {strand && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <button onClick={() => setLevelId("")} className="hover:text-foreground transition-colors font-medium text-foreground">
                {strand.name}
              </button>
            </>
          )}
          {level && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{level.name}</span>
            </>
          )}
        </div>
      )}

      {/* ── Step 1: Program cards ── */}
      {!programId && (
        <div>
          {progLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {programs.map((p) => {
                const typeLabel = PROGRAM_TYPE_LABELS[p.type as keyof typeof PROGRAM_TYPE_LABELS] ?? p.type;
                const typeColor = PROGRAM_TYPE_COLORS[p.type as keyof typeof PROGRAM_TYPE_COLORS] ?? "";
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProgramChange(p.id)}
                    className="rounded-xl border bg-card p-6 space-y-4 text-left transition-all hover:bg-muted/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="icon-container icon-edu shrink-0 mt-0.5">
                        <GraduationCap className="h-4.5 w-4.5" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="font-semibold text-lg leading-tight">{p.name}</p>
                        <Badge variant="outline" className={cn("text-xs border", typeColor)}>
                          {typeLabel}
                        </Badge>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Course / Strand cards ── */}
      {programId && !courseId && !strandId && (isCollege || isSHS) && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {(isCollege ? program?.courses : program?.strands)?.map((item) => {
              const c = item as { id: string; name: string; code?: string | null };
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (isCollege) setCourseId(c.id);
                    else setStrandId(c.id);
                    setLevelId("");
                  }}
                  className="rounded-xl border bg-card p-6 space-y-4 text-left transition-all hover:bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="icon-container icon-edu shrink-0 mt-0.5">
                      <BookOpen className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-lg leading-tight">{c.code ?? c.name}</p>
                      {c.code && <p className="text-sm text-muted-foreground">{c.name}</p>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 3: Level cards ── */}
      {!!programId && !levelId && (isCollege ? !!courseId : isSHS ? !!strandId : true) && (
        <div>
          {levelsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : programLevels.length === 0 ? (
            <div className="rounded-xl border bg-card px-6 py-12 text-center">
              <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No levels available for this program.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {programLevels.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLevelId(l.id)}
                  className="rounded-xl border bg-card p-6 space-y-4 text-left transition-all hover:bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="icon-container icon-edu shrink-0 mt-0.5">
                      <Layers className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-lg leading-tight">{l.name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Search ──────────────────────────────────────── */}
      {levelId && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, student ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {filtered.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selected.size} of {filtered.length} selected
            </p>
          )}
        </div>
      )}

      {/* ── Section 1: Enroll New Students ───────────────── */}
      {levelId && (
        <div className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/20">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Enroll New Students</span>
          </div>

          {/* Student list */}
          {pageLoading ? (
            <div className="space-y-0 divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center space-y-2">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">
                {search
                  ? "No students match your search."
                  : "All students are already enrolled in this school year."}
              </p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="flex items-center gap-3 px-5 py-2 border-b bg-muted/20 text-xs font-medium text-muted-foreground">
                <button
                  onClick={toggleAll}
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    selected.size === filtered.length && filtered.length > 0
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40",
                  )}
                >
                  {selected.size === filtered.length && filtered.length > 0 && (
                    <CheckSquare className="h-3 w-3" />
                  )}
                </button>
                <span className="w-24">Student ID</span>
                <span className="flex-1">Name</span>
                <span className="w-20">Status</span>
              </div>

              {/* Rows */}
              <div className="max-h-80 overflow-y-auto divide-y">
                {filtered.map((student) => {
                  const isSelected = selected.has(student.id);
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggle(student.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-muted/30",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40",
                        )}
                      >
                        {isSelected && <CheckSquare className="h-3 w-3" />}
                      </div>
                      <span className="w-24 text-sm text-muted-foreground truncate">
                        {student.studentId ?? "—"}
                      </span>
                      <span className="flex-1 text-sm font-medium truncate">
                        {student.fullName}
                      </span>
                      <span className="w-20">
                        <Badge
                          variant={student.status === "active" ? "default" : "secondary"}
                          className="text-[10px] capitalize"
                        >
                          {student.status}
                        </Badge>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Actions */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                {selected.size > 0
                  ? `${selected.size} student${selected.size > 1 ? "s" : ""} selected`
                  : "Select students to enroll"}
              </p>
              <Button
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={selected.size === 0 || bulkEnrollMutation.isPending}
              >
                {bulkEnrollMutation.isPending
                  ? "Enrolling..."
                  : `Enroll ${selected.size > 0 ? `(${selected.size})` : ""}`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Section 2: All Students / Pending Section tabs ── */}
      {levelId && (
        <Tabs defaultValue="all" className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/20">
            <UserRoundCheck className="h-4 w-4 text-primary" />
            <TabsList>
              <TabsTrigger value="all">All Students</TabsTrigger>
              <TabsTrigger value="pending">Pending Section</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all">
            <DataTable
              columns={contextColumns}
              data={allContextEnrollments.map((enr) => {
                const pe = enr.programEnrollments.find(
                  (pe) =>
                    pe.program_id === programId &&
                    (!courseId || pe.course?.id === courseId) &&
                    (!strandId || pe.strand?.id === strandId) &&
                    (!levelId || pe.level?.id === levelId),
                );
                const student = studentMap.get(enr.student_id);
                return {
                  id: enr.id,
                  peId: pe?.id ?? "",
                  studentId: student?.studentId ?? null,
                  studentName: student?.fullName ?? "Unknown Student",
                  programName: pe?.program.name ?? "",
                  sectionId: pe?.section?.id ?? null,
                  sectionName: pe?.section?.name ?? null,
                };
              })}
              isLoading={pageLoading}
              emptyTitle="No students in this context"
              emptyDescription="No students are enrolled in this context yet."
            />
          </TabsContent>

          <TabsContent value="pending" className="pt-4 space-y-2">
            <p className="text-xs text-muted-foreground px-1">
              Students enrolled in a program who haven&apos;t been assigned to a
              section yet.
            </p>
            <DataTable
              columns={contextColumns}
              data={pendingSectionEnrollments.map((enr) => {
                const pe = enr.programEnrollments.find(
                  (pe) =>
                    pe.program_id === programId &&
                    pe.section === null &&
                    (!courseId || pe.course?.id === courseId) &&
                    (!strandId || pe.strand?.id === strandId) &&
                    (!levelId || pe.level?.id === levelId),
                );
                const student = studentMap.get(enr.student_id);
                return {
                  id: enr.id,
                  peId: pe?.id ?? "",
                  studentId: student?.studentId ?? null,
                  studentName: student?.fullName ?? "Unknown Student",
                  programName: pe?.program.name ?? "",
                  sectionId: null,
                  sectionName: null,
                };
              })}
              isLoading={pageLoading}
              emptyTitle="All sections assigned"
              emptyDescription="No pending section assignments for this school year."
              className="rounded-lg border"
            />
          </TabsContent>

          <TabsContent value="pending" className="pt-4 space-y-2">
            <p className="text-xs text-muted-foreground px-1">
              Students enrolled in a program who haven&apos;t been assigned to a
              section yet.
            </p>
            <DataTable
              columns={contextColumns}
              data={pendingSectionEnrollments.map((enr) => {
                const pe = enr.programEnrollments.find(
                  (pe) =>
                    pe.program_id === programId &&
                    pe.section === null &&
                    (!courseId || pe.course?.id === courseId) &&
                    (!strandId || pe.strand?.id === strandId) &&
                    (!levelId || pe.level?.id === levelId),
                );
                const student = studentMap.get(enr.student_id);
                return {
                  id: enr.id,
                  peId: pe?.id ?? "",
                  studentId: student?.studentId ?? null,
                  studentName: student?.fullName ?? "Unknown Student",
                  programName: pe?.program.name ?? "",
                  sectionId: null,
                  sectionName: null,
                };
              })}
              isLoading={pageLoading}
              emptyTitle="All sections assigned"
              emptyDescription="No pending section assignments for this school year."
              className="rounded-lg border"
            />
          </TabsContent>

          <TabsContent value="assignment" className="pt-4">
            <div className="rounded-lg border border-dashed bg-muted/20 px-6 py-12 text-center space-y-2">
              <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">
                Section Assignment
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Bulk-assign or reassign students to sections across programs and
                levels. This view helps you manage section rosters efficiently.
              </p>
            </div>
          </TabsContent>

          {/* ── Class Enrollment Tab ───────────────────────── */}
          <TabsContent value="classes" className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Enroll Students in Classes</p>
              <Button
                size="sm"
                onClick={() => setIsClassEnrollmentOpen(true)}
                disabled={studentsToEnrollInClass.size === 0 || !selectedClassForEnrollment}
              >
                {`Enroll ${studentsToEnrollInClass.size} Student(s)`}
              </Button>
            </div>
            {classesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredClasses.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No classes found for this selection"
                description="Please select a program, course, strand, and level to see available classes."
              />
            ) : (
              <>
                {/* Class Table */} 
                <DataTable
                  columns={classColumns}
                  data={filteredClasses}
                  isLoading={classesLoading}
                  emptyTitle="No classes found"
                  emptyDescription="Try adjusting your filters or creating a new class."
                  className="rounded-lg border"
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* ── Confirm enroll dialog ──────────────────────── */}
      {confirmOpen && (
        <ConfirmDialog
          open
          title="Enroll students?"
          message={`Are you sure you want to enroll ${selected.size} student${selected.size > 1 ? "s" : ""} into ${program?.name ?? "this school year"}?`}
          confirmLabel="Enroll"
          isLoading={bulkEnrollMutation.isPending}
          onConfirm={handleEnroll}
          onOpenChange={(o) => { if (!o) setConfirmOpen(false); }}
        />
      )}
    </div>
  );
}
