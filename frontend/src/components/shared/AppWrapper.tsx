"use client";

import { useEffect, type ReactNode } from "react";

export const APP_WRAPPER_CLASS = "app-no-text-cursor";

/**
 * Global app wrapper. Keeps the whole app display-only by default: no I-beam
 * cursor, no blinking caret and no text selection outside real inputs, so
 * users are not misled into thinking they can type in the design.
 *
 * The class is also set on <body> in the root layout, so portaled content
 * (dialogs, toasts, popovers) is covered from the first render. The effect
 * below only re-adds it if something removed it. Rules live in
 * styles/interaction.css. Opt in to selectable text with `data-selectable`.
 */
export function AppWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add(APP_WRAPPER_CLASS);
  }, []);

  return <div className={`${APP_WRAPPER_CLASS} contents`}>{children}</div>;
}