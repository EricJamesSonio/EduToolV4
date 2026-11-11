"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingAutoEndCountdownProps {
  /** Seconds left as reported by the server; null or undefined hides the banner. */
  secondsLeft: number | null | undefined;
  /** Called once when the countdown reaches zero, so the page can refetch. */
  onExpire?: () => void;
  className?: string;
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function MeetingAutoEndCountdown({
  secondsLeft,
  onExpire,
  className,
}: MeetingAutoEndCountdownProps): React.JSX.Element | null {
  const [remaining, setRemaining] = useState<number | null>(
    secondsLeft ?? null,
  );
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    firedRef.current = false;

    if (secondsLeft == null) {
      setRemaining(null);
      return;
    }

    const startedAt = Date.now();

    const tick = (): void => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, secondsLeft - elapsed);
      setRemaining(left);

      if (left === 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  if (remaining === null) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900",
        className,
      )}
    >
      <Timer className="h-4 w-4 shrink-0" />
      <span>
        {remaining > 0
          ? `Nobody is in the room. This meeting ends automatically in ${formatClock(remaining)}. Join to keep it open.`
          : "Ending meeting..."}
      </span>
    </div>
  );
}