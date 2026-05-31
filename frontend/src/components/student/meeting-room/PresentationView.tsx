"use client";

import PresentationOverlay from "@/components/meeting/PresentationOverlay";
import { DraggableVideo } from "./DraggableVideo";
import type { Presentation } from "@/types/educator/presentation.types";

interface RemoteUser {
  uid: string | number;
  videoTrack?: { play: (id: string) => void };
}

interface PresentationViewProps {
  presentation: Presentation | null | undefined;
  currentSlide: number;
  presentationId: string | null | undefined;
  isLoading: boolean;
  isError: boolean;
  remoteUsers: RemoteUser[];
  isPresenting: boolean;
}

export function PresentationView({
  presentation, currentSlide, presentationId,
  isLoading, isError, remoteUsers, isPresenting,
}: PresentationViewProps) {
  return (
    <div className="flex-1 relative overflow-hidden">
      {presentationId ? (
        <PresentationOverlay
          presentation={presentation}
          currentSlideIndex={currentSlide}
          error={isError}
          isLoading={isLoading}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-zinc-950">
          <p className="text-zinc-500 text-sm">Educator is preparing the presentation...</p>
        </div>
      )}

      {/* Remote user PIPs */}
      {remoteUsers.map((user) => (
        <DraggableVideo key={String(user.uid)} className="w-52 h-36 z-20">
          <div
            id={`remote-${user.uid}`}
            className="w-full h-full rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg"
          />
        </DraggableVideo>
      ))}

      {/* Local video PIP */}
      <DraggableVideo key={`local-pip-${isPresenting}`} className="w-52 h-36 z-20">
        <div
          id="local-video-pip"
          className="w-full h-full rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg"
        />
      </DraggableVideo>
    </div>
  );
}