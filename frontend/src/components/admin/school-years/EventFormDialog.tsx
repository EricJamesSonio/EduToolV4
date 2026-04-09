import { useForm } from "react-hook-form";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CalendarEvent, CalendarEventType } from "@/types/admin/calendar.types";
import { EVENT_TYPE_LABELS } from "./constants";

export interface CalendarEventForm {
  title:       string;
  type:        CalendarEventType;
  startDate:   string;
  endDate:     string;
  description: string;
}

interface EventFormDialogProps {
  mode:         "create" | "edit";
  event?:       CalendarEvent;
  schoolYearId: string;
  isLoading:    boolean;
  onClose:      () => void;
  onSubmit:     (values: CalendarEventForm) => void;
}

export function EventFormDialog({
  mode,
  event,
  isLoading,
  onClose,
  onSubmit,
}: EventFormDialogProps): React.JSX.Element {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CalendarEventForm>({
    defaultValues: {
      title:       event?.title ?? "",
      type:        event?.type  ?? "holiday",
      startDate:   event?.start_date?.slice(0, 10) ?? "",
      endDate:     event?.end_date?.slice(0, 10)   ?? "",
      description: event?.description ?? "",
    },
  });

  const selectedType = watch("type");

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Event" : "Edit Event"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              placeholder="e.g. Christmas Holiday"
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => setValue("type", v as CalendarEventType)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" {...register("startDate", { required: "Required" })} />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" {...register("endDate", { required: "Required" })} />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Notes{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea rows={2} {...register("description")} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : mode === "create" ? "Add Event" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}