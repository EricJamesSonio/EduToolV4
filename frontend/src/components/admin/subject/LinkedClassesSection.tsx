"use client";

import { useRouter } from "next/navigation";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { classApi } from "@/api/admin/class.api";
import { formatSchedule } from "@/utils/classes.utils";
import type { Class } from "@/types/admin/class.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Users } from "lucide-react";

interface Props {
  subjectId: string;
  /**
   * Classes are school-year scoped, so the list must be filtered to one or it
   * would show classes from every year this subject was ever taught in.
   */
  schoolYearId?: string;
}

/**
 * Classes actually scheduled for this subject, each linking straight to the
 * class detail page.
 *
 * The section this replaced rendered a heading and nothing else — the "View All
 * Classes" button linked to `/admin/classes?subjectId=…`, but that param was
 * only used to auto-open the Create Class dialog and never reached the list
 * query, so it showed every class in the school year instead of this subject's.
 */
export function LinkedClassesSection({ subjectId, schoolYearId }: Props): React.JSX.Element {
  const router = useRouter();

  const { data: classes, isLoading } = useAsyncQuery<Class[]>(
    queryKeys.admin.classes.list({ subjectId, schoolYearId }),
    () => classApi.getAll({ subjectId, schoolYearId }),
    {
      enabled: !!subjectId,
      meta: { preset: "list", feature: "subject-linked-classes" },
    },
  );

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="px-4 py-6 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const rows = classes ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold not-interactive">Linked Classes</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/admin/classes?subjectId=${subjectId}`)}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View All Classes
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground not-interactive">
            No classes linked to this subject yet.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => router.push(`/admin/classes?subjectId=${subjectId}`)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Go to Classes
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {rows.map((cls) => (
            <LinkedClassRow key={cls.id} cls={cls} />
          ))}
        </div>
      )}
    </div>
  );
}

function LinkedClassRow({ cls }: { cls: Class }): React.JSX.Element {
  const router = useRouter();
  const count = cls.enrolledCount ?? 0;
  const capacity = cls.capacity ?? 0;
  const pct = capacity > 0 ? Math.min((count / capacity) * 100, 100) : 0;
  const label = cls.title ?? cls.subjectName ?? "Unnamed Class";

  return (
    <div
      role="link"
      tabIndex={0}
      title={`Open ${label}`}
      className="flex cursor-pointer flex-wrap items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => router.push(`/admin/classes/${cls.id}`)}
      onKeyDown={(e) => {
        // Enter/Space so the row is reachable by keyboard, not mouse only.
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/admin/classes/${cls.id}`);
        }
      }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{label}</span>
          {cls.isArchived && (
            <Badge variant="secondary" className="text-xs font-normal not-interactive">
              Archived
            </Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {[
            cls.sectionName,
            cls.educatorName,
            cls.semesterName,
            formatSchedule(cls.schedules),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        <span className="tabular-nums not-interactive">
          {count} / {capacity}
        </span>
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}