"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertCircle, Trash2 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { schoolYearApi } from "@/api/admin/school-year.api";
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
  useUnenrollStudent,
} from "@/hooks/admin/useStudentEnrollment";
import { useSections } from "@/hooks/admin/useSchoolYears";
import { useClasses, useEnrollStudent, useClassEnrollments } from "@/hooks/admin/useClasses";
import { useSubjects } from "@/hooks/admin/useSubject";
import { useEducators } from "@/hooks/admin/useEducators";
import { useSemesters } from "@/hooks/admin/useSemester";
import { useSubjectsPrerequisiteCheck } from "@/hooks/admin/useSubjectPrerequisites";
import {
  getMissingPrerequisites,
  hasUnmetPrerequisites,
  type PrerequisiteMiss,
} from "@/utils/prerequisites";

import type { Subject } from "@/types/admin/subject.types";
import type { Educator } from "@/types/admin/educator.types";
import type { Semester } from "@/types/admin/semester.types";
import type {
  EnrollStudentProgramRequest,
} from "@/types/admin/student-enrollment.types";
import type { Class } from "@/types/admin/class.types";
import type { SchoolYearReadiness } from "@/types/admin/school-year.types";

type EligibleStudentEntry = {
  id: string;
  fullName: string;
  studentId: string | null;
  missingPrerequisites?: PrerequisiteMiss[];
};

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
  const [readyBlockOpen, setReadyBlockOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<"all" | "pending" | "enroll">("all");

  const [sectionAssignments, setSectionAssignments] = useState<Record<string, string>>({});
  const [unenrollTarget, setUnenrollTarget] = useState<ContextTableRow | null>(null);

  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [classStudentSelections, setClassStudentSelections] = useState<Record<string, Set<string>>>({});
  const [enrollingClassIds, setEnrollingClassIds] = useState<Set<string>>(new Set());

  const bulkEnrollMutation = useBulkEnrollStudents(schoolYearId);
  const enrollInProgramMutation = useEnrollInProgram(schoolYearId);
  const updateProgEnrollMutation = useUpdateProgramEnrollment(schoolYearId);
  const unenrollMutation = useUnenrollStudent(schoolYearId);
  const enrollInClassMutation = useEnrollStudent();
  const classEnrollmentsQuery = useClassEnrollments(expandedClassId ?? "");
  const { data: schoolYears = [] } = useSchoolYears();

  const { data: readiness } = useAsyncQuery<SchoolYearReadiness>(
    queryKeys.admin.schoolYears.readinessDetail(schoolYearId),
    () => schoolYearApi.getReadiness(schoolYearId),
    { enabled: !!schoolYearId },
  );
  const isSchoolYearReady = readiness ? readiness.ready : false;

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

  const handleAssignSection = useCallback(
    (programEnrollmentId: string, sectionId: string) => {
      if (!programEnrollmentId || !sectionId || updateProgEnrollMutation.isPending) return;

      updateProgEnrollMutation.mutate(
        { programEnrollmentId, data: { section_id: sectionId } },
        {
          onSuccess: () => {
            setSectionAssignments((prev) => {
              const next = { ...prev };
              delete next[programEnrollmentId];
              return next;
            });
            toast.success("Section updated.");
          },
          onError: (err: unknown) => {
            const e = err as { response?: { data?: { message?: string | string[] } } };
            const message = e?.response?.data?.message;
            toast.error(
              Array.isArray(message)
                ? message.join(", ")
                : message ?? "Failed to update section.",
            );
          },
        },
      );
    },
    [updateProgEnrollMutation],
  );

  const handleUnenroll = useCallback(async () => {
    if (!unenrollTarget || unenrollMutation.isPending) return;

    try {
      await unenrollMutation.mutateAsync(unenrollTarget.id);
      toast.success(`${unenrollTarget.studentName} unenrolled from the school year.`);
      setUnenrollTarget(null);
      setExpandedClassId(null);
      setClassStudentSelections({});
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const message = e?.response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(", ")
          : message ?? "Failed to unenroll student.",
      );
    }
  }, [unenrollTarget, unenrollMutation]);

  const { data: programs = [], isLoading: progLoading } = usePrograms(schoolYearId || null);
  const { data: allLevels = [], isLoading: levelsLoading } = useLevelsByYear(schoolYearId);
  const { data: allStudents = [], isLoading: studentsLoading } = useStudents({});
  const { data: enrollmentsResponse = [], isLoading: enrollLoading } = useSchoolYearEnrollments(schoolYearId);
  const enrollments = Array.isArray(enrollmentsResponse)
    ? enrollmentsResponse
    : enrollmentsResponse?.data ?? [];
  const { data: sections = [], isLoading: sectionsLoading } = useSections(
    schoolYearId || null,
    levelId || undefined,
    courseId || undefined,
    strandId || undefined,
  );

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

  const programLevels = useMemo(() => {
    if (courseId) {
      const courseLevels = allLevels.filter((l) => l.course_id === courseId);
      if (courseLevels.length > 0) return courseLevels;
    }
    if (strandId) {
      const strandLevels = allLevels.filter((l) => l.strand_id === strandId);
      if (strandLevels.length > 0) return strandLevels;
    }
    return allLevels.filter(
      (l) => l.program_id === programId && !l.course_id && !l.strand_id,
    );
  }, [allLevels, programId, courseId, strandId]);

  const handleProgramChange = useCallback((v: string) => {
    setProgramId(v);
    setCourseId("");
    setStrandId("");
    setLevelId("");
    setSectionAssignments({});
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

  const sectionMap = useMemo(() => {
    const map = new Map<string, string>();
    sections.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sections]);

  const studentMap = useMemo(() => {
    const map = new Map<string, { fullName: string; studentId: string | null }>();
    for (const s of allStudents) map.set(s.id, { fullName: s.fullName, studentId: s.studentId });
    return map;
  }, [allStudents]);

  const filteredClasses = useMemo(() => {
    if (!schoolYearId || !programId) return [];

    let classes = classesRaw.filter((cls) => cls.programId === programId);

    classes = classes.filter((cls) => {
      const subject = subjectMap.get(cls.subjectId);
      if (!subject) return false;

      let match = true;
      if (courseId && subject.courseId !== courseId) match = false;
      if (strandId && subject.strandId !== strandId) match = false;
      if (levelId && subject.levelId !== levelId) match = false;
      return match;
    });

    return classes.map((cls) => ({
      ...cls,
      subjectName: subjectMap.get(cls.subjectId)?.title ?? cls.subjectName ?? "Unnamed Subject",
      educatorName: educatorMap.get(cls.educatorId)?.fullName ?? cls.educatorName ?? "No educator",
      semesterName: semesterMap.get(cls.semesterId)?.name ?? cls.semesterName ?? "—",
      sectionName: cls.sectionId ? sectionMap.get(cls.sectionId) : cls.sectionName,
    }));
  }, [
    classesRaw, schoolYearId, programId, courseId, strandId, levelId,
    subjectMap, educatorMap, semesterMap, sectionMap,
  ]);

  const activeEnrollments = useMemo(
    () => enrollments.filter((e) => e.status === "active"),
    [enrollments],
  );

  const enrolledIds = useMemo(
    () => new Set(activeEnrollments.map((e) => e.student_id)),
    [activeEnrollments],
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

  const matchesContext = useCallback(
    (pe: (typeof enrollments)[number]["programEnrollments"][number]) =>
      pe.status === "active" &&
      pe.program_id === programId &&
      (!courseId || pe.course?.id === courseId) &&
      (!strandId || pe.strand?.id === strandId) &&
      (!levelId || pe.level?.id === levelId),
    [programId, courseId, strandId, levelId],
  );

  const allContextEnrollments = useMemo(() => {
    if (!programId) return [];
    return activeEnrollments.filter((e) =>
      e.programEnrollments.some(matchesContext),
    );
  }, [activeEnrollments, programId, matchesContext]);

  const pendingSectionEnrollments = useMemo(() => {
    if (!programId) return [];
    return activeEnrollments.filter((e) =>
      e.programEnrollments.some((pe) => matchesContext(pe) && pe.section === null),
    );
  }, [activeEnrollments, programId, matchesContext]);

  const eligibleStudentsByClassRaw: Record<string, EligibleStudentEntry[]> = useMemo(() => {
    if (!programId || !levelId) return {};

    const bySection = new Map<string, EligibleStudentEntry[]>();

    for (const enr of allContextEnrollments) {
      const info = studentMap.get(enr.student_id);
      if (!info) continue;
      const entry = {
        id: enr.student_id,
        fullName: info.fullName,
        studentId: info.studentId,
      };

      for (const pe of enr.programEnrollments) {
        if (!matchesContext(pe)) continue;
        if (!pe.section?.id) continue;
        const list = bySection.get(pe.section.id) ?? [];
        if (!list.some((s) => s.id === entry.id)) list.push(entry);
        bySection.set(pe.section.id, list);
      }
    }

    const map: Record<string, EligibleStudentEntry[]> = {};
    for (const cls of filteredClasses) {
      map[cls.id] = cls.sectionId ? bySection.get(cls.sectionId) ?? [] : [];
    }
    return map;
  }, [
    programId, levelId, allContextEnrollments, studentMap,
    filteredClasses, matchesContext,
  ]);

  const expandedClass = useMemo(
    () => filteredClasses.find((cls) => cls.id === expandedClassId) ?? null,
    [filteredClasses, expandedClassId],
  );

  const enrolledIdsForExpanded = useMemo(
    () => new Set((classEnrollmentsQuery.data ?? []).map((e) => e.student_id)),
    [classEnrollmentsQuery.data],
  );

  const expandedClassStudentIds = useMemo(() => {
    if (!expandedClass) return [];
    return (eligibleStudentsByClassRaw[expandedClass.id] ?? [])
      .filter((s) => !enrolledIdsForExpanded.has(s.id))
      .map((s) => s.id);
  }, [expandedClass, eligibleStudentsByClassRaw, enrolledIdsForExpanded]);

  const prereqCheckQuery = useSubjectsPrerequisiteCheck(
    expandedClass?.subjectId ?? null,
    expandedClassStudentIds,
  );

  const prereqCheckErrorReported = useRef(false);
  useEffect(() => {
    if (!prereqCheckQuery.isError) {
      prereqCheckErrorReported.current = false;
      return;
    }
    if (prereqCheckErrorReported.current) return;
    prereqCheckErrorReported.current = true;
    toast.error(
      "Could not check subject prerequisites. Students are shown as unblocked, so an enroll may still fail.",
    );
  }, [prereqCheckQuery.isError]);

  const eligibleStudentsByClass: Record<string, EligibleStudentEntry[]> = useMemo(() => {
    const data = prereqCheckQuery.data;
    if (!expandedClass || !data) return eligibleStudentsByClassRaw;

    const list = eligibleStudentsByClassRaw[expandedClass.id] ?? [];
    const annotated = list.map((s) => {
      const missing = getMissingPrerequisites(
        data,
        s.id,
        expandedClass.subjectId,
      );
      return missing.length > 0
        ? { ...s, missingPrerequisites: missing }
        : s;
    });

    return { ...eligibleStudentsByClassRaw, [expandedClass.id]: annotated };
  }, [eligibleStudentsByClassRaw, prereqCheckQuery.data, expandedClass]);

  const prerequisiteCheckPending =
    !!expandedClass && prereqCheckQuery.isPending;

  const handleEnrollInClass = useCallback(async (cls: Class) => {
    if (!isSchoolYearReady) {
      setReadyBlockOpen(true);
      return;
    }
    const selections = classStudentSelections[cls.id];
    if (!selections || selections.size === 0) return;

    if (prerequisiteCheckPending && cls.id === expandedClassId) {
      toast.warning(
        "Still checking prerequisites for this class — please wait a moment.",
      );
      return;
    }

    const blocked = eligibleStudentsByClass[cls.id] ?? [];
    const blockedIds = new Set(
      blocked.filter((s) => hasUnmetPrerequisites(s.missingPrerequisites)).map((s) => s.id),
    );
    const studentIds = Array.from(selections).filter((id) => !blockedIds.has(id));
    if (studentIds.length === 0) {
      toast.warning("No eligible students selected — all have unmet prerequisites.");
      return;
    }

    setEnrollingClassIds((prev) => new Set(prev).add(cls.id));

    try {
      await Promise.all(
        studentIds.map((studentId) =>
          enrollInClassMutation.mutateAsync({ classId: cls.id, studentId }),
        ),
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
  }, [
    classStudentSelections, enrollInClassMutation, isSchoolYearReady,
    eligibleStudentsByClass, prerequisiteCheckPending, expandedClassId,
  ]);

  const enrolledStudentsByClass = useMemo(() => {
    const map: Record<
      string,
      { id: string; studentId: string | null; fullName: string; status: "active" | "pending" | "removed" }[]
    > = {};
    if (expandedClassId) {
      map[expandedClassId] = (classEnrollmentsQuery.data ?? []).map((enr) => {
        const info = studentMap.get(enr.student_id);
        return {
          id: enr.student_id,
          studentId: info?.studentId ?? null,
          fullName: enr.student_name ?? info?.fullName ?? "Unknown Student",
          status: enr.status,
        };
      });
    }
    return map;
  }, [expandedClassId, classEnrollmentsQuery.data, studentMap]);

  const pageLoading =
    progLoading || levelsLoading || studentsLoading || enrollLoading ||
    classesLoading || subjectsLoading || educatorsLoading || semestersLoading;

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
      header: "Department",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.programName}</span>
      ),
    },
    {
      id: "section",
      header: "Section",
      cell: ({ row }) => {
        const r = row.original;
        const selectedSectionId = sectionAssignments[r.peId] ?? r.sectionId ?? "";
        const sectionChanged = selectedSectionId !== (r.sectionId ?? "");
        const selectedSectionLabel = sections.find(
          (sec) => sec.id === selectedSectionId,
        )?.name ?? (selectedSectionId === r.sectionId ? r.sectionName : null);

        return (
          <div className="flex min-w-44 items-center gap-2">
            <Select
              value={selectedSectionId}
              disabled={!r.peId || updateProgEnrollMutation.isPending || sectionsLoading}
              onValueChange={(value) =>
                setSectionAssignments((prev) => ({ ...prev, [r.peId]: value }))
              }
            >
              <SelectTrigger
                aria-label={`Section for ${r.studentName}`}
                className="h-8 min-w-0 flex-1 text-xs"
              >
                {selectedSectionLabel ? (
                  <span className="flex flex-1 truncate text-left">
                    {selectedSectionLabel}
                  </span>
                ) : (
                  <SelectValue placeholder="Select section" />
                )}
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
              className="h-8 shrink-0 text-xs"
              disabled={
                !r.peId ||
                !selectedSectionId ||
                !sectionChanged ||
                updateProgEnrollMutation.isPending
              }
              onClick={() => handleAssignSection(r.peId, selectedSectionId)}
            >
              {r.sectionId ? "Save" : "Assign"}
            </Button>
          </div>
        );
      },
    },
    ...(leftTab === "all" ? [{
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: ContextTableRow } }) => (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 gap-1 text-destructive hover:text-destructive"
          disabled={unenrollMutation.isPending}
          onClick={() => setUnenrollTarget(row.original)}
          aria-label={`Unenroll ${row.original.studentName}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Unenroll
        </Button>
      ),
    } satisfies ColumnDef<ContextTableRow>] : []),
  ], [
    sections, sectionsLoading, sectionAssignments, updateProgEnrollMutation.isPending,
    handleAssignSection, leftTab, unenrollMutation.isPending,
  ]);

  function handleConfirmEnrollClick() {
    if (!isSchoolYearReady) {
      setReadyBlockOpen(true);
      return;
    }
    setConfirmOpen(true);
  }

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

  const needsCourseOrStrand = isCollege || isSHS;
  const courseOrStrandDone = isCollege ? !!courseId : isSHS ? !!strandId : true;
  const courseOrStrandLabel = isCollege ? "Course" : "Strand";

  const steps: StepDef[] = useMemo(() => {
    const list: StepDef[] = [
      {
        key: "program",
        label: "Department",
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

      <PageHeader title="Enroll Students" />

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
            setSectionAssignments({});
          }}
        />
      )}

      {!!programId && !levelId && (isCollege ? !!courseId : isSHS ? !!strandId : true) && (
        <LevelSelector
          levels={programLevels}
          isLoading={levelsLoading}
          onSelect={(id) => {
            setLevelId(id);
            setSectionAssignments({});
          }}
        />
      )}

      {levelId && (
        <>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by name, student ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 max-w-sm flex-1"
            />
            {filtered.length > 0 && leftTab === "enroll" && (
              <p className="text-xs text-muted-foreground">
                {selected.size} of {filtered.length} selected
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
              onSearchChange={setSearch}
              filtered={filtered}
              selected={selected}
              onToggleAll={toggleAll}
              onToggle={toggle}
              onConfirmEnroll={handleConfirmEnrollClick}
              enrollBlocked={!isSchoolYearReady}
              bulkEnrollPending={bulkEnrollMutation.isPending}
            />

            <ClassEnrollmentPanel
              classes={filteredClasses}
              isLoading={classesLoading}
              expandedClassId={expandedClassId}
              onToggleExpand={(id) => setExpandedClassId(expandedClassId === id ? null : id)}
              eligibleStudentsByClass={eligibleStudentsByClass}
              enrolledStudentsByClass={enrolledStudentsByClass}
              classEnrollmentsLoading={classEnrollmentsQuery.isLoading}
              classStudentSelections={classStudentSelections}
              onToggleStudent={toggleClassStudent}
              onToggleAllStudents={toggleAllClassStudents}
              onEnrollInClass={handleEnrollInClass}
              enrollBlocked={!isSchoolYearReady}
              enrollingClassIds={enrollingClassIds}
              prerequisiteCheckPending={
                prerequisiteCheckPending && expandedClassId !== null
              }
            />
          </div>
        </>
      )}

      {readyBlockOpen && (
        <ConfirmDialog
          open
          title="School year not ready"
          destructive
          confirmLabel="Go to School Years"
          message="The selected school year is not ready for enrollment yet. Please resolve the following before enrolling students:"
          description={
            <ul className="mt-2 space-y-1">
              {(readiness?.issues.filter((i) => i.severity === "blocking") ?? []).map((issue, i) => (
                <li key={issue.ref?.id ?? `${issue.code}-${i}`} className="flex items-start gap-2 text-xs">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          }
          onOpenChange={(open) => { if (!open) setReadyBlockOpen(false); }}
          onConfirm={() => {
            setReadyBlockOpen(false);
            router.push("/admin/school-years");
          }}
        />
      )}

      {confirmOpen && (
        <ConfirmDialog
          open
          title="Enroll students?"
          message={`Are you sure you want to enroll ${selected.size} student${selected.size > 1 ? "s" : ""} into ${program?.name ?? "this school year"}?`}
          confirmLabel="Enroll"
          isLoading={bulkEnrollMutation.isPending}
          onConfirm={handleEnroll}
          onOpenChange={(open) => { if (!open) setConfirmOpen(false); }}
        />
      )}

      {unenrollTarget && (
        <ConfirmDialog
          open
          destructive
          title="Unenroll student?"
          message={`Unenroll ${unenrollTarget.studentName} from ${schoolYear?.name ?? "this school year"}?`}
          description="This changes the student's school-year enrollment status. It does not delete the student account or historical records."
          confirmLabel="Unenroll"
          isLoading={unenrollMutation.isPending}
          onConfirm={handleUnenroll}
          onOpenChange={(open) => {
            if (!open && !unenrollMutation.isPending) setUnenrollTarget(null);
          }}
        />
      )}
    </div>
  );
}