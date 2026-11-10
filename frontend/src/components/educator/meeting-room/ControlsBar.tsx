"use client";

import { useRef } from "react";
import {
  Mic, MicOff, Video, VideoOff, MessageSquare,
  Users, LogOut, Smile, UserPlus, Monitor, Maximize, Minimize, MoreHorizontal, PhoneOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMeetingControlsHeight } from "@/hooks/meeting/useMeetingControlsHeight";
import { ControlBtn } from "./ControlBtn";
import type { SidePanelType } from "./types";

interface ControlsBarProps {
  connected: boolean;
  micOn: boolean;
  camOn: boolean;
  isPresenting: boolean;
  isFullscreen: boolean;
  showReactions: boolean;
  overflowOpen: boolean;
  sidePanel: SidePanelType;
  participantCount: number;
  pendingRequestCount: number;
  isEndingMeeting: boolean;
  // Simplified (Groupy) meetings omit presenter/chat/join-request controls.
  simplified?: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleReactions: () => void;
  onTogglePresentation: () => void;
  onToggleFullscreen: () => void;
  onToggleSidePanel: (panel: NonNullable<SidePanelType>) => void;
  onToggleOverflow: () => void;
  onLeave: () => void;
  onEnd: () => void;
}

export function ControlsBar({
  connected, micOn, camOn,
  isPresenting, isFullscreen, showReactions, overflowOpen,
  sidePanel, participantCount, pendingRequestCount,
  isEndingMeeting, simplified,
  onToggleMic, onToggleCam, onToggleReactions,
  onTogglePresentation, onToggleFullscreen, onToggleSidePanel, onToggleOverflow,
  onLeave, onEnd,
}: ControlsBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  useMeetingControlsHeight(barRef);

  return (
    <div
      ref={barRef}
      className="meeting-controls relative z-[57] shrink-0 flex items-center justify-center flex-wrap gap-2 border-t border-border bg-card px-2 py-2"
    >
      {/* Connection status */}
      <div className={cn(
        "meeting-status absolute left-3 flex items-center gap-1.5 text-[10px]",
        connected ? "text-success" : "text-muted-foreground",
      )}>
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", connected ? "bg-success" : "bg-muted-foreground")} />
        <span className="meeting-status-label">{connected ? "Connected" : "Connecting..."}</span>
      </div>

      <ControlBtn
        onClick={onToggleMic}
        active={!micOn}
        danger={!micOn}
        label={micOn ? "Mute" : "Unmute"}
      >
        {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </ControlBtn>

      <ControlBtn
        onClick={onToggleCam}
        active={!camOn}
        danger={!camOn}
        label={camOn ? "Turn off camera" : "Turn on camera"}
      >
        {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </ControlBtn>

      <ControlBtn onClick={onToggleReactions} active={showReactions} label="React" hideOnMobile>
        <Smile className="h-5 w-5" />
      </ControlBtn>

      {!simplified && (
        <ControlBtn
          onClick={onTogglePresentation}
          active={isPresenting}
          label={isPresenting ? "Stop presenting" : "Present"}
          hideOnMobile
        >
          <Monitor className="h-5 w-5" />
        </ControlBtn>
      )}

      {!simplified && (
        <ControlBtn
          onClick={() => onToggleSidePanel("chat")}
          active={sidePanel === "chat"}
          label="Chat"
          hideOnMobile
        >
          <MessageSquare className="h-5 w-5" />
        </ControlBtn>
      )}

      <ControlBtn
        onClick={onToggleFullscreen}
        active={isFullscreen}
        label={isFullscreen ? "Exit full screen" : "Full screen"}
        hideOnMobile
      >
        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </ControlBtn>

      <ControlBtn
        onClick={() => onToggleSidePanel("participants")}
        active={sidePanel === "participants"}
        label={participantCount > 0 ? `People (${participantCount})` : "People"}
        badge={participantCount}
        hideOnMobile
      >
        <Users className="h-5 w-5" />
      </ControlBtn>

      {!simplified && (
        <ControlBtn
          onClick={() => onToggleSidePanel("join-requests")}
          active={sidePanel === "join-requests"}
          label="Join requests"
          badge={pendingRequestCount}
          hideOnMobile
        >
          <UserPlus className="h-5 w-5" />
        </ControlBtn>
      )}

      <ControlBtn onClick={onToggleOverflow} active={overflowOpen} label="More" mobileOnly>
        <MoreHorizontal className="h-5 w-5" />
      </ControlBtn>

      <ControlBtn onClick={onLeave} label="Leave meeting" wide>
        <LogOut className="h-5 w-5" />
      </ControlBtn>

      <ControlBtn
        onClick={onEnd}
        disabled={isEndingMeeting}
        danger
        wide
        label={isEndingMeeting ? "Ending..." : "End meeting for everyone"}
      >
        <PhoneOff className="h-5 w-5" />
      </ControlBtn>
    </div>
  );
}