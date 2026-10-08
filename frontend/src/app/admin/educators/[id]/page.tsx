"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Trash2, Mail, Hash, User, Pencil } from "lucide-react";
import { useEducator, useDeleteEducator, useResetEducatorPassword, useTeachableSubjects } from "@/hooks/admin/useEducators";
import { useEducatorDeletionCheck } from "@/hooks/admin/useEducatorDeletionCheck";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DeleteEntityDialog } from "@/components/shared/DeleteEntityDialog";
import { EducatorCredentialsCard } from "@/components/admin/educator/EducatorCredentialsCard";
import { EducatorClassAssignmentManager } from "@/components/admin/educator/EducatorClassAssignmentManager";
import { EducatorTeachableSubjectsCard } from "@/components/admin/educator/EducatorTeachableSubjectsCard";
import { EducatorAvailabilityCard } from "@/components/admin/educator/EducatorAvailabilityCard";
import { EditEducatorDialog } from "@/components/admin/educator/EditEducatorDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/utils/profile.util";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { SemesterSelector, ALL_SEMESTERS } from "@/components/shared/SemesterSelector";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { useSemestersByYear } from "@/hooks/admin/useSemester";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { programApi, type GroupedSemester } from "@/api/admin/program.api";
import { getCurrentSemesterId } from "@/utils/semester.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import type { SchoolYear } from "@/types/admin/school-year.types";
import type { AxiosError } from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { classApi } from "@/api/admin/class.api";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function EducatorDetailPageInner(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const searchParams = useSearchParams();

  // Year + semester survive refresh/back via ?sy=&sem=. A selection the new
  // year's options don't contain falls back to that year's default.
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | undefined>(
    () => searchParams.get("sy") ?? undefined,
  );
  const [semesterOverride, setSemesterOverride] = useState<string | null>(
    () => searchParams.get("sem"),
  );

  const { data: schoolYearsRaw, isLoading: schoolYearsLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    () => schoolYearApi.getAll()
  );
  const schoolYears: SchoolYear[] = schoolYearsRaw ?? [];
  const schoolYearId =
    (selectedSchoolYearId && schoolYears.some((y) => y.id === selectedSchoolYearId)
      ? selectedSchoolYearId
      : undefined) ??
    schoolYears.find((y) => y.status === "active")?.id ?? schoolYears[0]?.id;

  // Semesters of the selected year only (both queries are year-scoped
  // server-side). Grouped rows carry program labels; dated rows drive the
  // today-default. The same physical row can sit under several programs, so
  // options are deduped by semester id — it filters as one semester anyway.
  const { data: datedSemestersRaw } = useSemestersByYear(schoolYearId);
  const { data: groupedRaw, isLoading: groupedLoading } = useAsyncQuery(
    queryKeys.admin.programs.semestersGrouped(schoolYearId ?? null),
    () => programApi.getSemestersGrouped(schoolYearId!),
    { enabled: !!schoolYearId },
  );
  const semesterOptions: GroupedSemester[] = useMemo(() => {
    const seen = new Set<string>();
    const out: GroupedSemester[] = [];
    for (const o of groupedRaw ?? []) {
      if (seen.has(o.semesterId)) continue;
      seen.add(o.semesterId);
      out.push(o);
    }
    return out;
  }, [groupedRaw]);
  const defaultSemesterId =
    getCurrentSemesterId(datedSemestersRaw) ?? ALL_SEMESTERS;

  const optionsReady = !!schoolYearId && !groupedLoading;
  const semesterId = useMemo(() => {
    if (
      semesterOverride &&
      (semesterOverride === ALL_SEMESTERS ||
        semesterOptions.some((o) => o.semesterId === semesterOverride))
    ) {
      return semesterOverride;
    }
    // While options load, hold the URL value so back-navigation never
    // flashes "All" before settling on the stored selection.
    if (!optionsReady) return semesterOverride ?? ALL_SEMESTERS;
    return defaultSemesterId;
  }, [semesterOverride, semesterOptions, optionsReady, defaultSemesterId]);
  const semesterParam = semesterId !== ALL_SEMESTERS ? semesterId : undefined;

  // Keep the URL in sync (replace, no scroll, no history spam). The compare
  // guards the replace → searchParams-change → effect loop.
  useEffect(() => {
    if (!schoolYearId) return;
    const params = new URLSearchParams();
    params.set("sy", schoolYearId);
    if (semesterId !== ALL_SEMESTERS) params.set("sem", semesterId);
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(`?${next}`, { scroll: false });
    }
  }, [schoolYearId, semesterId, searchParams, router]);

  const handleSelectYear = (yearId: string) => {
    setSelectedSchoolYearId(yearId);
    // Changing year invalidates whatever semester was selected — follow the
    // new year's default instead of pointing at a stale id.
    setSemesterOverride(null);
  };

  const [editOpen, setEditOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{
    fullName: string; email: string; educatorCode: string; password: string;
  } | null>(null);

  const { data: educator, isLoading } = useEducator(id);
    const [tab, setTab] = useState<"subjects" | "classes">("classes");
  // Global tab count: the Subjects tab never changes with the selectors.
  const { data: teachableSubjects } = useTeachableSubjects(id);
  const { data: assignedClasses } = useAsyncQuery(
    queryKeys.admin.classes.list({
      educatorId: id,
      schoolYearId,
      semesterId: semesterParam,
    }),
    () => classApi.getAll({
      educatorId: id,
      schoolYearId,
      semesterId: semesterParam,
    }),
    { enabled: !!schoolYearId },
  );
  const resetMutation  = useResetEducatorPassword();
  const deleteMutation = useDeleteEducator();

  const deletionCheckQuery = useEducatorDeletionCheck(
    deleteConfirmOpen ? educator?.id : undefined,
    deleteConfirmOpen,
  );
  const deletionCheckError = deletionCheckQuery.error as AxiosError<{ message: string }> | null;

  const hasActiveClasses = (educator?.classCount ?? 0) > 0;

  const handleResetConfirm = () => {
    if (!educator) return;
    resetMutation.mutate(educator.id, {
      onSuccess: (result) => {
        setResetConfirmOpen(false);
        setNewCredentials({
          fullName:     educator.fullName,
          email:        educator.email,
          educatorCode: educator.educatorId ?? educator.educatorCode ?? "",
          password:     result.plainPassword,
        });
      },
      onError: (err: unknown) => {
        const axiosErr = err as AxiosError<{ message: string }>;
        toast.error(axiosErr?.response?.data?.message ?? "Failed to reset password.");
        setResetConfirmOpen(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (!educator) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <p className="text-sm text-muted-foreground not-interactive">Educator not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={educator.fullName}
        breadcrumbs={[
          { label: "Educators", href: "/admin/educators" },
          { label: educator.fullName },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={schoolYearsLoading}
              selectedId={schoolYearId ?? null}
              onSelect={handleSelectYear}
            />
            <SemesterSelector
              options={semesterOptions}
              isLoading={groupedLoading}
              selectedId={semesterId}
              onSelect={setSemesterOverride}
              disabled={!schoolYearId}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setResetConfirmOpen(true)}
            >
              <KeyRound className="h-4 w-4" />
              Reset Password
            </Button>
          </div>
        }
      />

      {/* Profile card */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex gap-6">
          <Avatar className="h-20 w-20 shrink-0">
            <AvatarImage
              src={getProfileImageUrl(educator.profileImage)}
              alt={educator.fullName}
            />
            <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
              {getInitials(educator.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-4">
            <ProfileField icon={User}  iconClass="icon-people"    label="Full Name"   value={educator.fullName} />
            <ProfileField icon={Hash}  iconClass="icon-credential" label="Educator ID" value={educator.educatorId ?? educator.educatorCode ?? ""} mono />
            <ProfileField icon={Mail}  iconClass="icon-people"    label="Email"       value={educator.email} />
          </div>
        </div>
      </div>

      {/* Assignments: subjects and classes */}
      <div className="rounded-lg border bg-card p-5">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "subjects" | "classes")}>
          <TabsList>
            <TabsTrigger value="classes" className="px-3">
              Classes ({assignedClasses?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="subjects" className="px-3">
              Subjects ({teachableSubjects?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="pt-3">
            <EducatorClassAssignmentManager
              educatorId={educator.id}
              schoolYearId={schoolYearId}
              semesterId={semesterParam}
            />
          </TabsContent>
          <TabsContent value="subjects" className="pt-3">
            <EducatorTeachableSubjectsCard
              educatorId={educator.id}
              schoolYearId={schoolYearId}
              semesterId={semesterParam}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Generator input: when this educator can be scheduled. */}
      <div className="rounded-lg border bg-card p-5">
        <EducatorAvailabilityCard educatorId={educator.id} />
      </div>

      {/* Danger zone */}
      <div className="rounded-lg border border-destructive/20 bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-destructive not-interactive">Danger Zone</h2>
        <Separator className="bg-destructive/10" />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium not-interactive">Remove Educator</p>
            <p className="text-xs text-muted-foreground not-interactive">
              {hasActiveClasses
                ? "This educator has active class assignments. Reassign or remove all classes first."
                : "Permanently removes this educator from the organization."}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => setDeleteConfirmOpen(true)}
            className="gap-1.5 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            Remove Educator
          </Button>
        </div>
      </div>

      {editOpen && (
        <EditEducatorDialog
          open={editOpen}
          educator={educator}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* Reset password confirm */}
      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Reset password?"
        message={`This will generate a new password for ${educator.fullName}. The old password will stop working immediately.`}
        confirmLabel="Reset Password"
        destructive
        isLoading={resetMutation.isPending}
        onConfirm={handleResetConfirm}
      />

      {/* Delete (blocked with guidance when any history exists) */}
      {educator && (
        <DeleteEntityDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          entityLabel="educator"
          entityName={educator.fullName}
          check={{
            data: deletionCheckQuery.data,
            isLoading: deletionCheckQuery.isLoading,
            isError: deletionCheckQuery.isError,
            errorMessage: deletionCheckError?.response?.data?.message,
          }}
          isDeleting={deleteMutation.isPending}
          onConfirmDelete={() =>
            deleteMutation.mutate(educator.id, {
              onSuccess: () => {
                setDeleteConfirmOpen(false);
                router.push("/admin/educators");
              },
              onError: (err: unknown) => {
                const axiosErr = err as AxiosError<{ message: string }>;
                toast.error(axiosErr?.response?.data?.message ?? "Failed to remove educator.");
                setDeleteConfirmOpen(false);
              },
            })
          }
          confirmLabel="Remove Educator"
          willDeleteNote={`"${educator.fullName}" has no linked records and will be permanently removed.`}
        />
      )}

      {/* New credentials after reset */}
      {newCredentials && (
        <EducatorCredentialsCard
          open
          onClose={() => setNewCredentials(null)}
          credentials={newCredentials}
          title="Password reset successfully"
        />
      )}
    </div>
  );
}

export default function EducatorDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      }
    >
      <EducatorDetailPageInner />
    </Suspense>
  );
}

function ProfileField({
  icon: Icon, label, value, mono = false, iconClass,
}: { icon: React.ElementType; label: string; value: string; mono?: boolean; iconClass?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconClass ?? "bg-muted text-muted-foreground"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground not-interactive">{label}</p>
        {mono
          ? <Badge variant="outline" className="font-mono text-xs">{value}</Badge>
          : <p className="text-sm font-medium">{value}</p>}
      </div>
    </div>
  );
}
