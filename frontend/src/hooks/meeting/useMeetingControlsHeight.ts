"use client";

import { useEffect } from "react";

/**
 * Publishes --meeting-controls-h: the distance from the bottom of the
 * viewport to the top of the controls bar. In full screen that equals the
 * bar height; when the room sits inside the page layout it is larger, so
 * overlays that stop above the bar still line up with it.
 */
export function useMeetingControlsHeight(
  ref: React.RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const root = document.documentElement;
    let last = "";

    const apply = () => {
      const rect = el.getBoundingClientRect();
      const offset = Math.max(0, Math.round(window.innerHeight - rect.top));
      const value = `${offset}px`;
      if (value === last) return;
      last = value;
      root.style.setProperty("--meeting-controls-h", value);
    };

    apply();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    resizeObserver?.observe(el);

    const parent = el.parentElement;
    const mutationObserver =
      parent && typeof MutationObserver !== "undefined"
        ? new MutationObserver(apply)
        : null;
    if (parent) {
      mutationObserver?.observe(parent, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }

    window.addEventListener("resize", apply);
    window.addEventListener("scroll", apply, true);

    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("resize", apply);
      window.removeEventListener("scroll", apply, true);
      root.style.removeProperty("--meeting-controls-h");
    };
  }, [ref]);
}