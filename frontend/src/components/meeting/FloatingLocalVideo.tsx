"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MicOff, VideoOff } from "lucide-react";

interface FloatingLocalVideoProps {
  videoId: string;
  camOn: boolean;
  micOn: boolean;
  zClass?: string;
}

interface Pos {
  x: number;
  y: number;
}

export function FloatingLocalVideo({
  videoId,
  camOn,
  micOn,
  zClass = "z-20",
}: FloatingLocalVideoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ ox: number; oy: number } | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);

  const clamp = useCallback((x: number, y: number): Pos => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return { x, y };
    return {
      x: Math.min(Math.max(0, x), Math.max(0, parent.clientWidth - el.offsetWidth)),
      y: Math.min(Math.max(0, y), Math.max(0, parent.clientHeight - el.offsetHeight)),
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      setPos((prev) => (prev ? clamp(prev.x, prev.y) : prev));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const rect = el.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    el.setPointerCapture(e.pointerId);
    dragRef.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top };
    setPos({ x: rect.left - parentRect.left, y: rect.top - parentRect.top });
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const parent = ref.current?.parentElement;
    if (!drag || !parent) return;

    const parentRect = parent.getBoundingClientRect();
    setPos(
      clamp(
        e.clientX - drag.ox - parentRect.left,
        e.clientY - drag.oy - parentRect.top,
      ),
    );
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    setDragging(false);
    const el = ref.current;
    if (el && el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
  };

  const posStyle: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y }
    : { right: 8, bottom: 8 };

  return (
    <div
      ref={ref}
      style={{ ...posStyle, touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`absolute h-32 w-24 select-none overflow-hidden rounded-xl border border-zinc-600 bg-zinc-800 shadow-xl ${
        dragging ? "cursor-grabbing ring-2 ring-white/40" : "cursor-grab"
      } ${zClass}`}
    >
      <div id={videoId} className="absolute inset-0" />

      {!camOn && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-800 text-zinc-500 pointer-events-none">
          <VideoOff className="h-5 w-5" />
        </div>
      )}

      <div className="absolute bottom-1 left-1 z-20 flex items-center gap-1 rounded bg-black/55 px-1 py-0.5 text-[9px] leading-none text-white pointer-events-none">
        {!micOn && <MicOff className="h-2.5 w-2.5 text-red-400" />}
        <span>You</span>
      </div>
    </div>
  );
}