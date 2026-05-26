"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
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

import {
  ArrowLeft, Search, GraduationCap, Users, UserRoundCheck, CheckSquare,
  ChevronRight, BookOpen, Layers,
} from "lucide-react";

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

  // ── Data ──────────────────────────────────────────────

  const { data: schoolYears = [] } = useSchoolYears();
  const { data: programs = [], isLoading: progLoading } = usePrograms(schoolYearId || null);
  const { data: allLevels = [], isLoading: levelsLoading } = useLevelsByYear(schoolYearId);
  const { data: allStudents = [], isLoading: studentsLoading } = useStudents({});
  const { data: enrollments = [], isLoading: enrollLoading } = useSchoolYearEnrollments(schoolYearId);
  const { data: sections = [], isLoading: sectionsLoading } = useSections(schoolYearId || null, levelId || undefined);

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

  // ── Student lookup map ──────────────────────────────

  const studentMap = useMemo(() => {
    const map = new Map<string, { fullName: string; studentId: string | null }>();
    for (const s of allStudents) map.set(s.id, { fullName: s.fullName, studentId: s.studentId });
    return map;
  }, [allStudents]);

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

  // ── Mutations ─────────────────────────────────────────

  const bulkEnrollMutation = useBulkEnrollStudents(schoolYearId);
  const enrollInProgramMutation = useEnrollInProgram(schoolYearId);
  const updateProgEnrollMutation = useUpdateProgramEnrollment(schoolYearId);

  // ── Handle enroll ─────────────────────────────────────

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

  // ── Shared row renderer ─────────────────────────────

  const renderRow = useCallback(
    (enr: StudentSchoolYearEnrollment, requireNoSection: boolean): React.ReactNode => {
      const pe = enr.programEnrollments.find(
        (pe) =>
          pe.program_id === programId &&
          (!requireNoSection || pe.section === null) &&
          (!courseId || pe.course?.id === courseId) &&
          (!strandId || pe.strand?.id === strandId) &&
          (!levelId || pe.level?.id === levelId),
      );
      if (!pe) return null;
      const student = studentMap.get(enr.student_id);
      const hasSection = pe.section !== null;
      const rowSectionId = sectionAssignments[pe.id] ?? "";
      return (
        <div key={`${pe.id}-${enr.id}`} className="flex items-center gap-3 px-5 py-2.5">
          <span className="w-24 text-sm text-muted-foreground truncate">
            {student?.studentId ?? "—"}
          </span>
          <span className="flex-1 text-sm font-medium truncate">
            {student?.fullName ?? "Unknown Student"}
          </span>
          <span className="w-20 text-xs text-muted-foreground truncate">
            {pe.program.name}
          </span>
          <div className="w-48 flex items-center gap-2">
            {hasSection ? (
              <span className="text-xs font-medium truncate">
                {pe.section!.name}
              </span>
            ) : (
              <>
                <Select
                  value={rowSectionId}
                  onValueChange={(v) =>
                    setSectionAssignments((prev) => ({
                      ...prev,
                      [pe.id]: v ?? "",
                    }))
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select section">
                      {(value: string | null) => {
                        if (!value) return null;
                        const s = sections.find((sec) => sec.id === value);
                        return s?.name ?? value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((sec) => (
                      <SelectItem key={sec.id} value={sec.id} className="text-xs">
                        {sec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs shrink-0"
                  disabled={!rowSectionId || updateProgEnrollMutation.isPending}
                  onClick={() => handleAssignSection(pe.id, rowSectionId)}
                >
                  Assign
                </Button>
              </>
            )}
          </div>
        </div>
      );
    },
    [
      programId, courseId, strandId, levelId, studentMap, sections,
      sectionAssignments, updateProgEnrollMutation, handleAssignSection,
    ],
  );

  // ── Loading ───────────────────────────────────────────

  const pageLoading = progLoading || levelsLoading || studentsLoading || enrollLoading;

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

      {/* ── Section 1: Enroll New Students ───────────────── */}
      {levelId && (
        <div className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/20">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Enroll New Students</span>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b">
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

          {pageLoading ? (
            <div className="space-y-0 divide-y">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-40" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="flex items-center gap-3 px-5 py-2 border-b bg-muted/20 text-xs font-medium text-muted-foreground">
                <span className="w-24">Student ID</span>
                <span className="flex-1">Name</span>
                <span className="w-20">Program</span>
                <span className="w-48">Section</span>
              </div>

              <TabsContent value="all">
                {allContextEnrollments.length === 0 ? (
                  <div className="px-5 py-8 text-center space-y-2">
                    <Users className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      No students are enrolled in this context yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {allContextEnrollments.map((enr) => renderRow(enr, false))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending">
                {pendingSectionEnrollments.length === 0 ? (
                  <div className="px-5 py-8 text-center space-y-2">
                    <UserRoundCheck className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      All students in this context have a section assigned.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {pendingSectionEnrollments.map((enr) => renderRow(enr, true))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
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
