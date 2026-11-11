"use client";

import {
  BookOpen,
  CalendarDays,
  Clock,
  DoorOpen,
  GraduationCap,
  Layers,
  Mail,
  Users,
  UserSquare2,
} from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useClass } from "@/hooks/admin/useClasses";
import { WEEKDAY_LABELS } from "@/utils/classes.utils";
import { formatHhmmForDisplay } from "@/utils/scheduleTime.utils";

interface Props {
  open: boolean;
  classId: string;
  enrollmentStatus?: string;
  onClose: () => void;
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function DetailRow({ icon, label, children }: DetailRowProps): React.JSX.Element {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs text-muted-foreground not-interactive">
          {label}
        </p>
        <div className="break-words text-sm font-medium not-interactive">
          {children}
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const MUTED = "font-normal text-muted-foreground";

export function EnrollmentClassDialog({
  open,
  classId,
  enrollmentStatus,
  onClose,
}: Props): React.JSX.Element {
  const { data: cls, isLoading, isError } = useClass(classId);

  const capacity = cls?.capacity ?? 0;
  const enrolled = cls?.enrolledCount ?? 0;
  const fillPercent =
    capacity > 0 ? Math.min((enrolled / capacity) * 100, 100) : 0;
  const isFull = capacity > 0 && enrolled >= capacity;

  const sortedSlots = [...(cls?.schedules ?? [])].sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.weekday) - DAY_ORDER.indexOf(b.weekday);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  const semesterFrom = formatDate(cls?.semesterStartDate);
  const semesterTo = formatDate(cls?.semesterEndDate);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={cls?.subjectName ?? "Class details"}
      description="Details of the class this student is enrolled in."
    >
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : isError || !cls ? (
        <p className="py-8 text-center text-sm text-muted-foreground not-interactive">
          Could not load this class.
        </p>
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          <DetailRow icon={<BookOpen className="h-4 w-4" />} label="Subject">
            <div className="flex flex-wrap items-center gap-2">
              <span>{cls.subjectName ?? "—"}</span>
              {enrollmentStatus && <StatusBadge status={enrollmentStatus} />}
            </div>
          </DetailRow>

          <DetailRow
            icon={<CalendarDays className="h-4 w-4" />}
            label="School Year"
          >
            {cls.schoolYearTitle ?? "—"}
          </DetailRow>

          <DetailRow icon={<Clock className="h-4 w-4" />} label="Semester">
            <div className="flex flex-col">
              <span>{cls.semesterName ?? "—"}</span>
              {semesterFrom && semesterTo && (
                <span className={MUTED}>
                  {semesterFrom} – {semesterTo}
                </span>
              )}
            </div>
          </DetailRow>

          <DetailRow
            icon={<GraduationCap className="h-4 w-4" />}
            label="Department"
          >
            {cls.programName ?? "—"}
          </DetailRow>

          <DetailRow icon={<Layers className="h-4 w-4" />} label="Year Level">
            {cls.levelName ?? "—"}
          </DetailRow>

          {cls.courseName && (
            <DetailRow icon={<BookOpen className="h-4 w-4" />} label="Course">
              {cls.courseName}
            </DetailRow>
          )}

          {cls.strandName && (
            <DetailRow icon={<BookOpen className="h-4 w-4" />} label="Strand">
              {cls.strandName}
            </DetailRow>
          )}

          <DetailRow icon={<Users className="h-4 w-4" />} label="Section">
            {cls.sectionName ?? "—"}
          </DetailRow>

          <DetailRow
            icon={<UserSquare2 className="h-4 w-4" />}
            label="Educator"
          >
            <div className="flex flex-col">
              <span>{cls.educatorName ?? "—"}</span>
              {cls.educatorEmail && (
                <span className={`${MUTED} flex items-center gap-1 break-all`}>
                  <Mail className="h-3 w-3 shrink-0" />
                  {cls.educatorEmail}
                </span>
              )}
            </div>
          </DetailRow>

          <DetailRow icon={<Users className="h-4 w-4" />} label="Capacity">
            <div className="flex flex-wrap items-center gap-3">
              <span className="tabular-nums">
                {capacity > 0
                  ? `${enrolled} / ${capacity} enrolled`
                  : `${enrolled} enrolled (no limit)`}
              </span>
              {capacity > 0 && (
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isFull ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              )}
              {isFull && (
                <span className="text-xs font-medium text-destructive">
                  Full
                </span>
              )}
            </div>
          </DetailRow>

          <DetailRow
            icon={<DoorOpen className="h-4 w-4" />}
            label={`Schedule (${sortedSlots.length} ${
              sortedSlots.length === 1 ? "slot" : "slots"
            })`}
          >
            {sortedSlots.length === 0 ? (
              <span className={MUTED}>No schedule assigned yet.</span>
            ) : (
              <ul className="space-y-1.5">
                {sortedSlots.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-normal"
                  >
                    <span className="w-10 font-medium">
                      {WEEKDAY_LABELS[s.weekday]}
                    </span>
                    <span className="tabular-nums">
                      {formatHhmmForDisplay(s.startTime)} –{" "}
                      {formatHhmmForDisplay(s.endTime)}
                    </span>
                    <span className="text-muted-foreground">
                      {s.roomName ? `Room ${s.roomName}` : "No room"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DetailRow>
        </div>
      )}
    </Modal>
  );
}