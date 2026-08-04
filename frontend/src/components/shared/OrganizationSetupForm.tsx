"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { organizationApi } from "@/api/admin/organization.api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrganizationSetupFormProps {
  onSuccess?: () => void;
  onPendingChange?: (pending: boolean) => void;
  submitLabel?: string;
}

export function OrganizationSetupForm({
  onSuccess,
  onPendingChange,
  submitLabel = "Create Organization",
}: OrganizationSetupFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<{
    name: string;
    description: string;
  }>({ defaultValues: { name: "", description: "" } });

  const mutation = useMutationWithInvalidation(
    organizationApi.createOrg,
    {
      invalidateKeys: [
        queryKeys.admin.organization.detail(),
        queryKeys.admin.analytics.dashboard(),
      ],
      onSuccess: () => {
        toast.success("Organization created! Welcome to Relief-ED.");
        onSuccess?.();
      },
      onError: () => toast.error("Failed to create organization."),
    }
  );

  useEffect(() => {
    onPendingChange?.(mutation.isPending);
  }, [mutation.isPending, onPendingChange]);

  return (
    <form
      onSubmit={handleSubmit((v) =>
        mutation.mutate({ name: v.name, description: v.description || undefined })
      )}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="org-name">School / Organization Name</Label>
        <Input
          id="org-name"
          placeholder="e.g. St. Mary's Academy"
          {...register("name", {
            required: "Name is required",
            minLength: { value: 2, message: "At least 2 characters" },
          })}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="org-desc">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="org-desc"
          placeholder="A brief description of your school..."
          rows={3}
          {...register("description")}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
