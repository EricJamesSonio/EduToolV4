"use client";

import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Send,
  CalendarClock,
  CalendarCheck,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { formatDate } from "@/utils/date.util";
import type { Assessment } from "@/types/educator/assessment.types";
import type { AttendanceGridData } from "@/api/educator/attendance.api";

interface EducatorAttentionSectionProps {
  classId: string;
  assessments: Assessment[];
  assessmentsLoading: boolean;
  attendanceGrid: AttendanceGridData | undefined;
  attendanceLoading: boolean;
}

const MAX_ROWS = 4;

function timeValue(value: string | null | undefined): number {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

interface CardShellProps {
  icon: React.ElementType;
  colorIndex: number;
  title: string;
  count: number;
  actionLabel: string;
  onAction: () => void;
  isLoading: boolean;
  emptyText: string;
  children: React.ReactNode;
}

function CardShell({
  icon: Icon,
  colorIndex,
  title,
  count,
  actionLabel,
  onAction,
  isLoading,
  emptyText,
  children,
}: CardShellProps): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "rounded-md p-2.5 shrink-0",
              WEEK_COLORS[colorIndex % WEEK_COLORS.length],
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-semibold truncate">{title}</h3>
          {!isLoading && count > 0 && (
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {count}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 text-xs text-muted-foreground hover:text-foreground"
          onClick={onAction}
        >
          {actionLabel}
          <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading && (
          <>
            <RowSkeleton />
            <RowSkeleton />
          </>
        )}

        {!isLoading && count === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Icon className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </div>
        )}

        {!isLoading && count > 0 && children}
      </div>
    </div>
  );
}

interface ItemRowProps {
  title: string;
  meta: string;
  onClick: () => void;
}

function ItemRow({ title, meta, onClick }: ItemRowProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {meta}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
    </button>
  );
}

function RowSkeleton(): React.JSX.Element {
  return (
    <div className="rounded-lg border px-3 py-2.5 space-y-1.5">
      <Skeleton className="h-3.5 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

function typeLabel(type: string): string {
  return type.replace(/_/g, " ");
}

export function EducatorAttentionSection({
  classId,
  assessments,
  assessmentsLoading,
  attendanceGrid,
  attendanceLoading,
}: EducatorAttentionSectionProps): React.JSX.Element {
  const router = useRouter();
  const base = `/educator/classes/${classId}`;

  const toGrade = assessments
    .filter((a) => a.pendingEssayCount > 0)
    .sort((a, b) => b.pendingEssayCount - a.pendingEssayCount);

  const toPublish = assessments
    .filter(
      (a) =>
        a.status === "closed" &&
        !a.isPublished &&
        a.submittedCount > 0 &&
        a.pendingEssayCount === 0,
    )
    .sort((a, b) => timeValue(b.endDate) - timeValue(a.endDate));

  const active = assessments
    .filter((a) => a.status === "open" || a.status === "upcoming")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "open" ? -1 : 1;
      const aKey = a.status === "open" ? a.endDate : a.releaseDate;
      const bKey = b.status === "open" ? b.endDate : b.releaseDate;
      return timeValue(aKey) - timeValue(bKey);
    });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const hasStudents = (attendanceGrid?.students.length ?? 0) > 0;
  const unrecorded = hasStudents
    ? (attendanceGrid?.sessions ?? [])
        .filter(
          (s) =>
            new Date(s.date).getTime() < startOfToday.getTime() &&
            Object.keys(s.records ?? {}).length === 0,
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">Needs your attention</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CardShell
          icon={ClipboardCheck}
          colorIndex={1}
          title="Essays to Grade"
          count={toGrade.length}
          actionLabel="Assessments"
          onAction={() => router.push(`${base}/assessments`)}
          isLoading={assessmentsLoading}
          emptyText="No essay answers waiting for grading"
        >
          {toGrade.slice(0, MAX_ROWS).map((a) => (
            <ItemRow
              key={a.id}
              title={a.title}
              meta={`${a.pendingEssayCount} essay ${
                a.pendingEssayCount === 1 ? "answer" : "answers"
              } to grade · ${typeLabel(a.type)}`}
              onClick={() => router.push(`${base}/assessments/${a.id}/submissions`)}
            />
          ))}
        </CardShell>

        <CardShell
          icon={Send}
          colorIndex={2}
          title="Ready to Publish"
          count={toPublish.length}
          actionLabel="Assessments"
          onAction={() => router.push(`${base}/assessments`)}
          isLoading={assessmentsLoading}
          emptyText="No closed assessments waiting to be published"
        >
          {toPublish.slice(0, MAX_ROWS).map((a) => (
            <ItemRow
              key={a.id}
              title={a.title}
              meta={`${a.submittedCount} ${
                a.submittedCount === 1 ? "submission" : "submissions"
              } · scores not published${
                a.endDate ? ` · closed ${formatDate(a.endDate)}` : ""
              }`}
              onClick={() => router.push(`${base}/assessments/${a.id}`)}
            />
          ))}
        </CardShell>

        <CardShell
          icon={CalendarClock}
          colorIndex={4}
          title="Open and Upcoming Assessments"
          count={active.length}
          actionLabel="View all"
          onAction={() => router.push(`${base}/assessments`)}
          isLoading={assessmentsLoading}
          emptyText="No open or upcoming assessments"
        >
          {active.slice(0, MAX_ROWS).map((a) => {
            const meta =
              a.status === "open"
                ? `Open${a.endDate ? ` · closes ${formatDate(a.endDate)}` : ""} · ${a.submittedCount} submitted`
                : `Upcoming${a.releaseDate ? ` · opens ${formatDate(a.releaseDate)}` : ""}`;
            return (
              <ItemRow
                key={a.id}
                title={a.title}
                meta={meta}
                onClick={() => router.push(`${base}/assessments/${a.id}`)}
              />
            );
          })}
        </CardShell>

        <CardShell
          icon={CalendarCheck}
          colorIndex={5}
          title="Attendance Not Recorded"
          count={unrecorded.length}
          actionLabel="Attendance"
          onAction={() => router.push(`${base}/attendance`)}
          isLoading={attendanceLoading}
          emptyText="All past sessions have attendance recorded"
        >
          {unrecorded.slice(0, MAX_ROWS).map((s) => (
            <ItemRow
              key={s.id}
              title={formatDate(s.date)}
              meta={`Week ${s.weekNumber} · no attendance recorded`}
              onClick={() => router.push(`${base}/attendance`)}
            />
          ))}
        </CardShell>
      </div>
    </div>
  );
}