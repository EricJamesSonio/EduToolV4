// frontend\src\hooks\admin\useClassDraft.ts
import { useEffect, useRef } from "react";
import type { CreateClassForm } from "@/components/admin/class/CreateClassDialog";

const DRAFT_KEY = "admin:class:draft";

export function saveClassDraft(values: Partial<CreateClassForm>): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {}
}

export function loadClassDraft(): Partial<CreateClassForm> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<CreateClassForm>) : null;
  } catch {
    return null;
  }
}

export function clearClassDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

/** Auto-saves form values to localStorage whenever they change. */
export function useClassDraftAutosave(values: CreateClassForm): void {
  // Skip the very first render so we don't overwrite a loaded draft
  // with empty defaultValues before the form has been populated.
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    saveClassDraft(values);
  }, [values]);
}