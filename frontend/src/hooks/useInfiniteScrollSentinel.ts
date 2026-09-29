"use client";

import { useEffect, useRef } from "react";

interface Options {
  enabled: boolean;
  onReach: () => void;
}

/** Fires `onReach` when the sentinel scrolls into view inside the scroll root. */
export function useInfiniteScrollSentinel({ enabled, onReach }: Options) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const sentinel = sentinelRef.current;
    if (!enabled || !root || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onReach();
      },
      { root, rootMargin: "0px 0px 80px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, onReach]);

  return { rootRef, sentinelRef };
}