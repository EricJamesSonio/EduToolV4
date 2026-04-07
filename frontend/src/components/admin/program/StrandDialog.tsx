"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useCreateStrand, useUpdateStrand } from "@/hooks/admin/useStrand";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StrandForm {
  name: string;
}

interface StrandDialogProps {
  programId:    string;
  schoolYearId: string;
  strand?:      { id: string; name: string };
  open:         boolean;
  onClose:      () => void;
}

export function StrandDialog({
  programId,
  schoolYearId,
  strand,
  open,
  onClose,
}: StrandDialogProps): React.JSX.Element {
  const isEdit = !!strand;
  const createMutation = useCreateStrand();
  const updateMutation = useUpdateStrand();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StrandForm>({
    defaultValues: { name: strand?.name ?? "" },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: StrandForm) => {
    const onSuccess = () => {
      toast.success(isEdit ? "Strand updated." : "Strand added.");
      handleClose();
    };
    const onError = (err: unknown) => {
      const axiosErr = err as AxiosError<{ message: string }>;
      toast.error(axiosErr?.response?.data?.message ?? "Failed to save strand.");
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: strand!.id, data: { name: values.name } },
        { onSuccess, onError }
      );
    } else {
      createMutation.mutate(
        { schoolYearId, program_id: programId, name: values.name },
        { onSuccess, onError }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Strand" : "Add Strand"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Strand Name</Label>
            <Input
              placeholder="e.g. STEM, ABM, HUMSS"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
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
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Strand"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}