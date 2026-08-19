import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import type { CreateClassForm } from "@/components/admin/class/CreateClassDialog.types";
import { createStandardMutationOptions } from "@/lib/error-handling";
import { QUERY_CONFIGS } from "@/lib/query-client";

const DRAFT_KEY = "admin:class:draft";

// Query key for class draft
const classDraftKeys = {
  draft: ["classDraft"] as const,
};

/**
 * Save class draft to both localStorage and React Query cache
 */
export function saveClassDraft(values: Partial<CreateClassForm>): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch (error) {
    // localStorage can throw (quota exceeded, private browsing, disabled) —
    // draft saving is best-effort, so we swallow it but log for visibility.
    console.warn("Failed to save class draft:", error);
  }
}

/**
 * Load class draft from localStorage
 */
export function loadClassDraft(): Partial<CreateClassForm> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<CreateClassForm>) : null;
  } catch {
    return null;
  }
}

/**
 * Clear class draft from both localStorage and React Query cache
 */
export function clearClassDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.warn("Failed to clear class draft:", error);
  }
}
/**
 * Hook to manage class draft with React Query
 * Provides persistent storage with better caching and synchronization
 */
export function useClassDraft() {
  const queryClient = useQueryClient();

  // Query to get the current draft
  const { data: draft, isLoading, error } = useAsyncQuery(
    [...queryKeys.admin.all, 'classDraft'] as const,
    async () => {
      const savedDraft = loadClassDraft();
      return savedDraft || {};
    },
    { staleTime: 1000 * 60 * 60, gcTime: 1000 * 60 * 60 * 24 },
  );

  // Mutation to save draft
  const saveDraftMutation = useMutationWithInvalidation(
    (values: Partial<CreateClassForm>) => {
      saveClassDraft(values);
      return Promise.resolve(undefined);
    },
    {
      ...createStandardMutationOptions({
        entity: "Class Draft",
        operation: "update",
        silent: true, // Don't show toast for auto-saves
        onSuccess: (newDraft) => {
          // Update React Query cache with new draft
          queryClient.setQueryData([...queryKeys.admin.all, 'classDraft'] as const, newDraft);
        },
      }),
    },
  );

  // Mutation to clear draft
  const clearDraftMutation = useMutationWithInvalidation(
    () => {
      clearClassDraft();
      return Promise.resolve(undefined);
    },
    {
      invalidateKeys: [[...queryKeys.admin.all, 'classDraft'] as const],
      ...createStandardMutationOptions({
        entity: "Class Draft",
        operation: "delete",
        silent: true, // Don't show toast for clear operations
        onSuccess: () => {
          // Clear React Query cache
          queryClient.setQueryData([...queryKeys.admin.all, 'classDraft'] as const, {});
        },
      }),
    },
  );

  // Auto-save hook - replaces the original useClassDraftAutosave
  function useClassDraftAutosave(values: CreateClassForm): void {
    const isMounted = useRef(false);

    useEffect(() => {
      if (!isMounted.current) {
        isMounted.current = true;
        return;
      }
      saveDraftMutation.mutate(values);
    }, [values]);
  }

  return {
    draft: draft || {},
    isLoading,
    error,
    saveDraft: saveDraftMutation.mutate,
    clearDraft: clearDraftMutation.mutate,
    isSaving: saveDraftMutation.isPending,
    isClearing: clearDraftMutation.isPending,
  };
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use useClassDraft hook instead
 */
export function useClassDraftAutosave(values: CreateClassForm): void {
  console.warn("useClassDraftAutosave is deprecated. Use useClassDraft hook instead.");

  const { saveDraft } = useClassDraft();
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    saveDraft(values);
  }, [values]);
}
