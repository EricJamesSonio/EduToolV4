"use client";

import {
  Mic, MicOff, Video, VideoOff, Hand, MessageSquare,
  Users, LogOut, Smile, UserPlus, Monitor, Maximize, Minimize,
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
  sidePanel: SidePanelType;
  participantCount: number;
  pendingRequestCount: number;
  isEndingMeeting: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleHand: () => void;
  onToggleReactions: () => void;
  onTogglePresentation: () => void;
  onToggleFullscreen: () => void;
  onToggleSidePanel: (panel: NonNullable<SidePanelType>) => void;
  onLeave: () => void;
  onEnd: () => void;
}

export function ControlsBar({
  connected, micOn, camOn, handRaised,
  isPresenting, isFullscreen, showReactions,
  sidePanel, participantCount, pendingRequestCount,
  isEndingMeeting,
  onToggleMic, onToggleCam, onToggleHand, onToggleReactions,
  onTogglePresentation, onToggleFullscreen, onToggleSidePanel,
  onLeave, onEnd,
}: ControlsBarProps) {
  return (
    <div className="meeting-controls relative shrink-0 flex items-center justify-center flex-wrap gap-1 border-t border-zinc-800 bg-zinc-900 px-2 py-1">
      {/* Connection status */}
      <div className={cn(
        "meeting-status absolute left-3 flex items-center gap-1.5 text-[10px]",
        connected ? "text-emerald-400" : "text-zinc-500",
      )}>
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", connected ? "bg-emerald-400" : "bg-zinc-500")} />
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

      <ControlBtn
        onClick={onTogglePresentation}
        active={isPresenting}
        label={isPresenting ? "Stop" : "Present"}
      >
        <Monitor className="h-5 w-5" />
      </ControlBtn>

      <ControlBtn
        onClick={() => onToggleSidePanel("chat")}
        active={sidePanel === "chat"}
        label="Chat"
      >
        <MessageSquare className="h-5 w-5" />
      </ControlBtn>

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
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-zinc-950 pointer-events-none">
            {pendingRequestCount}
          </span>
        )}
      </div>

      <ControlBtn onClick={onLeave} label="Leave">
        <LogOut className="h-5 w-5" />
      </ControlBtn>

      <ControlBtn onClick={onEnd} disabled={isEndingMeeting} danger label={isEndingMeeting ? "Ending..." : "End"}>
        <LogOut className="h-5 w-5" />
      </ControlBtn>
    </div>
  );
}