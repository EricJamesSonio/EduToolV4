"use client";

import {
  Mic, MicOff, Video, VideoOff, Hand,
  MessageSquare, Users, LogOut, Smile, Maximize, Minimize, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SidePanelType } from "./types";

interface ControlBtn {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  label: string;
  hideOnMobile?: boolean;
  mobileOnly?: boolean;
  children: React.ReactNode;
}

function Btn({ onClick, active, danger, label, hideOnMobile, mobileOnly, children }: ControlBtn) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "meeting-ctrl-btn flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
        active && !danger && "text-primary bg-primary/10",
        danger && "text-destructive hover:bg-destructive/10",
        !active && !danger && "text-muted-foreground hover:bg-muted hover:text-foreground",
        hideOnMobile && "meeting-ctrl-btn--hide-mobile",
        mobileOnly && "meeting-ctrl-btn--mobile-only",
      )}
    >
      {children}
      {label}
    </button>
  );
}

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
  return (
    <div className="meeting-controls relative shrink-0 flex items-center justify-center flex-wrap gap-1 border-t border-border bg-card px-2 py-1">
      {/* Connection status */}
      <div className={cn(
        "meeting-status absolute left-3 flex items-center gap-1.5 text-[11px]",
        connected ? "text-success" : "text-muted-foreground",
      )}>
        <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-success" : "bg-muted-foreground")} />
        <span className="meeting-status-label">{connected ? "Connected" : "Connecting..."}</span>
      </div>

      <Btn onClick={onToggleMic} danger={!micOn} label={micOn ? "Mute" : "Unmute"}>
        {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Btn>

      <Btn onClick={onToggleCam} danger={!camOn} label={camOn ? "Stop Video" : "Start Video"}>
        {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Btn>

      <Btn onClick={onToggleHand} active={handRaised} label={handRaised ? "Lower Hand" : "Raise Hand"} hideOnMobile>
        <Hand className="h-5 w-5" />
      </Btn>

      <Btn onClick={onToggleReactions} label="React" hideOnMobile>
        <Smile className="h-5 w-5" />
      </Btn>

      {!simplified && (
        <Btn onClick={() => onToggleSidePanel("chat")} active={sidePanel === "chat"} label="Chat" hideOnMobile>
          <MessageSquare className="h-5 w-5" />
        </Btn>
      )}

      <Btn onClick={onToggleFullscreen} active={isFullscreen} label={isFullscreen ? "Exit Full" : "Full Screen"} hideOnMobile>
        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </Btn>

      <Btn onClick={() => onToggleSidePanel("participants")} active={sidePanel === "participants"} label={participantCount > 0 ? `${participantCount}` : "People"} hideOnMobile>
        <Users className="h-5 w-5" />
      </Btn>

      <Btn onClick={onToggleOverflow} active={overflowOpen} label="More" mobileOnly>
        <MoreHorizontal className="h-5 w-5" />
      </Btn>

      <Btn onClick={onLeave} danger label="Leave">
        <LogOut className="h-5 w-5" />
      </Btn>
    </div>
  );
}
