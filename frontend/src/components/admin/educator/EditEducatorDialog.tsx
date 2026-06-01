"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import { educatorApi, type UpdateEducatorRequest } from "@/api/admin/educator.api";
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
  fullName: string;
  email:    string;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function EditEducatorDialog({
  open,
  educator,
  onClose,
}: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      fullName: educator.fullName,
      email:    educator.email,
    },
  });

  useEffect(() => {
    reset({ fullName: educator.fullName, email: educator.email });
  }, [educator, reset]);

  const mutation = useMutation({
    mutationFn: (data: UpdateEducatorRequest) =>
      educatorApi.update(educator.id, data),
    onSuccess: () => {
      toast.success("Educator updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "educators", educator.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "educators"] });
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to update educator.");
    },
  });

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

      await educatorApi.update(educator.id, { profileImage: data.path });
      toast.success("Profile photo updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "educators", educator.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "educators"] });
    } catch {
      toast.error("Failed to upload profile photo");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onSubmit(values: FormValues) {
    mutation.mutate({ fullName: values.fullName, email: values.email });
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </ModalFooter>
    </Modal>
  );
}
