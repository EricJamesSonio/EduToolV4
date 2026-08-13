"use client";

import {
  Mic, MicOff, Video, VideoOff, Hand, MessageSquare,
  Users, LogOut, Smile, UserPlus, Monitor, Maximize, Minimize, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ControlBtn } from "./ControlBtn";
import type { SidePanelType } from "./types";

interface ControlsBarProps {
  connected: boolean;
  micOn: boolean;
  camOn: boolean;
  handRaised: boolean;
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
  onToggleHand: () => void;
  onToggleReactions: () => void;
  onTogglePresentation: () => void;
  onToggleFullscreen: () => void;
  onToggleSidePanel: (panel: NonNullable<SidePanelType>) => void;
  onToggleOverflow: () => void;
  onLeave: () => void;
  onEnd: () => void;
}

export function ControlsBar({
  connected, micOn, camOn, handRaised,
  isPresenting, isFullscreen, showReactions, overflowOpen,
  sidePanel, participantCount, pendingRequestCount,
  isEndingMeeting, simplified,
  onToggleMic, onToggleCam, onToggleHand, onToggleReactions,
  onTogglePresentation, onToggleFullscreen, onToggleSidePanel, onToggleOverflow,
  onLeave, onEnd,
}: ControlsBarProps) {
  return (
    <div className="meeting-controls relative shrink-0 flex items-center justify-center flex-wrap gap-1 border-t border-border bg-card px-2 py-1">
      {/* Connection status */}
      <div className={cn(
        "meeting-status absolute left-3 flex items-center gap-1.5 text-[10px]",
        connected ? "text-success" : "text-muted-foreground",
      )}>
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", connected ? "bg-success" : "bg-muted-foreground")} />
        <span className="meeting-status-label">{connected ? "Connected" : "Connecting..."}</span>
      </div>

      <ControlBtn onClick={onToggleMic} active={!micOn} danger={!micOn} label={micOn ? "Mute" : "Unmute"}>
        {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </ControlBtn>

      <ControlBtn onClick={onToggleCam} active={!camOn} danger={!camOn} label={camOn ? "Stop Video" : "Start Video"}>
        {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </ControlBtn>

      <ControlBtn onClick={onToggleHand} active={handRaised} label={handRaised ? "Lower Hand" : "Raise Hand"} hideOnMobile>
        <Hand className="h-5 w-5" />
      </ControlBtn>

      <ControlBtn onClick={onToggleReactions} active={showReactions} label="React" hideOnMobile>
        <Smile className="h-5 w-5" />
      </ControlBtn>

      {!simplified && (
        <ControlBtn
          onClick={onTogglePresentation}
          active={isPresenting}
          label={isPresenting ? "Stop" : "Present"}
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
        label={isFullscreen ? "Exit Full" : "Fullscreen"}
        hideOnMobile
      >
        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </ControlBtn>

      <ControlBtn
        onClick={() => onToggleSidePanel("participants")}
        active={sidePanel === "participants"}
        label={participantCount > 0 ? `${participantCount}` : "People"}
        hideOnMobile
      >
        <Users className="h-5 w-5" />
      </ControlBtn>

      {!simplified && (
        <div className="relative">
          <ControlBtn
            onClick={() => onToggleSidePanel("join-requests")}
            active={sidePanel === "join-requests"}
            label="Requests"
            hideOnMobile
          >
            <UserPlus className="h-5 w-5" />
          </ControlBtn>
          {pendingRequestCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-warning text-warning-foreground text-[9px] font-bold pointer-events-none">
              {pendingRequestCount}
            </span>
          )}
        </div>
      )}

      <ControlBtn onClick={onToggleOverflow} active={overflowOpen} label="More" mobileOnly>
        <MoreHorizontal className="h-5 w-5" />
      </ControlBtn>

      <ControlBtn onClick={onLeave} label="Leave">
        <LogOut className="h-5 w-5" />
      </ControlBtn>

      <ControlBtn onClick={onEnd} disabled={isEndingMeeting} danger label={isEndingMeeting ? "Ending..." : "End"}>
        <LogOut className="h-5 w-5" />
      </ControlBtn>
    </div>
  );
}