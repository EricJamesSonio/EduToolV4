"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMeeting } from "@/hooks/meeting/MeetingContext";
import { VideoOff, Users, ExternalLink, X } from "lucide-react";

export function MeetingMiniPlayer(): React.JSX.Element | null {
  const meeting = useMeeting();
  const router = useRouter();

  useEffect(() => {
    if (!meeting.localVideo || !meeting.isInMeeting) return;
    const el = document.getElementById("mini-player-video");
    if (el) {
      meeting.localVideo.play("mini-player-video");
    }
  }, [meeting.localVideo, meeting.isInMeeting]);

  if (!meeting.isInMeeting || !meeting.isMinimized) return null;

  const role = meeting.meetingId.startsWith("educator") ? "educator" : "student";

  const handleReturn = () => {
    meeting.maximize();
    router.push(`/${role === "educator" ? "educator/classes/" + meeting.classId : "student"}/meetings/${meeting.meetingId}/room`);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
      <div
        onClick={handleReturn}
        className="relative w-52 h-36 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden shadow-2xl cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group"
      >
        {meeting.localVideo ? (
          <div id="mini-player-video" className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">
            <VideoOff className="h-8 w-8" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <span className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            Return to meeting
          </span>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/60 to-transparent flex items-end px-2 pb-1">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
            <Users className="h-3 w-3" />
            {meeting.participants.length}
          </div>
        </div>

        {/* Cam off indicator */}
        {!meeting.localVideo && (
          <div className="absolute top-1.5 left-1.5 text-[10px] text-zinc-400 bg-zinc-900/70 px-1.5 py-0.5 rounded">
            Cam off
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleReturn}
          className="h-7 px-2.5 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 flex items-center gap-1 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </button>
        <button
          onClick={meeting.leaveMeeting}
          className="h-7 px-2.5 text-[11px] font-medium bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg border border-red-800/50 flex items-center gap-1 transition-colors"
        >
          <X className="h-3 w-3" />
          Leave
        </button>
      </div>
    </div>
  );
}
