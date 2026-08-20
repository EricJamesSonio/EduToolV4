"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { organizationApi } from "@/api/admin/organization.api";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { EmailExtensionSection } from "./EmailExtensionSection";
import { OrgHeroCard } from "./OrgHeroCard";
import { OrgEditForm } from "./OrgEditForm";
import { OrgCreateForm } from "./OrgCreateForm";
import type { OrgForm } from "./types";

export function OrgDetailsCard(): React.JSX.Element {
  const queryClient = useQueryClient();

  const { data: org, isLoading } = useAsyncQuery(
    queryKeys.admin.organization.detail(),
    organizationApi.getOrg,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<OrgForm>({
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (org) {
      reset({
        name: org.name,
        description: org.description ?? "",
      });
    }
  }, [org, reset]);

  const updateMutation = useMutationWithInvalidation(
    (values: OrgForm) =>
      organizationApi.updateOrg({
        name: values.name,
        description: values.description || undefined,
      }),
    {
      invalidateKeys: [queryKeys.admin.organization.detail()],
      onSuccess: (updated) => {
        toast.success("Organization updated.");
        reset({
          name: updated.name,
          description: updated.description ?? "",
        });
      },
      onError: () => toast.error("Failed to update organization."),
    },
  );

  const createMutation = useMutationWithInvalidation(
    (values: OrgForm) =>
      organizationApi.createOrg({
        name: values.name,
        description: values.description || undefined,
      }),
    {
      invalidateKeys: [queryKeys.admin.analytics.dashboard()],
      onSuccess: (created) => {
        toast.success("Organization created.");
        queryClient.setQueryData(
          queryKeys.admin.organization.detail(),
          created,
        );
        reset({
          name: created.name,
          description: created.description ?? "",
        });
      },
      onError: () => toast.error("Failed to create organization."),
    },
  );

  const onSubmit = (values: OrgForm) => {
    if (!org) {
      createMutation.mutate(values);
    } else {
      updateMutation.mutate(values);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-border/60 h-full">
            <CardContent className="flex flex-col items-center pt-8 pb-6 px-6">
              <Skeleton className="h-28 w-28 rounded-2xl mb-5" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border/60">
            <CardContent className="px-6 py-5 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <OrgCreateForm
        register={register}
        errors={errors}
        onSubmit={handleSubmit(onSubmit)}
        isPending={createMutation.isPending}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2">
        <OrgHeroCard name={org.name} logoUrl={org.logoUrl} />
      </div>

      <div className="lg:col-span-3 space-y-6">
        <OrgEditForm
          register={register}
          errors={errors}
          onSubmit={handleSubmit(onSubmit)}
          isDirty={isDirty}
          isPending={updateMutation.isPending}
        />

        <Card className="border-border/60">
          <CardContent className="px-6 py-5">
            <EmailExtensionSection />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}