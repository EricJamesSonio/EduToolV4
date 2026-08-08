"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface SectionFormValues {
  name:     string;
  capacity: string;
}

interface SectionFormDialogProps {
  mode:          "create" | "edit";
  defaultValues?: SectionFormValues;
  isLoading:     boolean;
  onClose:       () => void;
  onSubmit:      (vals: SectionFormValues) => void;
  error?:        string | null;
}

export function SectionFormDialog({
  mode,
  defaultValues,
  isLoading,
  onClose,
  onSubmit,
  error,
}: SectionFormDialogProps): React.JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SectionFormValues>({
    defaultValues: defaultValues ?? { name: "", capacity: "40" },
  });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Section" : "Edit Section"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Section A"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input
              type="number"
              min={1}
              {...register("capacity", {
                required: "Capacity is required",
                min: { value: 1, message: "Must be at least 1" },
              })}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">{errors.capacity.message}</p>
            )}
          </div>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : mode === "create"
                ? "Add Section"
                : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}