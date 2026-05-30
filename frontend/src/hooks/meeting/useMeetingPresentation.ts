"use client";

import { useState, useCallback } from "react";
import { usePresentation } from "@/hooks/educator/usePresentations";
import type { Presentation } from "@/types/educator/presentation.types";

export function useMeetingPresentation(classId: string, externalPresentationId?: string | null) {
  const [localPresentationId, setLocalPresentationId] = useState<string | null>(null);

  const presentationId = externalPresentationId ?? localPresentationId;

  const { data: presentation, isLoading, isError } = usePresentation(
    classId,
    presentationId ?? "",
  );

  const selectPresentation = useCallback((pres: Presentation) => {
    setLocalPresentationId(pres.id);
  }, []);

  const clearPresentation = useCallback(() => {
    setLocalPresentationId(null);
  }, []);

  return {
    presentationId,
    presentation: presentation ?? null,
    isLoading,
    isError,
    selectPresentation,
    clearPresentation,
  };
}
