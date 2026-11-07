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
            className="absolute p-1 transition-all duration-300 ease-out"
            style={{
              left: `${rect.x}%`,
              top: `${rect.y}%`,
              width: `${rect.w}%`,
              height: `${rect.h}%`,
            }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-800 shadow-lg">
              <div id={tile.domId} className="absolute inset-0" />

              {tile.camOff && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-zinc-800">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <VideoOff className="h-7 w-7" />
                  </span>
                </div>
              )}

              {(tile.label || tile.micOff) && (
                <div className="pointer-events-none absolute bottom-2 left-2 z-20 flex items-center gap-1 rounded-full bg-secondary/95 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground shadow-sm">
                  {tile.micOff && <MicOff className="h-3 w-3 text-red-600" />}
                  {tile.label && <span>{tile.label}</span>}
                </div>
              )}

              {tile.onClose && (
                <button
                  type="button"
                  onClick={tile.onClose}
                  aria-label="Collapse camera"
                  className="absolute right-1.5 top-1.5 z-30 flex h-6 w-6 items-center justify-center rounded-md bg-secondary/90 text-sm text-secondary-foreground hover:bg-secondary"
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