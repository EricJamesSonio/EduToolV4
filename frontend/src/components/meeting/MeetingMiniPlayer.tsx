"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMeeting } from "@/hooks/meeting/MeetingContext";
import { VideoOff, Users, ExternalLink, X } from "lucide-react";

export function MeetingMiniPlayer(): React.JSX.Element | null {
  const meeting = useMeeting();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!meeting.localVideo || !meeting.isMinimized) return;
    const id = "mini-player-video";
    const el = document.getElementById(id);
    if (el) {
      meeting.localVideo.play(id);
    }
  }, [meeting.localVideo, meeting.isMinimized]);

  if (!meeting.isInMeeting || !meeting.isMinimized) return null;

  const roomPath = meeting.role === "educator"
    ? `/educator/classes/${meeting.classId}/meetings/${meeting.meetingId}/room`
    : `/student/meetings/${meeting.meetingId}/room?classId=${meeting.classId}`;

  const handleReturn = () => {
    meeting.maximize();
    router.push(roomPath);
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2"
    >
      <div
        onClick={handleReturn}
        className="relative w-52 h-36 rounded-xl bg-card border border-border overflow-hidden shadow-2xl cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group"
      >
        {meeting.localVideo ? (
          <div id="mini-player-video" className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
            <VideoOff className="h-8 w-8" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <span className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            Return to meeting
          </span>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/60 to-transparent flex items-end px-2 pb-1">
          <div className="flex items-center gap-1.5 text-[11px] text-white">
            <Users className="h-3 w-3" />
            {meeting.participants.length}
          </div>
        </div>

        {!meeting.localVideo && (
          <div className="absolute top-1.5 left-1.5 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded">
            Cam off
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleReturn}
          className="h-7 px-2.5 text-[11px] font-medium bg-muted hover:bg-muted/70 text-foreground rounded-lg border border-border flex items-center gap-1 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </button>
        <button
          onClick={meeting.leaveMeeting}
          className="h-7 px-2.5 text-[11px] font-medium bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg border border-destructive/30 flex items-center gap-1 transition-colors"
        >
          <X className="h-3 w-3" />
          Leave
        </button>
      </div>
    </div>
  );
}
