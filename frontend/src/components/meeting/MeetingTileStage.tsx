"use client";

import { MicOff, VideoOff } from "lucide-react";
import { getMeetingTileRects } from "./meeting-tile-layout";

export interface MeetingTile {
  key: string;
  domId: string;
  label?: string;
  camOff?: boolean;
  micOff?: boolean;
  onClose?: () => void;
}

interface MeetingTileStageProps {
  tiles: MeetingTile[];
  maxCols?: number;
}

export function MeetingTileStage({ tiles, maxCols }: MeetingTileStageProps) {
  const rects = getMeetingTileRects(tiles.length, maxCols);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {tiles.map((tile, index) => {
        const rect = rects[index];
        if (!rect) return null;

        return (
          <div
            key={tile.key}
            className="absolute p-0.5 transition-all duration-300 ease-out"
            style={{
              left: `${rect.x}%`,
              top: `${rect.y}%`,
              width: `${rect.w}%`,
              height: `${rect.h}%`,
            }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-lg bg-zinc-800">
              <div id={tile.domId} className="absolute inset-0" />

              {tile.camOff && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-800 text-zinc-500 pointer-events-none">
                  <VideoOff className="h-8 w-8" />
                </div>
              )}

              {(tile.label || tile.micOff) && (
                <div className="absolute bottom-1.5 left-1.5 z-20 flex items-center gap-1 rounded bg-black/55 px-1.5 py-0.5 text-[11px] text-white pointer-events-none">
                  {tile.micOff && <MicOff className="h-3 w-3 text-red-400" />}
                  {tile.label && <span>{tile.label}</span>}
                </div>
              )}

              {tile.onClose && (
                <button
                  type="button"
                  onClick={tile.onClose}
                  aria-label="Collapse camera"
                  className="absolute top-1.5 right-1.5 z-30 flex h-6 w-6 items-center justify-center rounded-md bg-black/50 text-sm text-white hover:bg-black/70"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}