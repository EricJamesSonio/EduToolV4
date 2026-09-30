"use client";

import { useMemo, useState } from "react";

import { PageHeader } from "@/components/shared/PageHeader";
import { SchedulePanel } from "@/components/shared/SchedulePanel";
import { Button } from "@/components/ui/button";
import { useStudentClasses } from "@/hooks/student/useStudentClasses";
import { useStudentSemesters } from "@/hooks/student/useStudentSemesters";
import { studentClassesToScheduleClasses } from "@/utils/studentSchedule.utils";
import { getDefaultSemesterId } from "@/utils/semester.utils";

/**
 * Weekly schedule derived from the classes the student is enrolled in.
 * Mirrors the educator schedule page and reuses the same WeeklyScheduleGrid.
 */
export default function StudentSchedulePage(): React.JSX.Element {
  const { data: classes = [], isLoading } = useStudentClasses();
  const { data: semesters = [] } = useStudentSemesters();

  // Default to the currently active semester so the grid answers "what do I
  // have now" rather than mixing terms. An irregular student can still have
  // active enrollments left over from earlier semesters, which would otherwise
  // produce a timetable that is not real — hence the explicit "all semesters"
  // escape hatch.
  const [showAll, setShowAll] = useState(false);
  const defaultSemesterId = useMemo(
    () => getDefaultSemesterId(semesters),
    [semesters],
  );

  const allScheduleClasses = useMemo(
    () => studentClassesToScheduleClasses(classes),
    [classes],
  );

  const visibleClasses = useMemo(() => {
    if (showAll || !defaultSemesterId) return allScheduleClasses;
    return allScheduleClasses.filter((c) => c.semesterId === defaultSemesterId);
  }, [allScheduleClasses, defaultSemesterId, showAll]);

  const activeSemester = semesters.find((s) => s.id === defaultSemesterId);

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {showAll
            ? "Showing every enrolled class, across all semesters."
            : activeSemester
              ? `Showing ${activeSemester.name}.`
              : "Showing current semester classes."}
        </p>
        <Button size="sm" variant="outline" onClick={() => setShowAll((s) => !s)}>
          {showAll ? "Show current semester" : "Show all semesters"}
        </Button>
      </div>

      <SchedulePanel
        classes={visibleClasses}
        isLoading={isLoading}
        emptyTitle="No classes yet"
        emptyDescription="You are not enrolled in any classes yet."
        noScheduleTitle="No schedule yet"
        noScheduleDescription="Your classes don't have schedule times assigned yet."
      />
    </div>
  );
}