"use client";

import Link from "next/link";
import { BookOpen, Clock, User, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSchedule } from "@/utils/classes.utils";
import type { StudentClassItem } from "@/api/student/class.api";

interface ClassCardProps {
  item: StudentClassItem;
  colorIndex?: number;
}

const STATUS_STYLES: Record<string, string> = {
  active:  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400",
  pending: "bg-amber-50   text-amber-700   border-amber-200   dark:bg-amber-950/20 dark:text-amber-400",
  removed: "bg-slate-100  text-slate-500   border-slate-200   dark:bg-slate-900/20 dark:text-slate-400",
};

export function ClassCard({ item, colorIndex = 0 }: ClassCardProps) {
  const { enrollmentStatus, class: cls } = item;
  const schedule = formatSchedule(cls.schedules);

  return (
    <Link
      href={`/student/classes/${cls.id}`}
      className="rounded-xl border bg-card p-6 space-y-4 hover:border-primary/40 hover:shadow-md transition-all duration-200 group block"
    >
      <div className="flex items-start gap-3">
        <div className={cn("rounded-md p-2.5 shrink-0", WEEK_COLORS[colorIndex % WEEK_COLORS.length])}>
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-semibold text-lg leading-tight truncate">
            {cls.subjectName ?? "Unnamed Subject"}
          </h3>
          <div className="space-y-0.5">
            {cls.educatorName && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{cls.educatorName}</span>
              </p>
            )}
            {schedule && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{schedule}</span>
              </p>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[11px] font-medium capitalize shrink-0 mt-0.5",
            STATUS_STYLES[enrollmentStatus] ?? "bg-muted text-muted-foreground"
          )}
        >
          {enrollmentStatus}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {cls.schoolYearId && (
            <span className="text-xs text-muted-foreground">{cls.schoolYearId}</span>
          )}
          {cls.capacity > 0 && (
            <span className="text-xs text-muted-foreground">Cap: {cls.capacity}</span>
          )}
        </div>
        <Button variant="outline" size="sm">
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View
        </Button>
      </div>
    </Link>
  );
}
