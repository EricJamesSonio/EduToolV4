// frontend/src/components/student/class/ClassCard.tsx
"use client";

import Link from "next/link";
import { User, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatSchedule } from "@/utils/classes.utils";
import type { StudentClassItem } from "@/api/student/class.api";

interface ClassCardProps {
  item: StudentClassItem;
}

const STATUS_STYLES: Record<string, string> = {
  active:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50   text-amber-700   border-amber-200",
  removed: "bg-slate-100  text-slate-500   border-slate-200",
};

export function ClassCard({ item }: ClassCardProps): React.JSX.Element {
  const { enrollmentStatus, class: cls } = item;
  const schedule = formatSchedule(cls.schedules);

  return (
    <Card className="group flex flex-col hover:shadow-md transition-shadow duration-200 border-border/60">
      {/* Accent stripe */}
      <div className="h-1.5 w-full rounded-t-xl bg-primary/80" />

      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-snug text-foreground truncate">
              {cls.subjectName ?? "Unnamed Subject"}
            </h3>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 text-[11px] font-medium capitalize",
              STATUS_STYLES[enrollmentStatus] ?? "bg-muted text-muted-foreground"
            )}
          >
            {enrollmentStatus}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-4 flex-1 space-y-2">
        <Row icon={User} label={cls.educatorName ?? "No educator assigned"} />
        <Row icon={Clock} label={schedule} />
      </CardContent>

      <CardFooter className="px-5 pb-4">
        <Button
          asChild
          size="sm"
          className="w-full group-hover:bg-primary/90 transition-colors"
        >
          <Link href={`/student/classes/${cls.id}`}>
            Open Class
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function Row({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
      <span className="truncate">{label}</span>
    </div>
  );
}