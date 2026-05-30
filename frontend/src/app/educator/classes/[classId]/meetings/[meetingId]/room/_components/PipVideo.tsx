"use client";

import { useEffect, useRef, useState } from "react";
import { VideoOff } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PipSize { w: number; h: number }
interface PipPos  { x: number; y: number }
interface DragState   { ox: number; oy: number }
interface ResizeState { startX: number; startY: number; startW: number; startH: number }

type ResizeCorner = "se" | "sw" | "ne" | "nw" | "e" | "w" | "n" | "s";

export interface PipVideoProps {
  /** DOM id Agora plays the local video track into */
  videoId: string;
  camOn: boolean;
  micOn: boolean;
  /** z-index utility class, e.g. "z-20" */
  zClass?: string;
  /** Called when user chooses "Full Display" from the context menu */
  onExpand: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a size appropriate for the current viewport */
function getDefaultSize(): PipSize {
  if (typeof window === "undefined") return { w: 240, h: 160 };
  if (window.innerWidth < 480) return { w: 120, h: 80  };
  if (window.innerWidth < 768) return { w: 160, h: 108 };
  return { w: 240, h: 160 };
}

// ─── Resize handle map ────────────────────────────────────────────────────────

const CORNERS: ResizeCorner[] = ["se", "sw", "ne", "nw", "e", "w", "n", "s"];

const cornerClass: Record<ResizeCorner, string> = {
  se: "bottom-0 right-0 w-4 h-4 cursor-se-resize rounded-bl",
  sw: "bottom-0 left-0  w-4 h-4 cursor-sw-resize rounded-br",
  ne: "top-0    right-0 w-4 h-4 cursor-ne-resize rounded-bl",
  nw: "top-0    left-0  w-4 h-4 cursor-nw-resize rounded-br",
  e:  "top-0 bottom-0 right-0  w-1.5 cursor-e-resize",
  w:  "top-0 bottom-0 left-0   w-1.5 cursor-w-resize",
  n:  "left-0 right-0 top-0    h-1.5 cursor-n-resize",
  s:  "left-0 right-0 bottom-0 h-1.5 cursor-s-resize",
};

// ─── Hook: drag (mouse + touch) ───────────────────────────────────────────────

function usePipDrag(
  pipRef: React.RefObject<HTMLDivElement | null>,
  pos: PipPos | null,
  setPos: (p: PipPos) => void,
  enabled: boolean,
) {
  const dragRef = useRef<DragState | null>(null);

  /** Shared move logic for both mouse and touch */
  const applyMove = (clientX: number, clientY: number) => {
    const el = pipRef.current;
    if (!dragRef.current || !el?.parentElement) return;
    const p = el.parentElement.getBoundingClientRect();
    setPos({
      x: Math.max(0, Math.min(clientX - dragRef.current.ox - p.left, p.width  - el.offsetWidth)),
      y: Math.max(0, Math.min(clientY - dragRef.current.oy - p.top,  p.height - el.offsetHeight)),
    });
  };

  /** Initialise offset from current layout position */
  const initDrag = (clientX: number, clientY: number) => {
    const el = pipRef.current;
    if (!el?.parentElement) return false;
    const rect  = el.getBoundingClientRect();
    const prect = el.parentElement.getBoundingClientRect();
    dragRef.current = { ox: clientX - rect.left, oy: clientY - rect.top };
    if (pos === null) setPos({ x: rect.left - prect.left, y: rect.top - prect.top });
    return true;
  };

  // ── Mouse ──
  const onMouseDown = (e: React.MouseEvent) => {
    if (!enabled) return;
    if ((e.target as HTMLElement).closest("[data-pip-control]")) return;
    e.preventDefault();
    if (!initDrag(e.clientX, e.clientY)) return;

    const onMove = (ev: MouseEvent) => applyMove(ev.clientX, ev.clientY);
    const onUp   = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  };

  // ── Touch ──
  const onTouchStart = (e: React.TouchEvent) => {
    if (!enabled) return;
    if ((e.target as HTMLElement).closest("[data-pip-control]")) return;
    const t = e.touches[0];
    if (!t || !initDrag(t.clientX, t.clientY)) return;

    const onMove = (ev: TouchEvent) => {
      const touch = ev.touches[0];
      if (touch) applyMove(touch.clientX, touch.clientY);
    };
    const onEnd = () => {
      dragRef.current = null;
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend",  onEnd);
    };
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend",  onEnd);
  };

  return { onMouseDown, onTouchStart };
}

// ─── Hook: resize ─────────────────────────────────────────────────────────────

function usePipResize(size: PipSize, setSize: (s: PipSize) => void) {
  const resizeRef = useRef<ResizeState | null>(null);

  const onResizeStart = (e: React.MouseEvent, corner: ResizeCorner) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const dx = ev.clientX - resizeRef.current.startX;
      const dy = ev.clientY - resizeRef.current.startY;
      let newW = resizeRef.current.startW;
      let newH = resizeRef.current.startH;
      if (corner.includes("e")) newW += dx;
      if (corner.includes("w")) newW -= dx;
      if (corner.includes("s")) newH += dy;
      if (corner.includes("n")) newH -= dy;
      setSize({ w: Math.max(80, newW), h: Math.max(60, newH) });
    };

