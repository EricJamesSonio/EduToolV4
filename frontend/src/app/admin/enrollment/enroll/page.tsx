// ===== File: frontend\src\app\admin\enrollment\enroll\page.tsx =====
"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { ColumnDef } from "@tanstack/react-table";

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

import type { Subject } from "@/types/admin/subject.types";
import type { Educator } from "@/types/admin/educator.types";
import type { Semester } from "@/types/admin/semester.types";
import type { Student } from "@/types/admin/student.types";
import type {
  EnrollStudentProgramRequest,
} from "@/types/admin/student-enrollment.types";
import type { Class } from "@/types/admin/class.types";

import {
  ProgramSelector,
  CourseStrandSelector,
  LevelSelector,
  EnrollStudentPanel,
  ClassEnrollmentPanel,
  type ContextTableRow,
} from "./_components";
import { EnrollmentStepper, type StepDef, type StepStatus } from "./_components/EnrollmentStepper";

export default function EnrollWorkspacePage() {
  const router = useRouter();
  const params = useSearchParams();
  const schoolYearId = params.get("schoolYearId") ?? "";

  const [programId, setProgramId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [strandId, setStrandId] = useState("");
  const [levelId, setLevelId] = useState("");

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<"all" | "pending" | "enroll">("all");

  const [sectionAssignments, setSectionAssignments] = useState<Record<string, string>>({});

  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [classStudentSelections, setClassStudentSelections] = useState<Record<string, Set<string>>>({});
  const [enrollingClassIds, setEnrollingClassIds] = useState<Set<string>>(new Set());

  const bulkEnrollMutation = useBulkEnrollStudents(schoolYearId);
  const enrollInProgramMutation = useEnrollInProgram(schoolYearId);
  const updateProgEnrollMutation = useUpdateProgramEnrollment(schoolYearId);
  const enrollInClassMutation = useEnrollStudent();

  const toggleClassStudent = useCallback((classId: string, studentId: string) => {
    setClassStudentSelections((prev) => {
      const current = new Set(prev[classId] ?? []);
      if (current.has(studentId)) current.delete(studentId);
      else current.add(studentId);
      return { ...prev, [classId]: current };
    });
  }, []);

  const toggleAllClassStudents = useCallback((classId: string, studentIds: string[]) => {
    setClassStudentSelections((prev) => {
      const current = prev[classId] ?? new Set<string>();
      const allSelected = studentIds.every((id) => current.has(id));
      const next = new Set(allSelected ? [] : studentIds);
      return { ...prev, [classId]: next };
    });
  }, []);

  const handleEnrollInClass = useCallback(async (cls: Class) => {
    const selections = classStudentSelections[cls.id];
    if (!selections || selections.size === 0) return;

    const studentIds = Array.from(selections);
    setEnrollingClassIds((prev) => new Set(prev).add(cls.id));

    try {
      await Promise.all(
        studentIds.map((studentId) =>
          enrollInClassMutation.mutateAsync({ classId: cls.id, studentId })
        )
      );
      toast.success(`${studentIds.length} student(s) enrolled in ${cls.subjectName ?? "class"}.`);
      setClassStudentSelections((prev) => ({ ...prev, [cls.id]: new Set() }));
      setExpandedClassId(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Failed to enroll some students.");
    } finally {
      setEnrollingClassIds((prev) => {
        const next = new Set(prev);
        next.delete(cls.id);
        return next;
      });
    }
  }, [classStudentSelections, enrollInClassMutation]);

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

  const { data: schoolYears = [] } = useSchoolYears();
  const { data: programs = [], isLoading: progLoading } = usePrograms(schoolYearId || null);
  const { data: allLevels = [], isLoading: levelsLoading } = useLevelsByYear(schoolYearId);
  const { data: allStudents = [], isLoading: studentsLoading } = useStudents({});
  const { data: enrollmentsResponse = [], isLoading: enrollLoading } = useSchoolYearEnrollments(schoolYearId);
  const enrollments = Array.isArray(enrollmentsResponse)
    ? enrollmentsResponse
    : enrollmentsResponse?.data ?? [];
  const { data: sections = [], isLoading: sectionsLoading } = useSections(schoolYearId || null, levelId || undefined);

  const { data: classesRaw = [], isLoading: classesLoading } = useClasses({ schoolYearId: schoolYearId || undefined });
  const { data: subjectsRaw = [], isLoading: subjectsLoading } = useSubjects();
  const { data: educatorsRaw = [], isLoading: educatorsLoading } = useEducators();
  const { data: semestersRaw = [], isLoading: semestersLoading } = useSemesters();

  const schoolYear = schoolYears.find((sy) => sy.id === schoolYearId);
  const program = programs.find((p) => p.id === programId);
  const isCollege = program?.type === "college";
  const isSHS = program?.type === "shs";
  const course = program?.courses?.find((c) => c.id === courseId) ?? null;
  const strand = program?.strands?.find((s) => s.id === strandId) ?? null;
  const level = allLevels.find((l) => l.id === levelId) ?? null;

  const programLevels = useMemo(
    () => allLevels.filter((l) => l.program_id === programId),
    [allLevels, programId],
  );

  const handleProgramChange = useCallback((v: string) => {
    setProgramId(v);
    setCourseId("");
    setStrandId("");
    setLevelId("");
  }, []);

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

  const filteredClasses = useMemo(() => {
    if (!schoolYearId || !programId) return [];

    let classes = classesRaw.filter(cls => cls.programId === programId);

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
      subjectName: subjectMap.get(cls.subjectId)?.title ?? cls.subjectName ?? "Unnamed Subject",
      educatorName: educatorMap.get(cls.educatorId)?.fullName ?? cls.educatorName ?? "No educator",
      semesterName: semesterMap.get(cls.semesterId)?.name ?? cls.semesterName ?? "—",
    }));
  }, [classesRaw, schoolYearId, programId, courseId, strandId, levelId, subjectMap, educatorMap, semesterMap]);

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

  const studentsEligibleForClassEnrollment = useMemo(() => {
    if (!programId || !levelId) return [];

    const seen = new Set<string>();
    const result: { id: string; fullName: string; studentId: string | null }[] = [];

    for (const enr of allContextEnrollments) {
      const inContext = enr.programEnrollments.some(
        (pe) =>
          pe.program_id === programId &&
          pe.level?.id === levelId &&
          (!courseId || pe.course?.id === courseId) &&
          (!strandId || pe.strand?.id === strandId),
      );
      if (inContext && !seen.has(enr.student_id)) {
        seen.add(enr.student_id);
        const info = studentMap.get(enr.student_id);
        result.push({
          id: enr.student_id,
          fullName: info?.fullName ?? "Unknown Student",
          studentId: info?.studentId ?? null,
        });
      }
    }
    return result;
  }, [programId, levelId, courseId, strandId, allContextEnrollments, studentMap]);

  const pageLoading = progLoading || levelsLoading || studentsLoading || enrollLoading || classesLoading || subjectsLoading || educatorsLoading || semestersLoading;

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
                <SelectValue placeholder="Select section" />
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
  ], [sections, sectionAssignments, updateProgEnrollMutation, handleAssignSection]);

  async function handleEnroll() {
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
      setConfirmOpen(false);
      setSelected(new Set());
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Failed to enroll some students.");
    }
  }

  // ── Stepper state derivation ──
  const needsCourseOrStrand = isCollege || isSHS;
  const courseOrStrandDone = isCollege ? !!courseId : isSHS ? !!strandId : true;
  const courseOrStrandLabel = isCollege ? "Course" : "Strand";

  const steps: StepDef[] = useMemo(() => {
    const list: StepDef[] = [
      {
        key: "program",
        label: "Program",
        description: program?.name,
        status: (programId ? "done" : "active") as StepStatus,
        onClick: programId
          ? () => {
              setProgramId("");
              setCourseId("");
              setStrandId("");
              setLevelId("");
            }
          : undefined,
      },
    ];

    if (needsCourseOrStrand) {
      list.push({
        key: "courseStrand",
        label: courseOrStrandLabel,
        description: course?.code ?? course?.name ?? strand?.name,
        status: (courseOrStrandDone ? "done" : "active") as StepStatus,
        onClick: courseOrStrandDone
          ? () => {
              setCourseId("");
              setStrandId("");
              setLevelId("");
            }
          : undefined,
      });
    }

    list.push({
      key: "level",
      label: "Level / Grade",
      description: level?.name,
      status: (!programId || (needsCourseOrStrand && !courseOrStrandDone)
        ? "pending"
        : levelId
        ? "done"
        : "active") as StepStatus,
      onClick: levelId ? () => setLevelId("") : undefined,
    });

    list.push({
      key: "enroll",
      label: "Enroll Students",
      description: levelId ? `${selected.size} selected` : undefined,
      status: (levelId ? "active" : "pending") as StepStatus,
    });

    return list;
  }, [
    programId, program, courseId, course, strandId, strand, levelId, level,
    needsCourseOrStrand, courseOrStrandDone, courseOrStrandLabel, selected.size,
  ]);

  return (
    <div className="space-y-6 pb-10">
      <button
        onClick={() => router.push("/admin/enrollment")}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Enrollment
      </button>

      <PageHeader
        title="Enroll Students"
      />

      <EnrollmentStepper steps={steps} />

      {!programId && (
        <ProgramSelector
          programs={programs}
          isLoading={progLoading}
          onSelect={handleProgramChange}
        />
      )}

      {programId && !courseId && !strandId && (isCollege || isSHS) && (
        <CourseStrandSelector
          items={(isCollege ? program?.courses : program?.strands)?.map((item) => ({
            id: item.id,
            name: item.name,
            code: "code" in item ? (item as { code?: string | null }).code : null,
          })) ?? []}
          isCollege={isCollege}
          onSelect={(id) => {
            if (isCollege) setCourseId(id);
            else setStrandId(id);
            setLevelId("");
          }}
        />
      )}

      {!!programId && !levelId && (isCollege ? !!courseId : isSHS ? !!strandId : true) && (
        <LevelSelector
          levels={programLevels}
          isLoading={levelsLoading}
          onSelect={setLevelId}
        />
      )}

      {levelId && (
        <>
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
            {filtered.length > 0 && leftTab === "enroll" && (
              <p className="text-xs text-muted-foreground">
                {selected.size} of {filtered.length} selected
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <EnrollStudentPanel
              leftTab={leftTab}
              onTabChange={setLeftTab}
              contextColumns={contextColumns}
              allContextEnrollments={allContextEnrollments}
              pendingSectionEnrollments={pendingSectionEnrollments}
              programId={programId}
              courseId={courseId}
              strandId={strandId}
              levelId={levelId}
              studentMap={studentMap}
              pageLoading={pageLoading}
              sections={sections}
              sectionAssignments={sectionAssignments}
              onSectionAssign={handleAssignSection}
              updateProgEnrollPending={updateProgEnrollMutation.isPending}
              search={search}
              filtered={filtered}
              selected={selected}
              onToggleAll={toggleAll}
              onToggle={toggle}
              onConfirmEnroll={() => setConfirmOpen(true)}
              bulkEnrollPending={bulkEnrollMutation.isPending}
            />

            <ClassEnrollmentPanel
              classes={filteredClasses}
              isLoading={classesLoading}
              expandedClassId={expandedClassId}
              onToggleExpand={(id) => setExpandedClassId(expandedClassId === id ? null : id)}
              eligibleStudents={studentsEligibleForClassEnrollment}
              classStudentSelections={classStudentSelections}
              onToggleStudent={toggleClassStudent}
              onToggleAllStudents={toggleAllClassStudents}
              onEnrollInClass={handleEnrollInClass}
              enrollingClassIds={enrollingClassIds}
            />
          </div>
        </>
      )}

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