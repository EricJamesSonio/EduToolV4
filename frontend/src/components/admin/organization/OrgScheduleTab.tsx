"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Save, Clock } from "lucide-react";

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";
import { adminQueryKeys } from "@/hooks/queryKeys/admin.keys";
import { orgScheduleConfigApi } from "@/api/admin/org-schedule-config.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { generateSlots, formatHourLabel } from "@/utils/schedule-slots.utils";
import type { AxiosError } from "axios";

type FormValues = {
  startTime: string;
  endTime: string;
  slotDuration: string;
};

const DURATION_OPTIONS = [15, 20, 25, 30, 45, 60] as const;

export function OrgScheduleTab(): React.JSX.Element {
  const { data: cfg, isLoading } = useAsyncQuery(
    adminQueryKeys.orgScheduleConfig.detail(),
    orgScheduleConfigApi.get,
    { meta: { preset: "static", feature: "organization" } },
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<FormValues>({
    defaultValues: { startTime: "07:00", endTime: "17:00", slotDuration: "30" },
  });

  useEffect(() => {
    if (cfg) {
      reset({
        startTime: cfg.startTime,
        endTime: cfg.endTime,
        slotDuration: String(cfg.slotDuration),
      });
    }
  }, [cfg, reset]);

  const mutate = useMutationWithInvalidation(
    (values: FormValues) =>
      orgScheduleConfigApi.upsert({
        startTime: values.startTime,
        endTime: values.endTime,
        slotDuration: Number(values.slotDuration),
      }),
    {
      invalidateKeys: [adminQueryKeys.orgScheduleConfig.detail()],
      onSuccess: (updated) => {
        toast.success("Schedule settings updated.");
        reset({
          startTime: updated.startTime,
          endTime: updated.endTime,
          slotDuration: String(updated.slotDuration),
        });
      },
      onError: (err: unknown) => {
        const ax = err as AxiosError<{ message?: string }>;
        const msg =
          (ax.response?.data as { message?: string })?.message ??
          ax.message ??
          "Failed to update schedule settings.";
        // 409 strict-blocking case
        if (ax.response?.status === 409) {
          toast.error(msg, { duration: 6000 });
        } else {
          toast.error(msg);
        }
      },
    },
  );

  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const slotDuration = watch("slotDuration");

  const preview = useMemo(() => {
    const dur = Number(slotDuration);
    if (!startTime || !endTime || Number.isNaN(dur)) return [];
    // basic validation: start < end else empty
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    if (Number.isNaN(sh) || Number.isNaN(eh)) return [];
    const sM = sh * 60 + sm;
    const eM = eh * 60 + em;
    if (sM >= eM) return [];
    return generateSlots(startTime, endTime, dur);
  }, [startTime, endTime, slotDuration]);

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="px-6 py-5 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" /> Schedule time range
        </CardTitle>
        <CardDescription className="text-xs">
          Global for all departments. Classes can only be scheduled inside this window and must align to the slot length.
          Changing the range is blocked if existing classes would go out of bounds.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-5 space-y-5">
        <form
          onSubmit={handleSubmit((v) => mutate.mutate(v))}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sched-start" className="text-xs text-muted-foreground">
                Start time
              </Label>
              <Input id="sched-start" type="time" step={60} {...register("startTime", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sched-end" className="text-xs text-muted-foreground">
                End time
              </Label>
              <Input id="sched-end" type="time" step={60} {...register("endTime", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Slot duration</Label>
              <Select
                value={slotDuration ?? "30"}
                onValueChange={(v) => setValue("slotDuration", v ?? "30", { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} mins
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
              Preview ({preview.length} slots {preview.length ? `— ${startTime} to ${endTime} every ${slotDuration}m` : ""})
            </p>
            {preview.length ? (
              <div className="flex flex-wrap gap-1.5">
                {preview.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border bg-background px-2 py-1 text-xs text-foreground"
                    title={t}
                  >
                    {formatHourLabel(t)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Enter a valid start before end to see slots.</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutate.isPending || !isDirty}>
              {mutate.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save schedule
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
