// src/components/meeting/ParticipantsPanel.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMeeting } from "@/hooks/meeting/MeetingContext";
import { useMeetingPresentation } from "@/hooks/meeting/useMeetingPresentation";
import SlideViewer from "@/components/meeting/SlideViewer";
import { getMeetingTileRects } from "./meeting-tile-layout";
import { lockMeetingVideo } from "./meeting-video-lock";
import type { Presentation } from "@/types/educator/presentation.types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Participant {
  userId: string;
  name: string;
  role: string;
  handRaised: boolean;
}

interface ContextMenu {
  x: number;
  y: number;
  participant: Participant;
}

interface ParticipantsPanelProps {
  participants: Participant[];
  remoteUsers: IAgoraRTCRemoteUser[];
  currentUserId: string;
  currentUserName: string;
  role: "educator" | "student";
  localVideo?: { play: (id: string) => void } | null;
}

const SLIDE_BASE_WIDTH = 1280;
const SLIDE_BASE_HEIGHT = 720;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDesktopGridCols(count: number): number {
  if (count <= 2) return 2;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
}

// ── Presentation tile (used inside the All Cameras grid) ─────────────────────

function PresentationTile({
  presentation,
  slideIndex,
}: {
  presentation: Presentation;
  slideIndex: number;
}) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const totalSlides = presentation.slides.length;
  const safeIndex =
    totalSlides > 0 ? Math.min(Math.max(slideIndex, 0), totalSlides - 1) : 0;
  const slide = presentation.slides[safeIndex] ?? null;
  const template = presentation.template ?? "green";

  useEffect(() => {
    if (isMobile) return;
    const el = boxRef.current;
    if (!el) return;

    const apply = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      setScale(Math.min(w / SLIDE_BASE_WIDTH, h / SLIDE_BASE_HEIGHT));
    };

    apply();

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    observer?.observe(el);

    return () => observer?.disconnect();
  }, [isMobile]);

  if (isMobile) {
    return (
      <div className="absolute inset-0 flex">
        <SlideViewer
          slide={slide}
          template={template}
          slideNumber={safeIndex}
          totalSlides={totalSlides}
        />
      </div>
    );
  }

  return (
    <div ref={boxRef} className="absolute inset-0 overflow-hidden bg-zinc-900">
      <div
        className="flex"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: SLIDE_BASE_WIDTH,
          height: SLIDE_BASE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <SlideViewer
          slide={slide}
          template={template}
          slideNumber={safeIndex}
          totalSlides={totalSlides}
        />
      </div>
    </div>
  );
}

// ── Single camera fullscreen view ─────────────────────────────────────────────

