"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export interface NavigationGuardContextValue {
  /**
   * Register (or clear, by passing null) a function that returns true when
   * the current page has unsaved / in-progress state that would be lost by
   * navigating away. Only one guard is active at a time — the page that owns
   * it should re-register on every relevant state change and clear it on
   * unmount.
   */
  setGuard: (isDirty: (() => boolean) | null) => void;
  /**
   * Attempts an internal navigation to `href`. If a guard is active and
   * reports dirty state, opens a confirmation dialog and defers the
   * navigation until the user confirms discarding their progress.
   */
  requestNavigation: (href: string) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextValue | null>(null);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const guardRef = useRef<(() => boolean) | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const setGuard = useCallback((isDirty: (() => boolean) | null) => {
    guardRef.current = isDirty;
  }, []);

  const requestNavigation = useCallback(
    (href: string) => {
      if (guardRef.current?.()) {
        setPendingHref(href);
        return;
      }
      router.push(href);
    },
    [router],
  );

  function handleConfirmLeave() {
    if (pendingHref) {
      // Clear the guard before navigating so the unmounting page doesn't
      // immediately re-trip it, then commit the navigation.
      guardRef.current = null;
      router.push(pendingHref);
    }
    setPendingHref(null);
  }

  return (
    <NavigationGuardContext.Provider value={{ setGuard, requestNavigation }}>
      {children}

      <ConfirmDialog
        open={!!pendingHref}
        title="Leave without finishing?"
        message="You have unsaved selections on this page (departments, calendars, or other seed options). Leaving now will discard them."
        confirmLabel="Leave and discard"
        destructive
        onConfirm={handleConfirmLeave}
        onOpenChange={(o) => {
          if (!o) setPendingHref(null);
        }}
      />
    </NavigationGuardContext.Provider>
  );
}

/** Throwing hook for pages that require the guard (e.g. Data Seeder). */
export function useNavigationGuard(): NavigationGuardContextValue {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) {
    throw new Error("useNavigationGuard must be used within <NavigationGuardProvider>");
  }
  return ctx;
}

/**
 * Non-throwing accessor for shared components (like SidebarShell) that are
 * rendered both inside and outside a NavigationGuardProvider. Returns null
 * when no provider is present, in which case the caller should fall back to
 * default navigation behavior.
 */
export function useNavigationGuardOptional(): NavigationGuardContextValue | null {
  return useContext(NavigationGuardContext);
}