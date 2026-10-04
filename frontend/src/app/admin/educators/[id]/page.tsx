"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Trash2, Mail, Hash, User, Pencil } from "lucide-react";
import { useEducator, useDeleteEducator, useResetEducatorPassword, useTeachableSubjects } from "@/hooks/admin/useEducators";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
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
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { queryKeys } from "@/hooks/queryKeys.factory";
import type { SchoolYear } from "@/types/admin/school-year.types";
import type { AxiosError } from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { classApi } from "@/api/admin/class.api";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function EducatorDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  // Teachable subjects are year-scoped (subjects are recreated per year), so
  // the admin picks which school year they are editing.
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | undefined>();

  const { data: schoolYearsRaw, isLoading: schoolYearsLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    () => schoolYearApi.getAll()
  );
  const schoolYears: SchoolYear[] = schoolYearsRaw ?? [];
  const schoolYearId =
    selectedSchoolYearId ?? schoolYears.find((y) => y.status === "active")?.id ?? schoolYears[0]?.id;

  const [editOpen, setEditOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{
    fullName: string; email: string; educatorCode: string; password: string;
  } | null>(null);

  const { data: educator, isLoading } = useEducator(id);
    const [tab, setTab] = useState<"subjects" | "classes">("classes");
  const { data: teachableSubjects } = useTeachableSubjects(id);
  const { data: assignedClasses } = useAsyncQuery(
    queryKeys.admin.classes.list({ educatorId: id }),
    () => classApi.getAll({ educatorId: id }),
  );
  const resetMutation  = useResetEducatorPassword();
  const deleteMutation = useDeleteEducator();

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

  const handleDeleteConfirm = () => {
    if (!educator) return;
    deleteMutation.mutate(educator.id, {
      onSuccess: () => {
        toast.success("Educator removed.");
        router.push("/admin/educators");
      },
      onError: (err: unknown) => {
        const axiosErr = err as AxiosError<{ message: string }>;
        toast.error(axiosErr?.response?.data?.message ?? "Failed to remove educator.");
        setDeleteConfirmOpen(false);
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
          <div className="flex items-center gap-2">
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={schoolYearsLoading}
              selectedId={schoolYearId ?? null}
              onSelect={setSelectedSchoolYearId}
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
            <EducatorClassAssignmentManager educatorId={educator.id} />
          </TabsContent>
          <TabsContent value="subjects" className="pt-3">
            <EducatorTeachableSubjectsCard
              educatorId={educator.id}
              schoolYearId={schoolYearId}
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
            disabled={hasActiveClasses || deleteMutation.isPending}
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

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Remove this educator?"
        message={`Remove "${educator.fullName}" from the organization? This cannot be undone.`}
        confirmLabel="Remove Educator"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />

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