"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useCreateCourse, useUpdateCourse } from "@/hooks/admin/useCourses";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CourseForm {
  name: string;
  code: string;
}

interface CourseDialogProps {
  programId: string;
  schoolYearId: string;
  course?: { id: string; name: string; code: string | null };
  open: boolean;
  onClose: () => void;
}

export function CourseDialog({
  programId,
  schoolYearId,
  course,
  open,
  onClose,
}: CourseDialogProps): React.JSX.Element {
  const isEdit = !!course;
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseForm>({
    defaultValues: { name: course?.name ?? "", code: course?.code ?? "" },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: CourseForm) => {
    const onSuccess = () => {
      toast.success(isEdit ? "Course updated." : "Course added.");
      handleClose();
    };
    const onError = (err: unknown) => {
      const axiosErr = err as AxiosError<{ message: string }>;
      toast.error(axiosErr?.response?.data?.message ?? "Failed to save course.");
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: course!.id, data: { name: values.name, code: values.code || undefined }, schoolYearId, programId },
        { onSuccess, onError }
      );
    } else {
      createMutation.mutate(
        { schoolYearId, programId, name: values.name, code: values.code || undefined },
        { onSuccess, onError }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Course" : "Add Course"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Course Name</Label>
            <Input
              placeholder="e.g. Bachelor of Science in IT"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>
              Code{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input placeholder="e.g. BSIT" {...register("code")} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Course"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}