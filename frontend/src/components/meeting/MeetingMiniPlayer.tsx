"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMeeting } from "@/hooks/meeting/MeetingContext";
import { VideoOff, Users, ExternalLink, X } from "lucide-react";

interface Pos {
  x: number;
  y: number;
}

interface DragState {
  ox: number;
  oy: number;
  sx: number;
  sy: number;
  moved: boolean;
  pointerType: string;
}

const DRAG_THRESHOLD = 5;

export function MeetingMiniPlayer(): React.JSX.Element | null {
  const meeting = useMeeting();
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const clamp = useCallback((x: number, y: number): Pos => {
    const el = containerRef.current;
    if (!el) return { x, y };
    return {
      x: Math.min(Math.max(0, x), Math.max(0, window.innerWidth - el.offsetWidth)),
      y: Math.min(Math.max(0, y), Math.max(0, window.innerHeight - el.offsetHeight)),
    };
  }, []);

  useEffect(() => {
    if (!meeting.localVideo || !meeting.isMinimized) return;
    const id = "mini-player-video";
    const el = document.getElementById(id);
    if (el) {
      meeting.localVideo.play(id);
    }
  }, [meeting.localVideo, meeting.isMinimized]);

  useEffect(() => {
    const onResize = () => {
      setPos((prev) => {
        if (!prev) return prev;
        const next = clamp(prev.x, prev.y);
        return next.x === prev.x && next.y === prev.y ? prev : next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  const insideRoom =
    !!meeting.meetingId &&
    !!pathname &&
    pathname.includes(`/meetings/${meeting.meetingId}/room`);

  if (!meeting.isInMeeting || !meeting.isMinimized || insideRoom) return null;

  const roomPath = meeting.origin === "groupy"
    ? meeting.role === "educator"
      ? `/educator/classes/${meeting.classId}/meetings/${meeting.meetingId}/room?origin=groupy`
      : `/student/classes/${meeting.classId}/meetings/${meeting.meetingId}/room?origin=groupy`
    : meeting.role === "educator"
      ? `/educator/classes/${meeting.classId}/meetings/${meeting.meetingId}/room`
      : `/student/meetings/${meeting.meetingId}/room?classId=${meeting.classId}`;

  const handleReturn = () => {
    router.push(roomPath);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      ox: e.clientX - rect.left,
      oy: e.clientY - rect.top,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
      pointerType: e.pointerType,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (!drag.moved) {
      const dist = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
      if (dist < DRAG_THRESHOLD) return;
      drag.moved = true;
      setDragging(true);
    }
    setPos(clamp(e.clientX - drag.ox, e.clientY - drag.oy));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!drag || drag.moved) return;

    if (drag.pointerType === "mouse") {
      handleReturn();
    } else {
      setShowControls((v) => !v);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const stop = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  const posStyle: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y }
    : { right: 16, bottom: 16 };

  return (
    <div
      ref={containerRef}
      style={posStyle}
      className="fixed z-[100]"
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{ touchAction: "none" }}
        className={`group relative w-40 h-28 sm:w-52 sm:h-36 select-none rounded-xl bg-card border border-border overflow-hidden shadow-2xl transition-shadow ${
          dragging ? "cursor-grabbing ring-2 ring-primary/60" : "cursor-grab hover:ring-2 hover:ring-primary/50"
        }`}
      >
        {meeting.localVideo ? (
          <div id="mini-player-video" className="w-full h-full pointer-events-none" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
            <VideoOff className="h-8 w-8" />
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/60 to-transparent flex items-end px-2 pb-1 pointer-events-none">
          <div className="flex items-center gap-1.5 text-[11px] text-white">
            <Users className="h-3 w-3" />
            {meeting.participants.length}
          </div>
        </div>

        {!meeting.localVideo && (
          <div className="absolute top-1.5 left-1.5 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
            Cam off
          </div>
        )}

        <div
          className={`absolute inset-0 flex items-center justify-center gap-2 bg-black/50 transition-opacity ${
            showControls
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          }`}
        >
          <button
            type="button"
            onPointerDown={stop}
            onClick={handleReturn}
            className="h-7 px-2.5 text-[11px] font-medium bg-white/90 hover:bg-white text-zinc-900 rounded-lg flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </button>
          <button
            type="button"
            onPointerDown={stop}
            onClick={meeting.leaveMeeting}
            className="h-7 px-2.5 text-[11px] font-medium bg-red-500/90 hover:bg-red-500 text-white rounded-lg flex items-center gap-1 transition-colors"
          >
            <X className="h-3 w-3" />
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}