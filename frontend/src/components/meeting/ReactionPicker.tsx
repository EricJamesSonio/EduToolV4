"use client";

import { useCallback, useRef, useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const RATE_LIMIT_MAX      = 3;    // max reactions allowed …
const RATE_LIMIT_WINDOW   = 5000; // … within this many ms
const COOLDOWN_LABEL_SECS = 5;    // shown in the "too many" message

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReactionPickerProps {
  reactions: readonly string[];
  onPick: (emoji: string) => void;
  onClose: () => void;
}

// ── Hook: frontend rate limiter ───────────────────────────────────────────────
function useReactionRateLimit() {
  const timestamps   = useRef<number[]>([]);
  const [throttled, setThrottled] = useState(false);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tryFire = useCallback((fn: () => void) => {
    const now  = Date.now();
    // Drop timestamps older than the window
    timestamps.current = timestamps.current.filter((t) => now - t < RATE_LIMIT_WINDOW);

    if (timestamps.current.length >= RATE_LIMIT_MAX) {
      // Already throttled — how long until the oldest stamp expires?
      const oldestExpiry = timestamps.current[0] + RATE_LIMIT_WINDOW;
      const remaining    = oldestExpiry - now;

      setThrottled(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setThrottled(false), remaining);
      return;
    }

    timestamps.current.push(now);
    fn();
  }, []);

  return { throttled, tryFire };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ReactionPicker({ reactions, onPick, onClose }: ReactionPickerProps) {
  const { throttled, tryFire } = useReactionRateLimit();

  const handlePick = (emoji: string) => {
    // NOTE: onClose is intentionally NOT called here.
    // Closing the picker on every pick would unmount this component and
    // destroy the rate-limiter's timestamp ref, resetting the counter.
    // The picker stays open so the limiter can accumulate clicks.
    // The parent can close it via its own toggle button.
    tryFire(() => {
      onPick(emoji);
    });
  };

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
      {/* Rate-limit notice */}
      {throttled && (
        <div className="bg-warning/15 border border-warning/40 rounded-full px-4 py-1 text-xs font-semibold text-warning-foreground whitespace-nowrap backdrop-blur" style={{ animation: "fadeInUp 0.15s ease" }}>
          Too many reactions — wait a moment 😅
        </div>
      )}

      {/* Emoji buttons */}
      <div
        className="bg-card border border-border/60 rounded-xl px-3 py-2 flex gap-2 shadow-lg"
        style={{ opacity: throttled ? 0.5 : 1, transition: "opacity 0.2s" }}
      >
        {reactions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handlePick(emoji)}
            disabled={throttled}
            title={throttled ? `Too many reactions — slow down!` : undefined}
            className="text-2xl transition-transform disabled:cursor-not-allowed"
            style={{
              transform:  throttled ? "scale(0.85)" : undefined,
              filter:     throttled ? "grayscale(0.6)" : undefined,
              transition: "transform 0.15s, filter 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!throttled) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "";
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}