"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { Pencil, Plus } from "lucide-react";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { programApi } from "@/api/admin/program.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { EditSchoolYearDialog } from "@/components/admin/school-years/EditSchoolYearDialog";
import { ProgramCard } from "@/components/admin/program/ProgramCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cardGridClass } from "@/lib/utils";
import { AlertTriangle, BookOpen, CircleAlert, CheckCircle2 } from "lucide-react";
import type { SchoolYearReadiness } from "@/types/admin/school-year.types";

export default function SchoolYearDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const { data: schoolYear, isLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.detail(id),
    () => schoolYearApi.getById(id),
  );

  const { data: programs = [] } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId: id }),
    () => programApi.getAll(id),
    { enabled: !!schoolYear },
  );

  const { data: readiness } = useAsyncQuery<SchoolYearReadiness>(
    queryKeys.admin.schoolYears.readinessDetail(id),
    () => schoolYearApi.getReadiness(id),
    { enabled: !!schoolYear },
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!schoolYear) {
    return (
      <div className="rounded-lg border bg-card px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground not-interactive">
          School year not found.
        </p>
      </div>
    );
  }

  const isEnded = schoolYear.status === "ended";

  return (
    <div className="space-y-6">
      <PageHeader
        title={schoolYear.name}
        breadcrumbs={[
          { label: "Admin" },
          { label: "School Years", href: "/admin/school-years" },
          { label: schoolYear.name },
        ]}
        actions={
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        }
      />

      {/* INFO CARD */}
      <div className="rounded-lg border bg-card divide-y divide-border">
        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-28 text-sm text-muted-foreground shrink-0 not-interactive">Name</span>
          <span className="text-sm font-medium">{schoolYear.name}</span>
        </div>

        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-28 text-sm text-muted-foreground shrink-0 not-interactive">Status</span>
          <StatusBadge status={schoolYear.status} />
        </div>

        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-28 text-sm text-muted-foreground shrink-0 not-interactive">Start Date</span>
          <span className="text-sm">
            {schoolYear.start_date ? new Date(schoolYear.start_date).toLocaleDateString() : "—"}
          </span>
        </div>

        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-28 text-sm text-muted-foreground shrink-0 not-interactive">End Date</span>
          <span className="text-sm">
            {schoolYear.end_date ? new Date(schoolYear.end_date).toLocaleDateString() : "—"}
          </span>
        </div>
      </div>

      {/* End banner */}
      {isEnded && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="not-interactive">This school year has ended and is read-only.</span>
        </div>
      )}

      {/* READINESS */}
      {readiness && (
        <div
          className={`rounded-lg border px-4 py-3 ${
            readiness.ready
              ? "border-emerald-300/40 bg-emerald-50/50 dark:bg-emerald-950/20"
              : "border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {readiness.ready ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <CircleAlert className="h-4 w-4 text-amber-500 shrink-0" />
            )}
            <h3 className="text-sm font-semibold not-interactive">
              {readiness.ready
                ? "This school year is ready to use."
                : `This school year is not ready (${readiness.blockingCount} blocking).`}
            </h3>
          </div>
          {!readiness.ready && readiness.issues.length > 0 && (
            <ul className="space-y-1 pl-6">
              {readiness.issues.map((issue, i) => (
                <li key={issue.ref?.id ?? `${issue.code}-${i}`} className="flex items-start gap-2 text-xs">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                      issue.severity === "blocking" ? "bg-amber-500" : "bg-sky-400"
                    }`}
                  />
                  <span className="text-muted-foreground">{issue.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* PROGRAMS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base not-interactive">Programs</h3>
          <Badge variant="secondary" className="text-xs font-normal">
            {programs.length}
          </Badge>
        </div>

        {programs.length === 0 ? (
          <div className="rounded-lg border bg-card px-6 py-10 text-center space-y-3">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground not-interactive">
              No programs for this school year.
            </p>
            <Button size="sm" onClick={() => router.push(`/admin/programs?schoolYearId=${id}`)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create Program
            </Button>
          </div>
        ) : (
          <div className={`grid ${cardGridClass(programs.length)}`}>
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* EDIT DIALOG */}
      {editOpen && (
        <EditSchoolYearDialog
          schoolYear={schoolYear}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
