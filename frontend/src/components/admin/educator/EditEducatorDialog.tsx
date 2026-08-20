"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useUpdateEducator } from "@/hooks/admin/useEducators";
import type { Educator } from "@/types/admin/educator.types";
import { getProfileImageUrl } from "@/utils/profile.util";
import apiClient from "@/api/client";

import { Modal, ModalFooter } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";

interface Props {
  open:     boolean;
  educator: Educator;
  onClose:  () => void;
}

interface FormValues {
  fullName:   string;
  emailLocal: string;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function splitEmail(email: string): { local: string; domain: string } {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return { local: email, domain: "" };
  return { local: email.slice(0, atIndex), domain: email.slice(atIndex + 1) };
}

export function EditEducatorDialog({
  open,
  educator,
  onClose,
}: Props): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const { domain } = splitEmail(educator.email);
  const updateMutation = useUpdateEducator();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      fullName:   educator.fullName,
      emailLocal: splitEmail(educator.email).local,
    },
  });

  useEffect(() => {
    reset({
      fullName:   educator.fullName,
      emailLocal: splitEmail(educator.email).local,
    });
  }, [educator, reset]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await apiClient.post<{ path: string }>(
        "/uploads/profile",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      await updateMutation.mutateAsync({
        id: educator.id,
        data: { profileImage: data.path },
      });
    } catch {
      // useUpdateEducator's onError already surfaces a toast for update
      // failures; this catch only exists so the upload-step rejection
      // (before the mutation even runs) doesn't go unhandled.
      toast.error("Failed to upload profile photo");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onSubmit(values: FormValues) {
    const email = domain ? `${values.emailLocal}@${domain}` : values.emailLocal;
    try {
      await updateMutation.mutateAsync({
        id: educator.id,
        data: { fullName: values.fullName, email },
      });
      onClose();
    } catch {
      // handled by useUpdateEducator's onError toast
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Educator" size="md">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-14 w-14">
                <AvatarImage src={getProfileImageUrl(educator.profileImage)} alt={educator.fullName} />
                <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                  {getInitials(educator.fullName)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {imageUploading ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <Camera className="h-2.5 w-2.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <div>
              <p className="text-sm font-medium">{educator.fullName}</p>
              <p className="text-xs text-muted-foreground">
                Educator ID: {educator.educatorId ?? educator.educatorCode ?? ""}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                {...register("fullName", { required: "Full name is required" })}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emailLocal">Email</Label>
              <div className="flex items-stretch">
                <Input
                  id="emailLocal"
                  className="rounded-r-none"
                  {...register("emailLocal", {
                    required: "Email is required",
                    pattern: {
                      value: /^[a-zA-Z0-9._-]+$/,
                      message: "Only letters, numbers, dots, underscores and hyphens allowed",
                    },
                  })}
                />
                {domain && (
                  <span className="flex items-center whitespace-nowrap rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    @{domain}
                  </span>
                )}
              </div>
              {errors.emailLocal && (
                <p className="text-xs text-destructive">{errors.emailLocal.message}</p>
              )}
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </ModalFooter>
    </Modal>
  );
}