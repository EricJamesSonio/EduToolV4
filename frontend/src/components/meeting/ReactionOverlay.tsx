"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WalkingEmoji {
  id: string;
  emoji: string;
  /** vertical % position (10–70) so it stays in upper area */
  top: number;
  /** size variant */
  size: number;
}

interface HandRaisePopup {
  id: string;
  name: string;
  /** random left % (20–70) */
  left: number;
  /** random top % (30–60) */
  top: number;
}

interface ReactionOverlayProps {
  /** Call this with an emoji string whenever a reaction is received from socket */
  incomingEmoji: { emoji: string; id: string } | null;
  /** Call this with a name whenever someone raises their hand */
  incomingHandRaise: { name: string; userId: string } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJI_DURATION_MS  = 3500;
const HAND_DURATION_MS   = 4000;
const MAX_WALKING_EMOJIS = 12;

// ─── Component ────────────────────────────────────────────────────────────────

export function ReactionOverlay({
  incomingEmoji,
  incomingHandRaise,
}: ReactionOverlayProps) {
  const [walkingEmojis, setWalkingEmojis] = useState<WalkingEmoji[]>([]);
  const [handPopups,    setHandPopups]    = useState<HandRaisePopup[]>([]);
  const prevEmojiRef     = useRef<string | null>(null);
  const prevHandRaiseRef = useRef<string | null>(null);

  // ── Spawn walking emoji ───────────────────────────────────────────────────
  useEffect(() => {
    if (!incomingEmoji) return;
    if (prevEmojiRef.current === incomingEmoji.id) return;
    prevEmojiRef.current = incomingEmoji.id;

    const entry: WalkingEmoji = {
      id:    incomingEmoji.id,
      emoji: incomingEmoji.emoji,
      top:   10 + Math.random() * 55,   // 10%–65% from top
      size:  28 + Math.random() * 20,   // 28px–48px
    };

    setWalkingEmojis((prev) => {
      const next = [...prev, entry];
      return next.length > MAX_WALKING_EMOJIS ? next.slice(-MAX_WALKING_EMOJIS) : next;
    });

    // auto-remove after animation completes
    setTimeout(() => {
      setWalkingEmojis((prev) => prev.filter((e) => e.id !== entry.id));
    }, EMOJI_DURATION_MS + 200);
  }, [incomingEmoji]);

  // ── Spawn hand-raise popup ─────────────────────────────────────────────────
  useEffect(() => {
    if (!incomingHandRaise) return;
    if (prevHandRaiseRef.current === incomingHandRaise.userId) return;
    prevHandRaiseRef.current = incomingHandRaise.userId;

    const popup: HandRaisePopup = {
      id:   `${incomingHandRaise.userId}-${Date.now()}`,
      name: incomingHandRaise.name,
      left: 20 + Math.random() * 50,   // 20%–70% from left
      top:  30 + Math.random() * 30,   // 30%–60% from top
    };

    setHandPopups((prev) => [...prev, popup]);

    setTimeout(() => {
      setHandPopups((prev) => prev.filter((p) => p.id !== popup.id));
    }, HAND_DURATION_MS + 300);
  }, [incomingHandRaise]);

  return (
    <>
      {/* ── Inline keyframes ── */}
      <style>{`
        @keyframes emoji-walk {
          0%   { transform: translateX(-80px) scale(0.6); opacity: 0; }
          8%   { opacity: 1; transform: translateX(0px) scale(1); }
          92%  { opacity: 1; }
          100% { transform: translateX(calc(100vw + 80px)) scale(0.85); opacity: 0; }
        }
        @keyframes hand-pop {
          0%   { opacity: 0; transform: scale(0.4) translateY(20px); }
          15%  { opacity: 1; transform: scale(1.15) translateY(0px); }
          25%  { transform: scale(1) translateY(0px); }
          75%  { opacity: 1; transform: scale(1) translateY(0px); }
          100% { opacity: 0; transform: scale(0.8) translateY(-16px); }
        }
        @keyframes hand-wave {
          0%,100% { transform: rotate(0deg); }
          25%     { transform: rotate(20deg); }
          75%     { transform: rotate(-10deg); }
        }
      `}</style>

      {/* ── Walking emojis layer ── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ zIndex: 40 }}
        aria-hidden
      >
        {walkingEmojis.map((e) => (
          <span
            key={e.id}
            style={{
              position:    "absolute",
              top:         `${e.top}%`,
              left:        0,
              fontSize:    `${e.size}px`,
              lineHeight:  1,
              animation:   `emoji-walk ${EMOJI_DURATION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
              userSelect:  "none",
              willChange:  "transform, opacity",
              filter:      "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
            }}
          >
            {e.emoji}
          </span>
        ))}
      </div>

      {/* ── Hand-raise popups layer ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 41 }}
        aria-hidden
      >
        {handPopups.map((p) => (
          <div
            key={p.id}
            style={{
              position:  "absolute",
              left:      `${p.left}%`,
              top:       `${p.top}%`,
              transform: "translate(-50%, -50%)",
              animation: `hand-pop ${HAND_DURATION_MS}ms ease forwards`,
              userSelect: "none",
            }}
          >
            {/* Card */}
            <div
              style={{
                display:       "flex",
                alignItems:    "center",
                gap:           "10px",
                background:    "rgba(17, 17, 27, 0.88)",
                border:        "1.5px solid rgba(255,255,255,0.15)",
                borderRadius:  "999px",
                padding:       "10px 20px 10px 14px",
                backdropFilter:"blur(12px)",
                boxShadow:     "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
                whiteSpace:    "nowrap",
              }}
            >
              {/* waving hand */}
              <span
                style={{
                  fontSize:        "26px",
                  display:         "inline-block",
                  animation:       `hand-wave 0.7s ease-in-out 3`,
                  transformOrigin: "bottom center",
                }}
              >
                ✋
              </span>
              {/* name */}
              <span
                style={{
                  color:      "#ffffff",
                  fontSize:   "14px",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                }}
              >
                {p.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}