"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { programApi } from "@/api/admin/program.api";
import { useProgramDeletionCheck } from "@/hooks/admin/useProgramDeletionCheck";
import { useSchoolYearDeletionCheck } from "@/hooks/admin/useSchoolYearDeletionCheck";
import type { Program } from "@/types/admin/program.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EditSchoolYearDialog } from "@/components/admin/school-years/EditSchoolYearDialog";
import { ProgramCard } from "@/components/admin/program/ProgramCard";
import { DeleteEntityDialog } from "@/components/shared/DeleteEntityDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cardGridClass } from "@/lib/utils";
import {
  readinessEntityTarget,
  readinessTarget,
} from "@/utils/readinessTargets";
import Link from "next/link";
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
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const [deleteYearOpen, setDeleteYearOpen] = useState(false);

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

  const deleteMutation = useMutationWithInvalidation(
    (programId: string) => programApi.delete(programId),
    {
      invalidateKeys: [
        queryKeys.admin.programs.all,
        queryKeys.admin.schoolYears.readiness(),
      ],
      onSuccess: () => {
        toast.success("Department deleted.");
        setDeleteTarget(null);
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(err?.response?.data?.message ?? "Failed to delete department.");
        setDeleteTarget(null);
      },
    },
  );

  const deletionCheckQuery = useProgramDeletionCheck(deleteTarget?.id, !!deleteTarget);
  const deletionCheckError = deletionCheckQuery.error as AxiosError<{ message: string }> | null;

  // Deleting the school year itself: the card on the list page handles that too,
  // but the detail page needs its own entry point. The check is only fetched
  // while the dialog is open, and DELETE re-runs it server-side in a tx.
  const deleteYearMutation = useMutationWithInvalidation(
    () => schoolYearApi.remove(id),
    {
      invalidateKeys: [
        queryKeys.admin.schoolYears.all,
        queryKeys.admin.programs.all,
        queryKeys.admin.schoolYears.readiness(),
      ],
      onSuccess: () => {
        toast.success("School year deleted.");
        setDeleteYearOpen(false);
        router.push("/admin/school-years");
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(err?.response?.data?.message ?? "Failed to delete school year.");
        setDeleteYearOpen(false);
      },
    },
  );

  const yearDeletionCheckQuery = useSchoolYearDeletionCheck(id, deleteYearOpen);
  const yearDeletionCheckError = yearDeletionCheckQuery.error as AxiosError<{ message: string }> | null;

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
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {/* An active year can never be deleted (the server blocks it and asks
                you to end it instead), so the entry point is hidden there. Every
                other blocker is explained by the deletion-check dialog. */}
            {schoolYear.status !== "active" && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={() => setDeleteYearOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
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
            <ul className="space-y-1.5 pl-6">
              {readiness.issues.map((issue, i) => {
                const issueHref = readinessTarget(issue, id);
                const entities = issue.entities ?? [];
                // `count` is the true total; `entities` is capped by the
                // backend, so the difference is what the chips cannot show.
                const hiddenCount = Math.max(
                  0,
                  (issue.count ?? entities.length) - entities.length,
                );
                return (
                  <li
                    key={issue.ref?.id ?? `${issue.code}-${i}`}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                        issue.severity === "blocking" ? "bg-amber-500" : "bg-sky-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      {issueHref ? (
                        <Link
                          href={issueHref}
                          className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        >
                          {issue.message}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{issue.message}</span>
                      )}

                      {entities.length > 0 && (
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {entities.map((entity) => {
                            const entityHref = readinessEntityTarget(entity, id);
                            const label = entity.name;
                            return entityHref ? (
                              <Link
                                key={entity.id}
                                href={entityHref}
                                className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground underline-offset-2 hover:bg-muted-foreground/10 hover:text-foreground hover:underline"
                              >
                                {label}
                              </Link>
                            ) : (
                              <span
                                key={entity.id}
                                className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                              >
                                {label}
                              </span>
                            );
                          })}
                          {hiddenCount > 0 && (
                            <span className="text-[11px] text-muted-foreground/70">
                              +{hiddenCount} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* PROGRAMS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base not-interactive">Departments</h3>
          <Badge variant="secondary" className="text-xs font-normal">
            {programs.length}
          </Badge>
        </div>

        {programs.length === 0 ? (
          <div className="rounded-lg border bg-card px-6 py-10 text-center space-y-3">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground not-interactive">
              No departments for this school year.
            </p>
            <Button size="sm" onClick={() => router.push(`/admin/programs?schoolYearId=${id}&create=1`)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create Department
            </Button>
          </div>
        ) : (
          <div className={`grid ${cardGridClass(programs.length)}`}>
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* DELETE DIALOG */}
      {deleteTarget && (
        <DeleteEntityDialog
          open
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
          entityLabel="department"
          entityName={deleteTarget.name}
          check={{
            data: deletionCheckQuery.data,
            isLoading: deletionCheckQuery.isLoading,
            isError: deletionCheckQuery.isError,
            errorMessage: deletionCheckError?.response?.data?.message,
          }}
          isDeleting={deleteMutation.isPending}
          onConfirmDelete={() => deleteMutation.mutate(deleteTarget.id)}
          confirmLabel="Delete Department"
          willDeleteNote={`"${deleteTarget.name}" and everything under it will be permanently deleted.`}
        />
      )}

      {/* DELETE SCHOOL YEAR DIALOG */}
      {deleteYearOpen && (
        <DeleteEntityDialog
          open
          onOpenChange={(o) => { if (!o) setDeleteYearOpen(false); }}
          entityLabel="school year"
          entityName={schoolYear.name}
          check={{
            data: yearDeletionCheckQuery.data,
            isLoading: yearDeletionCheckQuery.isLoading,
            isError: yearDeletionCheckQuery.isError,
            errorMessage: yearDeletionCheckError?.response?.data?.message,
          }}
          isDeleting={deleteYearMutation.isPending}
          onConfirmDelete={() => deleteYearMutation.mutate()}
          confirmLabel="Delete School Year"
          willDeleteNote={`"${schoolYear.name}" and everything under it will be permanently deleted.`}
        />
      )}

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
