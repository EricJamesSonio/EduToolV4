"use client";

import Link from "next/link";
import { Clock, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatSchedule } from "@/utils/classes.utils";
import type { StudentClassItem } from "@/api/student/class.api";

interface ClassCardProps {
  item: StudentClassItem;
}

const STATUS_STYLES: Record<string, string> = {
  active:  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400",
  pending: "bg-amber-50   text-amber-700   border-amber-200   dark:bg-amber-950/20 dark:text-amber-400",
  removed: "bg-slate-100  text-slate-500   border-slate-200   dark:bg-slate-900/20 dark:text-slate-400",
};

export function ClassCard({ item }: ClassCardProps) {
  const { enrollmentStatus, class: cls } = item;
  const schedule = formatSchedule(cls.schedules);

  return (
    <Link
      href={`/student/classes/${cls.id}`}
      className="rounded-xl border bg-card p-6 space-y-4 hover:border-primary/40 hover:shadow-md transition-all duration-200 group block"
    >
      <div className="space-y-1">
        <p className="font-semibold text-base group-hover:text-primary transition-colors truncate">
          {cls.subjectName ?? "Unnamed Subject"}
        </p>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        {cls.educatorName && (
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{cls.educatorName}</span>
          </div>
        )}
        {schedule && (
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{schedule}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Badge
          variant="outline"
          className={cn(
            "text-[11px] font-medium capitalize",
            STATUS_STYLES[enrollmentStatus] ?? "bg-muted text-muted-foreground"
          )}
        >
          {enrollmentStatus}
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}
