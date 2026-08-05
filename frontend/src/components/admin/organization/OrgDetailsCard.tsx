"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";
import { organizationApi } from "@/api/admin/organization.api";
import { getOrgLogoUrl } from "@/utils/org.util";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import { EmailExtensionSection } from "./EmailExtensionSection";

interface OrgForm {
  name: string;
  description: string;
}

export function OrgDetailsCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [logoError, setLogoError] = useState(false);
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

  useEffect(() => {
    setLogoError(false);
  }, [org?.logoUrl]);

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
    if (org === null) {
      createMutation.mutate(values);
    } else {
      updateMutation.mutate(values);
    }
  };

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await organizationApi.uploadOrgLogo(file);
      toast.success("Organization logo updated.");
    } catch {
      toast.error("Failed to upload logo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function showLogoPlaceholder(): boolean {
    return !org?.logoUrl || logoError;
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 sm:p-6 lg:p-8">
        <div className="grid grid-cols-[120px_1fr] gap-3 sm:grid-cols-[180px_1fr] sm:gap-6 lg:grid-cols-[220px_1fr] lg:gap-8">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <h2 className="text-lg font-semibold text-foreground">
        {org === null ? "Create Organization" : "Organization Details"}
      </h2>

      {org === null && (
        <p className="-mt-3 text-sm text-muted-foreground">
          You haven't set up an organization yet. Give your school a name to
          get started.
        </p>
      )}

      {org === null ? (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="org-name" className="text-sm text-foreground">
              Organization Name
            </Label>
            <Input
              id="org-name"
              placeholder="e.g. St. Mary's Academy"
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "At least 2 characters" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="org-desc" className="text-sm text-foreground">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="org-desc"
              placeholder="A brief description of your school..."
              rows={4}
              {...register("description", {
                maxLength: { value: 500, message: "Max 500 characters" },
              })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? "Creating..."
                : "Create Organization"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[120px_1fr] gap-3 sm:grid-cols-[180px_1fr] sm:gap-6 lg:grid-cols-[220px_1fr] lg:gap-8">
        <div className="flex flex-col gap-4">
          <div className="mx-auto lg:mx-0 w-full max-w-[220px] aspect-square rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden">
            {showLogoPlaceholder() ? (
              <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                <ImageIcon className="h-10 w-10" />
                <span className="text-xs">No logo</span>
              </div>
            ) : (
              <img
                src={getOrgLogoUrl(org!.logoUrl!)}
                alt="Organization logo"
                className="h-full w-full object-contain p-4"
                onError={() => setLogoError(true)}
              />
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={handleLogoUpload}
          />

          <div className="mx-auto lg:mx-0 w-full max-w-[220px] space-y-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload Logo"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              PNG, JPG, GIF or WEBP. Max 2MB.
            </p>
          </div>

          <div className="mx-auto lg:mx-0 w-full max-w-[220px] space-y-1.5 pt-2">
            <Label htmlFor="org-name" className="text-sm text-foreground">
              Organization Name
            </Label>
            <Input
              id="org-name"
              placeholder="e.g. St. Mary's Academy"
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "At least 2 characters" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="org-desc" className="text-sm text-foreground">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="org-desc"
              placeholder="A brief description of your school..."
              rows={4}
              {...register("description", {
                maxLength: { value: 500, message: "Max 500 characters" },
              })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {isDirty && (
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}

          <Separator />

          <EmailExtensionSection />
        </div>
        </div>
      )}
    </div>
  );
}