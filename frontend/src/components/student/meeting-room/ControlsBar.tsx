"use client";

import { useRef } from "react";
import {
  Mic, MicOff, Video, VideoOff, Hand,
  MessageSquare, Users, Smile, Maximize, Minimize, MoreHorizontal, PhoneOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMeetingControlsHeight } from "@/hooks/meeting/useMeetingControlsHeight";
import { MeetingControlButton } from "@/components/meeting/MeetingControlButton";
import type { SidePanelType } from "./types";

interface ControlsBarProps {
  connected: boolean;
  micOn: boolean;
  camOn: boolean;
  handRaised: boolean;
  isFullscreen: boolean;
  overflowOpen: boolean;
  sidePanel: SidePanelType;
  participantCount: number;
  // Simplified (Groupy) meetings omit the chat control.
  simplified?: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleHand: () => void;
  onToggleReactions: () => void;
  onToggleFullscreen: () => void;
  onToggleSidePanel: (panel: NonNullable<SidePanelType>) => void;
  onToggleOverflow: () => void;
  onLeave: () => void;
}

export function ControlsBar({
  connected, micOn, camOn, handRaised, isFullscreen, overflowOpen,
  sidePanel, participantCount, simplified,
  onToggleMic, onToggleCam, onToggleHand, onToggleReactions,
  onToggleFullscreen, onToggleSidePanel, onToggleOverflow, onLeave,
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
        "meeting-status absolute left-3 flex items-center gap-1.5 text-[11px]",
        connected ? "text-success" : "text-muted-foreground",
      )}>
        <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-success" : "bg-muted-foreground")} />
        <span className="meeting-status-label">{connected ? "Connected" : "Connecting..."}</span>
      </div>

      <MeetingControlButton
        onClick={onToggleMic}
        active={!micOn}
        danger={!micOn}
        label={micOn ? "Mute" : "Unmute"}
      >
        {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </MeetingControlButton>

      <MeetingControlButton
        onClick={onToggleCam}
        active={!camOn}
        danger={!camOn}
        label={camOn ? "Turn off camera" : "Turn on camera"}
      >
        {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </MeetingControlButton>

      <MeetingControlButton
        onClick={onToggleHand}
        active={handRaised}
        label={handRaised ? "Lower hand" : "Raise hand"}
        hideOnMobile
      >
        <Hand className="h-5 w-5" />
      </MeetingControlButton>

      <MeetingControlButton onClick={onToggleReactions} label="React" hideOnMobile>
        <Smile className="h-5 w-5" />
      </MeetingControlButton>

      {!simplified && (
        <MeetingControlButton
          onClick={() => onToggleSidePanel("chat")}
          active={sidePanel === "chat"}
          label="Chat"
          hideOnMobile
        >
          <MessageSquare className="h-5 w-5" />
        </MeetingControlButton>
      )}

      <MeetingControlButton
        onClick={onToggleFullscreen}
        active={isFullscreen}
        label={isFullscreen ? "Exit full screen" : "Full screen"}
        hideOnMobile
      >
        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </MeetingControlButton>

      <MeetingControlButton
        onClick={() => onToggleSidePanel("participants")}
        active={sidePanel === "participants"}
        label={participantCount > 0 ? `People (${participantCount})` : "People"}
        badge={participantCount}
        hideOnMobile
      >
        <Users className="h-5 w-5" />
      </MeetingControlButton>

      <MeetingControlButton onClick={onToggleOverflow} active={overflowOpen} label="More" mobileOnly>
        <MoreHorizontal className="h-5 w-5" />
      </MeetingControlButton>

      <MeetingControlButton onClick={onLeave} danger wide label="Leave meeting">
        <PhoneOff className="h-5 w-5" />
      </MeetingControlButton>
    </div>
  );
}