"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from "react";

import { useOrganization } from "@/hooks/admin/useOrganization";
import { OrganizationRequiredDialog } from "@/components/shared/OrganizationRequiredDialog";

interface OrganizationGuardContextValue {
  /** Whether the admin's organization exists (false while unknown/loading). */
  hasOrg: boolean;
  /** Whether the organization query is still resolving. */
  isLoadingOrg: boolean;
  /**
   * Runs `action` only if an organization exists. If none exists yet, opens the
   * "Organization Required" modal and returns false so the caller can bail out.
   */
  ensureOrganization: (action: () => void) => boolean;
}

const OrganizationGuardContext = createContext<OrganizationGuardContextValue | null>(null);

export function OrganizationGuardProvider({ children }: { children: ReactNode }) {
  const { data: org, isLoading } = useOrganization();
  const [dialogOpen, setDialogOpen] = useState(false);

  const ensureOrganization = useCallback(
    (action: () => void): boolean => {
      if (isLoading) return false;
      if (org !== null) {
        action();
        return true;
      }
      setDialogOpen(true);
      return false;
    },
    [isLoading, org],
  );

  const value: OrganizationGuardContextValue = {
    hasOrg: org !== null,
    isLoadingOrg: isLoading,
    ensureOrganization,
  };

  return (
    <OrganizationGuardContext.Provider value={value}>
      {children}
      <OrganizationRequiredDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </OrganizationGuardContext.Provider>
  );
}

export function useOrganizationGuard(): OrganizationGuardContextValue {
  const ctx = useContext(OrganizationGuardContext);
  if (!ctx) {
    throw new Error("useOrganizationGuard must be used within <OrganizationGuardProvider>");
  }
  return ctx;
}
