"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, MicOff, Video, VideoOff } from "lucide-react";
import {
  readMeetingMediaPrefs,
  writeMeetingMediaPrefs,
} from "@/utils/meetingMediaPrefs";
import { MeetingControlButton } from "./MeetingControlButton";

interface MeetingPreJoinProps {
  userName: string;
  roleLabel: string;
  onJoin: () => void;
  onCancel: () => void;
}

export function MeetingPreJoin({
  userName,
  roleLabel,
  onJoin,
  onCancel,
}: MeetingPreJoinProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [micOn, setMicOn] = useState(() => readMeetingMediaPrefs().micOn);
  const [camOn, setCamOn] = useState(() => readMeetingMediaPrefs().camOn);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (!camOn) {
      stopStream();
      setPreviewError(null);
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setPreviewError("Camera preview is not available in this browser.");
      return;
    }

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setPreviewError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewError("Camera is blocked or unavailable. Check your browser permissions.");
        }
      });

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [camOn]);

  const handleToggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    writeMeetingMediaPrefs({ micOn: next });
  };

  const handleToggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    writeMeetingMediaPrefs({ camOn: next });
  };

  const handleJoin = () => {
    stopStream();
    onJoin();
  };

  const showVideo = camOn && !previewError;
  const initial = userName.trim()[0]?.toUpperCase() ?? "?";

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 p-4 md:flex-row md:gap-10 md:p-8">
        <div className="w-full md:flex-1">
          <div className="relative aspect-[4/5] max-h-[55vh] w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl ring-1 ring-border md:aspect-video md:max-h-none">
            {showVideo ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full -scale-x-100 object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-3xl font-semibold text-secondary-foreground">
                  {initial}
                </div>
                <p className="text-sm text-zinc-400">
                  {previewError ?? "Camera is off"}
                </p>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-3">
              <MeetingControlButton
                onClick={handleToggleMic}
                active={!micOn}
                danger={!micOn}
                label={micOn ? "Turn off microphone" : "Turn on microphone"}
              >
                {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </MeetingControlButton>

              <MeetingControlButton
                onClick={handleToggleCam}
                active={!camOn}
                danger={!camOn}
                label={camOn ? "Turn off camera" : "Turn on camera"}
              >
                {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </MeetingControlButton>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center shadow-xl md:w-80 md:items-start md:text-left">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Ready to join?</h1>
            <div className="mt-2 flex items-center justify-center gap-2 md:justify-start">
              <span className="text-sm font-medium text-foreground">{userName}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                {roleLabel}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Check your camera and microphone before you enter.
            </p>
          </div>

          <button
            type="button"
            onClick={handleJoin}
            className="h-11 w-full rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/90"
          >
            Join now
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}