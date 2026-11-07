"use client";

import { useEffect } from "react";

export function useMeetingControlsHeight(
  ref: React.RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const root = document.documentElement;
    const apply = () => {
      root.style.setProperty("--meeting-controls-h", `${el.offsetHeight}px`);
    };

    apply();

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    observer?.observe(el);
    window.addEventListener("resize", apply);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", apply);
      root.style.removeProperty("--meeting-controls-h");
    };
  }, [ref]);
}