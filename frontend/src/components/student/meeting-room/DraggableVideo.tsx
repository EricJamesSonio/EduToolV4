"use client";

import { useEffect, useRef, useState } from "react";

interface DraggableVideoProps {
  children?: React.ReactNode;
  className?: string;
}

export function DraggableVideo({ children, className }: DraggableVideoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ ox: number; oy: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onDown = (e: MouseEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      drag.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top };
      const parent = el.parentElement;
      if (!parent) return;
      const prect = parent.getBoundingClientRect();
      setPos({ x: rect.left - prect.left, y: rect.top - prect.top });
    };

    const onMove = (e: MouseEvent) => {
      if (!drag.current) return;
      e.preventDefault();
      const parent = el.parentElement;
      if (!parent) return;
      const prect = parent.getBoundingClientRect();
      setPos({
        x: Math.max(0, Math.min(e.clientX - drag.current.ox - prect.left, prect.width - el.offsetWidth)),
        y: Math.max(0, Math.min(e.clientY - drag.current.oy - prect.top, prect.height - el.offsetHeight)),
      });
    };

    const onUp = () => { drag.current = null; };

    const onTouchDown = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const rect = el.getBoundingClientRect();
      drag.current = { ox: t.clientX - rect.left, oy: t.clientY - rect.top };
      const parent = el.parentElement;
      if (!parent) return;
      const prect = parent.getBoundingClientRect();
      setPos({ x: rect.left - prect.left, y: rect.top - prect.top });
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!drag.current) return;
      const t = e.touches[0];
      if (!t) return;
      const parent = el.parentElement;
      if (!parent) return;
      const prect = parent.getBoundingClientRect();
      setPos({
        x: Math.max(0, Math.min(t.clientX - drag.current.ox - prect.left, prect.width - el.offsetWidth)),
        y: Math.max(0, Math.min(t.clientY - drag.current.oy - prect.top, prect.height - el.offsetHeight)),
      });
    };

    const onTouchEnd = () => { drag.current = null; };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    el.addEventListener("touchstart", onTouchDown, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      el.removeEventListener("touchstart", onTouchDown);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: "absolute",
        cursor: "grab",
        ...(pos === null ? { right: 16, bottom: 16 } : { left: pos.x, top: pos.y }),
      }}
    >
      {children}
    </div>
  );
}