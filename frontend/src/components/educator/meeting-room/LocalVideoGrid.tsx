"use client";

import { VideoOff } from "lucide-react";

interface LocalVideoGridProps {
  camOn: boolean;
  micOn: boolean;
  onCollapse: () => void;
}

export function LocalVideoGrid({ camOn, micOn, onCollapse }: LocalVideoGridProps) {
  return (
    <div
      id="local-video-grid"
      className="rounded-lg bg-zinc-800 w-full min-h-[200px] border border-zinc-700 overflow-hidden relative"
    >
      {!camOn && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 pointer-events-none">
          <VideoOff className="h-6 w-6" />
        </div>
      )}
      <div className="absolute top-0 inset-x-0 h-8 flex items-center justify-between px-2 bg-gradient-to-b from-black/50 to-transparent z-10">
        <span className="text-xs text-zinc-300">Your Camera</span>
        <button
          onClick={onCollapse}
          className="h-6 w-6 flex items-center justify-center rounded-md bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>
      <div className="absolute bottom-2 left-2 text-xs text-zinc-400 bg-zinc-900/60 px-1.5 py-0.5 rounded pointer-events-none z-10">
        You {micOn ? "" : "🔇"}
      </div>
    </div>
  );
}