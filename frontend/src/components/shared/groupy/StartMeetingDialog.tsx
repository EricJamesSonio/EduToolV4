"use client";

import { useMemo, useState } from "react";
import { PhoneCall, Users, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getProfileImageUrl } from "@/utils/profile.util";
import { groupyApi } from "@/api/shared/groupy.api";
import { useGroupyMembers } from "@/hooks/groupy/useGroupyMembers";

interface StartMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  onStarted: (meetingId: string) => void;
}

export function StartMeetingDialog({
  open,
  onOpenChange,
  classId,
  onStarted,
}: StartMeetingDialogProps): React.JSX.Element {
  const { data: membersData } = useGroupyMembers(classId);
  const [step, setStep] = useState<"choose" | "select">("choose");
  const [selected, setSelected] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);

  const students = useMemo(
    () => (membersData?.members ?? []).filter((m) => m.role === "student"),
    [membersData]
  );

  const close = () => {
    onOpenChange(false);
    setStep("choose");
    setSelected([]);
  };

  const handleStart = async (invitedStudentIds?: string[]) => {
    if (starting) return;
    setStarting(true);
    try {
      const { meetingId } = await groupyApi.startMeeting(
        classId,
        invitedStudentIds
      );
      onStarted(meetingId);
      close();
    } finally {
      setStarting(false);
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const initials = (name: string) =>
    (name || "?")
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const spinner = (
    <Loader2 className="h-4 w-4 animate-spin" />
  );

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? undefined : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Start a class meeting
          </DialogTitle>
          <DialogDescription>
            Who should be invited to this call?
          </DialogDescription>
        </DialogHeader>

        {step === "choose" ? (
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => handleStart()}
              disabled={starting}
            >
              {starting ? spinner : <Users className="h-4 w-4" />}
              Call all students
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setStep("select")}
              disabled={starting}
            >
              <Users className="h-4 w-4" />
              Select students…
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {students.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No students are currently enrolled in this class.
              </p>
            )}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {students.map((s) => {
                const on = selected.includes(s.account_id);
                return (
                  <button
                    key={s.account_id}
                    type="button"
                    onClick={() => toggle(s.account_id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      on
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage
                        src={getProfileImageUrl(s.profile_image)}
                        alt={s.full_name ?? ""}
                      />
                      <AvatarFallback>{initials(s.full_name ?? "")}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {s.full_name ?? s.account_id}
                    </span>
                    <input
                      type="checkbox"
                      checked={on}
                      readOnly
                      className="h-4 w-4 accent-primary"
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {selected.length} student{selected.length === 1 ? "" : "s"} selected
            </p>
          </div>
        )}

        {step === "select" && (
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" onClick={() => setStep("choose")} disabled={starting}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={close} disabled={starting}>
                Cancel
              </Button>
              <Button
                onClick={() => handleStart(selected)}
                disabled={selected.length === 0 || starting}
                className="gap-1.5"
              >
                {starting ? spinner : <PhoneCall className="h-4 w-4" />}
                Start call
              </Button>
            </div>
          </DialogFooter>
        )}

        {step === "choose" && (
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={starting}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}