    const onUp = () => {
      resizeRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  };

  return { onResizeStart };
}

// ─── PipVideo ─────────────────────────────────────────────────────────────────

export default function PipVideo({ videoId, camOn, micOn, zClass = "z-20", onExpand }: PipVideoProps) {
  const pipRef = useRef<HTMLDivElement>(null);

  const [pos,      setPos]      = useState<PipPos | null>(null);
  const [size,     setSize]     = useState<PipSize>(getDefaultSize);
  const [showMenu, setShowMenu] = useState(false);
  const [resizing, setResizing] = useState(false);

  // Update default size if window resizes while pos is still null (not yet dragged)
  useEffect(() => {
    const onResize = () => {
      if (pos === null) setSize(getDefaultSize());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos]);

  // When pos is set but window shrinks, clamp so PIP stays in view
  useEffect(() => {
    if (!pos || !pipRef.current?.parentElement) return;
    const p = pipRef.current.parentElement.getBoundingClientRect();
    const el = pipRef.current;
    const clampedX = Math.max(0, Math.min(pos.x, p.width  - el.offsetWidth));
    const clampedY = Math.max(0, Math.min(pos.y, p.height - el.offsetHeight));
    if (clampedX !== pos.x || clampedY !== pos.y) setPos({ x: clampedX, y: clampedY });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  const { onMouseDown, onTouchStart } = usePipDrag(pipRef, pos, setPos, !resizing);
  const { onResizeStart }             = usePipResize(size, setSize);

  const posStyle: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y }
    : { right: 8, bottom: 8 };

  const handleClick = () => {
    if (resizing) { setResizing(false); return; }
    setShowMenu((v) => !v);
  };

  return (
    <div
      ref={pipRef}
      id={videoId}
      style={{ width: size.w, height: size.h, ...posStyle }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={handleClick}
      className={`absolute rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg select-none cursor-grab active:cursor-grabbing ${zClass}`}
    >
      {/* Camera-off placeholder */}
      {!camOn && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 pointer-events-none z-0">
          <VideoOff className="h-5 w-5" />
        </div>
      )}

      {/* Name label */}
      <div className="absolute bottom-1 left-1.5 text-[9px] text-zinc-400 bg-zinc-900/60 px-1 py-0.5 rounded pointer-events-none z-0 leading-none">
        You {micOn ? "" : "🔇"}
      </div>

      {/* Context menu */}
      {showMenu && (
        <>
          <div
            data-pip-control
            className="absolute inset-0 bg-black/40 z-10"
            onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
            <button
              data-pip-control
              onClick={(e) => { e.stopPropagation(); onExpand(); setShowMenu(false); }}
              className="h-7 px-3 text-[11px] font-medium bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-lg border border-zinc-700 whitespace-nowrap"
            >
              Full Display
            </button>
            <button
              data-pip-control
              onClick={(e) => { e.stopPropagation(); setResizing(true); setShowMenu(false); }}
              className="h-7 px-3 text-[11px] font-medium bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-lg border border-zinc-700 whitespace-nowrap"
            >
              Resize
            </button>
          </div>
        </>
      )}

      {/* Resize handles — only on non-touch or when explicitly enabled */}
      {resizing && (
        <>
          {CORNERS.map((corner) => (
            <div
              key={corner}
              data-pip-control
              onMouseDown={(e) => onResizeStart(e, corner)}
              className={`absolute hover:bg-zinc-500/40 z-30 ${cornerClass[corner]}`}
            />
          ))}
          <div className="absolute top-1 inset-x-1 flex justify-center z-30 pointer-events-none">
            <span className="text-[8px] text-zinc-500 bg-zinc-900/70 px-1.5 py-0.5 rounded leading-none">
              Drag edges · click to close
            </span>
          </div>
        </>
      )}
    </div>
  );
}