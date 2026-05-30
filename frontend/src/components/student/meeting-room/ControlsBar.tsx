"use client";

import {
  Mic, MicOff, Video, VideoOff, Hand,
  MessageSquare, Users, LogOut, Smile, Maximize, Minimize,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SidePanelType } from "./types";

interface ControlBtn {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  label: string;
  children: React.ReactNode;
}

function Btn({ onClick, active, danger, label, children }: ControlBtn) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
        active && !danger && "text-primary bg-primary/10",
        danger && "text-red-400 hover:bg-red-900/30",
        !active && !danger && "text-zinc-300 hover:bg-zinc-800",
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
  sidePanel: SidePanelType;
  participantCount: number;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleHand: () => void;
  onToggleReactions: () => void;
  onToggleFullscreen: () => void;
  onToggleSidePanel: (panel: NonNullable<SidePanelType>) => void;
  onLeave: () => void;
}

export function ControlsBar({
  connected, micOn, camOn, handRaised, isFullscreen,
  sidePanel, participantCount,
  onToggleMic, onToggleCam, onToggleHand, onToggleReactions,
  onToggleFullscreen, onToggleSidePanel, onLeave,
}: ControlsBarProps) {
  return (
    <div className="relative h-16 flex items-center justify-center gap-3 border-t border-zinc-800 bg-zinc-900 px-4">
      {/* Connection status */}
      <div className={cn(
        "absolute left-4 flex items-center gap-1.5 text-[11px]",
        connected ? "text-emerald-400" : "text-zinc-500",
      )}>
        <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-emerald-400" : "bg-zinc-500")} />
        {connected ? "Connected" : "Connecting..."}
      </div>

      <Btn onClick={onToggleMic} danger={!micOn} label={micOn ? "Mute" : "Unmute"}>
        {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Btn>

      <Btn onClick={onToggleCam} danger={!camOn} label={camOn ? "Stop Video" : "Start Video"}>
        {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Btn>

      <Btn onClick={onToggleHand} active={handRaised} label={handRaised ? "Lower Hand" : "Raise Hand"}>
        <Hand className="h-5 w-5" />
      </Btn>

      <Btn onClick={onToggleReactions} label="React">
        <Smile className="h-5 w-5" />
      </Btn>

      <Btn onClick={() => onToggleSidePanel("chat")} active={sidePanel === "chat"} label="Chat">
        <MessageSquare className="h-5 w-5" />
      </Btn>

      <Btn onClick={onToggleFullscreen} active={isFullscreen} label={isFullscreen ? "Exit Full" : "Full Screen"}>
        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </Btn>

      <Btn onClick={() => onToggleSidePanel("participants")} active={sidePanel === "participants"} label={participantCount > 0 ? `${participantCount}` : "People"}>
        <Users className="h-5 w-5" />
      </Btn>

      <Btn onClick={onLeave} danger label="Leave">
        <LogOut className="h-5 w-5" />
      </Btn>
    </div>
  );
}