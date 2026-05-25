"use client";

// frontend/src/components/admin/school-years/SectionDetailPanel.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, BookOpen, CalendarDays,
  Clock, GraduationCap, ChevronRight,
} from "lucide-react";
import { classApi }   from "@/api/admin/class.api";
import { studentApi } from "@/api/admin/student.api";
import type { Section } from "@/types/admin/section.types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge }    from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type PanelTab = "students" | "classes" | "schedule";

const WEEKDAY_LABELS: Record<number, string> = {
  0: "Sunday",   1: "Monday", 2: "Tuesday", 3: "Wednesday",
  4: "Thursday", 5: "Friday", 6: "Saturday",
};
const WEEKDAY_SHORT: Record<number, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// ─── Students Tab ─────────────────────────────────────────────────────────────

function StudentsTab({
  section,
  schoolYearId,
}: {
  section: Section;
  schoolYearId: string;
}) {
  // Use studentApi.getAll with sectionId — returns full Student objects with fullName, studentId, status
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["admin", "section-students", section.id, schoolYearId],
    queryFn:  () => studentApi.getAll({ sectionId: section.id, schoolYearId }),
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-5">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-11 w-full rounded" />)}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No students enrolled</p>
        <p className="text-xs text-muted-foreground mt-1">
          Students assigned to this section will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {students.map((student) => (
        <div
          key={student.id}
          className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <span className="text-xs font-semibold text-primary">
              {student.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{student.fullName}</p>
            <p className="text-xs text-muted-foreground">{student.studentId}</p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs shrink-0 capitalize",
              student.status === "active"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                : student.status === "suspended"
                ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                : "",
            )}
          >
            {student.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}

// ─── Classes Tab ──────────────────────────────────────────────────────────────

function ClassesTab({
  section,
  schoolYearId,
}: {
  section: Section;
  schoolYearId: string;
}) {
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["admin", "section-classes", section.id, schoolYearId],
    queryFn:  () => classApi.getAll({ sectionId: section.id, schoolYearId }),
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-5">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded" />)}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No classes assigned</p>
        <p className="text-xs text-muted-foreground mt-1">
          Classes assigned to this section will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {classes.map((cls) => (
        <div
          key={cls.id}
          className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{cls.subjectName ?? cls.title}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {cls.educatorName && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {cls.educatorName}
                </span>
              )}
              {cls.schedules.length > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {cls.schedules.map((s) => WEEKDAY_SHORT[s.weekday]).join(", ")}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {cls.enrolledCount}/{cls.capacity}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Weekly Schedule Tab ──────────────────────────────────────────────────────

function WeeklyScheduleTab({
  section,
  schoolYearId,
}: {
  section: Section;
  schoolYearId: string;
}) {
  // Reuses cached result from ClassesTab — same query key
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["admin", "section-classes", section.id, schoolYearId],
    queryFn:  () => classApi.getAll({ sectionId: section.id, schoolYearId }),
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-5">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded" />)}
      </div>
    );
  }

  type ScheduleEntry = {
    subjectName:  string;
    educatorName?: string;
    startTime:    string;
    endTime:      string;
    classId:      string;
  };

  const byWeekday: Record<number, ScheduleEntry[]> = {};
  for (const cls of classes) {
    for (const sched of cls.schedules) {
      if (!byWeekday[sched.weekday]) byWeekday[sched.weekday] = [];
      byWeekday[sched.weekday].push({
        subjectName:  cls.subjectName ?? cls.title,
        educatorName: cls.educatorName,
        startTime:    sched.startTime,
        endTime:      sched.endTime,
        classId:      cls.id,
      });
    }
  }
  for (const day of Object.keys(byWeekday)) {
    byWeekday[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const activeDays = Object.keys(byWeekday).map(Number).sort((a, b) => a - b);

  if (activeDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No schedule yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Schedules are set when classes are created for this section.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      {activeDays.map((day) => (
        <div key={day}>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {WEEKDAY_LABELS[day]}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-2">
            {byWeekday[day].map((entry, i) => (
              <div
                key={`${entry.classId}-${i}`}
                className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-2.5"
              >
                <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium tabular-nums">{formatTime(entry.startTime)}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-medium tabular-nums">{formatTime(entry.endTime)}</span>
                </div>
                <div className="w-px h-4 bg-border shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{entry.subjectName}</p>
                  {entry.educatorName && (
                    <p className="text-xs text-muted-foreground truncate">{entry.educatorName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export interface SectionDetailPanelProps {
  section:         Section | null;
  schoolYearId:    string;
  levelName?:      string;
  /** When provided, shows a "View Subjects" button that navigates to the subjects tab */
  onViewSubjects?: () => void;
  open:            boolean;
  onClose:         () => void;
}

export function SectionDetailPanel({
  section,
  schoolYearId,
  levelName,
  onViewSubjects,
  open,
  onClose,
}: SectionDetailPanelProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<PanelTab>("students");

  // Fetch students for live count in the header badge
  const { data: students = [] } = useQuery({
    queryKey: ["admin", "section-students", section?.id, schoolYearId],
    queryFn:  () => studentApi.getAll({ sectionId: section!.id, schoolYearId }),
    enabled:  !!section,
  });

  const tabs: { key: PanelTab; label: string; icon: React.ReactNode }[] = [
    { key: "students", label: "Students",        icon: <Users        className="h-3.5 w-3.5" /> },
    { key: "classes",  label: "Classes",         icon: <BookOpen     className="h-3.5 w-3.5" /> },
    { key: "schedule", label: "Weekly Schedule", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  ];

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0 gap-0 overflow-hidden">

        {/* ── Fixed header + tabs ── */}
        <SheetHeader className="px-5 pt-5 pb-0 border-b shrink-0">

          {/* Title + badges + View Subjects */}
          <div className="flex items-start justify-between gap-3 pb-4">
            <div>
              <SheetTitle className="text-base font-semibold leading-tight">
                {section?.name ?? "Section"}
              </SheetTitle>
              {levelName && (
                <p className="text-xs text-muted-foreground mt-0.5">{levelName}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {section && (
                <Badge variant="secondary" className="text-xs">
                  Cap. {section.capacity}
                </Badge>
              )}
              {/* Live student count — no longer stale from section.studentCount */}
              <Badge variant="outline" className="text-xs">
                {students.length} {students.length === 1 ? "student" : "students"}
              </Badge>
              {onViewSubjects && (
                <button
                  onClick={() => { onClose(); onViewSubjects(); }}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <BookOpen className="h-3 w-3" />
                  View Subjects
                </button>
              )}
            </div>
          </div>

          {/* ── Tab bar — sits on the border-b line so it looks "floating" ── */}
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium",
                  "border-b-2 transition-colors -mb-px",
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
        </SheetHeader>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          {section && activeTab === "students" && (
            <StudentsTab section={section} schoolYearId={schoolYearId} />
          )}
          {section && activeTab === "classes" && (
            <ClassesTab section={section} schoolYearId={schoolYearId} />
          )}
          {section && activeTab === "schedule" && (
            <WeeklyScheduleTab section={section} schoolYearId={schoolYearId} />
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}