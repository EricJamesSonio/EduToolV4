"use client";

import { useEffect, type ReactNode } from "react";

const WRAPPER_CLASS = "app-no-text-cursor";

/**
 * Global app wrapper. Marks the whole app as display-only by default so the
 * I-beam cursor and text caret do not appear over non-input content, which
 * misleads users into thinking they can type in the design.
 *
 * The class is also placed on <body> so portaled content (dialogs, toasts,
 * popovers) is covered. Real inputs are restored in styles/interaction.css.
 */
export function AppWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add(WRAPPER_CLASS);
    return () => {
      document.body.classList.remove(WRAPPER_CLASS);
    };
  }, []);

  return <div className={`${WRAPPER_CLASS} contents`}>{children}</div>;
}