function FullscreenView({
  participant,
  remoteUsers,
  localVideo,
  currentUserId,
  onClose,
}: {
  participant: Participant;
  remoteUsers: IAgoraRTCRemoteUser[];
  localVideo?: { play: (id: string) => void } | null;
  currentUserId: string;
  onClose: () => void;
}) {
  const videoId = `fs-video-${participant.userId}`;
  const isLocal = participant.userId === currentUserId;

  // While this overlay is open the room must not pull tracks back to the
  // main stage.
  useEffect(() => lockMeetingVideo(), []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (isLocal) {
        localVideo?.play(videoId);
      } else {
        const remote = remoteUsers.find((u) => {
          const el = document.querySelector(`[data-user-id="${participant.userId}"]`);
          return el && String(u.uid) === (el as HTMLElement).dataset.uid;
        }) ?? remoteUsers[0]; // best-effort fallback
        remote?.videoTrack?.play(videoId);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [isLocal, localVideo, participant.userId, remoteUsers, videoId]);

  // Re-target the track back to the main room element when the fullscreen
  // overlay unmounts. play() moves the track to a new element, so without
  // this the local camera / remote video would stay stuck on a removed node.
  const remoteUsersRef = useRef(remoteUsers);
  remoteUsersRef.current = remoteUsers;
  useEffect(() => {
    return () => {
      if (isLocal) {
        const target = document.getElementById("local-video-grid")
          ? "local-video-grid"
          : "local-video-pip";
        localVideo?.play(target);
      } else {
        const remote = remoteUsersRef.current.find((u) => {
          const el = document.querySelector(`[data-user-id="${participant.userId}"]`);
          return el && String(u.uid) === (el as HTMLElement).dataset.uid;
        }) ?? remoteUsersRef.current[0];
        remote?.videoTrack?.play(`remote-${remote?.uid}`);
      }
    };

  }, []);

  return (
    <div
      className="fixed inset-x-0 top-0 bottom-[var(--meeting-controls-h,0px)] z-[9999] bg-black flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 z-10"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white font-semibold text-lg">{participant.name}</span>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white text-2xl leading-none"
          style={{ lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Video */}
      <div
        id={videoId}
        className="flex-1 w-full"
        style={{ background: "#111" }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Click outside hint */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs pointer-events-none">
        Tap outside the video to close
      </p>
    </div>
  );
}

// ── Grid "view all" modal ─────────────────────────────────────────────────────

function GridView({
  participants,
  remoteUsers,
  localVideo,
  currentUserId,
  currentUserName,
  onClose,
}: {
  participants: Participant[];
  remoteUsers: IAgoraRTCRemoteUser[];
  localVideo?: { play: (id: string) => void } | null;
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
}) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const meetingCtx = useMeeting();
  const { presentation } = useMeetingPresentation(
    meetingCtx.classId,
    meetingCtx.presentationId,
  );

  const showPresentation = meetingCtx.isPresenting && !!presentation;

  // Build a combined list: local user first, then others
  const allSlots = [
    { userId: currentUserId, name: currentUserName, isLocal: true },
    ...participants
      .filter((p) => p.userId !== currentUserId)
      .map((p) => ({ userId: p.userId, name: p.name, isLocal: false })),
  ];

  // While this overlay is open the room must not pull tracks back to the
  // main stage (it does that whenever the remote user list or the
  // presentation state changes).
  useEffect(() => lockMeetingVideo(), []);

  // Re-target every track back to its main room element when the grid closes.
  // play() moves a track to a new element, so without this restore the local
  // camera (and remote videos) would stay stuck on the removed grid nodes.
  const localVideoRef = useRef(localVideo);
  localVideoRef.current = localVideo;
  const remoteUsersRef = useRef(remoteUsers);
  remoteUsersRef.current = remoteUsers;
  useEffect(() => {
    return () => {
      const localTarget = document.getElementById("local-video-grid")
        ? "local-video-grid"
        : "local-video-pip";
      localVideoRef.current?.play(localTarget);
      remoteUsersRef.current.forEach((u) => {
        if (u.videoTrack) u.videoTrack.play(`remote-${u.uid}`);
      });
    };
  }, []);

  // Keep every tile attached to its video, including when the remote user
  // list, the local track or the participant list changes while open.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      localVideo?.play(`grid-video-${currentUserId}`);

      const others = participants.filter((p) => p.userId !== currentUserId);
      remoteUsers.forEach((ru, i) => {
        const slot = others[i];
        if (slot) ru.videoTrack?.play(`grid-video-${slot.userId}`);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [remoteUsers, localVideo, participants, currentUserId]);

  const tileCount = allSlots.length + (showPresentation ? 1 : 0);
  const rects = getMeetingTileRects(
    tileCount,
    isMobile ? undefined : getDesktopGridCols(tileCount),
  );
  const cameraOffset = showPresentation ? 1 : 0;
  const presentationRect = showPresentation ? rects[0] : undefined;

  return (
    <div className="fixed inset-x-0 top-0 bottom-[var(--meeting-controls-h,0px)] z-[9999] bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
        <span className="text-white font-semibold text-base">
          All Cameras ({allSlots.length})
        </span>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors"
          style={{ fontSize: 24, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      <div className="relative flex-1 min-h-0">
        {showPresentation && presentation && presentationRect && (
          <div
            className="absolute p-1"
            style={{
              left: `${presentationRect.x}%`,
              top: `${presentationRect.y}%`,
              width: `${presentationRect.w}%`,
              height: `${presentationRect.h}%`,
            }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-800">
              <PresentationTile
                presentation={presentation}
                slideIndex={meetingCtx.currentSlide}
              />
              <div
                className="absolute bottom-0 left-0 right-0 px-3 py-2 pointer-events-none z-10"
                style={{
                  background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
                }}
              >
                <span className="text-white text-sm font-medium">Presentation</span>
              </div>
            </div>
          </div>
        )}

        {allSlots.map((slot, index) => {
          const rect = rects[index + cameraOffset];
          if (!rect) return null;
          return (
            <div
              key={slot.userId}
              className="absolute p-1"
              style={{
                left: `${rect.x}%`,
                top: `${rect.y}%`,
                width: `${rect.w}%`,
                height: `${rect.h}%`,
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-800">
                <div
                  id={`grid-video-${slot.userId}`}
                  className="absolute inset-0"
                />
                <div
                  className="absolute bottom-0 left-0 right-0 px-3 py-2 pointer-events-none"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
                  }}
                >
                  <span className="text-white text-sm font-medium">
                    {slot.name}
                    {slot.isLocal && (
                      <span className="ml-1.5 text-xs text-white/50">(You)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Context menu ──────────────────────────────────────────────────────────────

function ContextMenuPopup({
  menu,
  onViewFullscreen,
  onViewAll,
  onClose,
}: {
  menu: ContextMenu;
  onViewFullscreen: (p: Participant) => void;
  onViewAll: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Keep menu inside viewport
  const style: React.CSSProperties = {
    position: "fixed",
    top: menu.y,
    left: menu.x,
    zIndex: 9998,
  };

  return (
    <div
      ref={ref}
      style={style}
      className="bg-popover border border-border rounded-xl shadow-2xl overflow-hidden min-w-[180px]"
    >
      {/* Participant label */}
      <div className="px-4 py-2.5 border-b border-border">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {menu.participant.name}
        </p>
      </div>

      <button
        onClick={() => { onViewFullscreen(menu.participant); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-muted transition-colors text-left"
      >
        <span>⛶</span>
        View fullscreen
      </button>

      <button
        onClick={() => { onViewAll(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-muted transition-colors text-left"
      >
        <span>⊞</span>
        View all cameras
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ParticipantsPanel({
  participants,
  remoteUsers,
  currentUserId,
  currentUserName,
  role,
  localVideo,
}: ParticipantsPanelProps) {
  const [contextMenu,      setContextMenu]      = useState<ContextMenu | null>(null);
  const [fullscreenTarget, setFullscreenTarget] = useState<Participant | null>(null);
  const [showGrid,         setShowGrid]         = useState(false);

  const handleRightClick = useCallback(
    (e: React.MouseEvent, participant: Participant) => {
      e.preventDefault();
      e.stopPropagation();

      // Clamp so menu doesn't go off-screen
      const menuW = 200;
      const menuH = 110;
      const x = Math.min(e.clientX, window.innerWidth  - menuW - 8);
      const y = Math.min(e.clientY, window.innerHeight - menuH - 8);

      setContextMenu({ x, y, participant });
    },
    [],
  );

  return (
    <>
      <div className="p-3 space-y-1 overflow-y-auto h-full">
        {participants.map((p) => {
          const isMe = p.userId === currentUserId;
          return (
            <div
              key={p.userId}
              onContextMenu={(e) => handleRightClick(e, p)}
              onClick={() => setFullscreenTarget(p)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/40 cursor-pointer select-none"
              title="Tap to view camera"
            >
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                {p.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {p.name}
                  {isMe && (
                    <span className="ml-1.5 text-xs text-muted-foreground">(You)</span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">{p.role}</p>
              </div>
              {p.handRaised && <span className="text-base">✋</span>}
            </div>
          );
        })}

        {participants.length === 0 && (
          <p className="text-center text-sm text-muted-foreground pt-6">
            No participants yet
          </p>
        )}

        {/* View all button at bottom */}
        {participants.length > 1 && (
          <div className="pt-2 border-t border-border/40 mt-2">
            <button
              onClick={() => setShowGrid(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <span>⊞</span>
              View all cameras
            </button>
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenuPopup
          menu={contextMenu}
          onViewFullscreen={(p) => setFullscreenTarget(p)}
          onViewAll={() => setShowGrid(true)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Fullscreen single view */}
      {fullscreenTarget && (
        <FullscreenView
          participant={fullscreenTarget}
          remoteUsers={remoteUsers}
          localVideo={localVideo}
          currentUserId={currentUserId}
          onClose={() => setFullscreenTarget(null)}
        />
      )}

      {/* Grid view all */}
      {showGrid && (
        <GridView
          participants={participants}
          remoteUsers={remoteUsers}
          localVideo={localVideo}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onClose={() => setShowGrid(false)}
        />
      )}
    </>
  );
}