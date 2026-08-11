"use client";

import { useState } from "react";
import { Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { groupyApi } from "@/api/shared/groupy.api";

interface StartMeetingButtonProps {
  classId: string;
  onStarted: () => void;
}

export function StartMeetingButton({
  classId,
  onStarted,
}: StartMeetingButtonProps): React.JSX.Element {
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    try {
      await groupyApi.startMeeting(classId);
      onStarted();
    } finally {
      setStarting(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5"
      onClick={handleStart}
      disabled={starting}
    >
      {starting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Video className="h-3.5 w-3.5" />
      )}
      Start Meeting
    </Button>
  );
}