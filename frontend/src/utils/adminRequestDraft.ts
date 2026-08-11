// src/utils/adminRequestDraft.ts
// Browser-local persistence of the public admin-request flow, mirroring the
// Enrollment Portal's draft mechanism.
//
// What is kept:
//  - the typed form fields and the last reached step, so leaving the page /
//    switching tabs never forces a re-type;
//  - the short-lived verified-email session (JWT, 2h) so a returning applicant
//    resumes the form WITHOUT re-entering a second OTP.
//
// What is intentionally NOT kept:
//  - the OTP code. The verification input always starts empty.
//
// Everything is scoped per (normalized) applicant email, so several applicants
// on a shared device don't leak data into each other's form. Cleared after a
// successful submission or on "End session".

import type { AdminRequestView } from "@/api/auth/register.api";

const KEY_PREFIX = "admin_request_draft_v1_";

export interface StoredAdminRequestDraft {
  email: string;
  /** True once a code was requested. The code itself is never stored. */
  otpSent: boolean;
  /** Last reached step: email | otp | form | success. */
  step: string;
  /** Typed form fields, keyed by RegistrationRequest field name (snake_case). */
  fields: Record<string, string>;
  /** Short-lived verified-email session token (JWT, 2h). */
  sessionToken?: string;
  /** True while the session edits an existing request. */
  editMode?: boolean;
  /** Snapshot of the existing request (edit mode only) used to prefill the
   *  form after a session resume, including its revision_notes flags. */
  request?: AdminRequestView | null;
  updatedAt: number;
}

type Journal = Record<string, StoredAdminRequestDraft>;

function storageKey(email: string): string {
  return `${KEY_PREFIX}${email}`;
}

function readJournal(key: string): Journal {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Journal) : {};
  } catch {
    return {};
  }
}

function writeJournal(key: string, journal: Journal): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(journal));
  } catch {
    // Storage disabled or quota exceeded — drafts are best-effort only.
  }
}

export function saveAdminRequestDraft(
  email: string,
  patch: Partial<
    Pick<
      StoredAdminRequestDraft,
      "otpSent" | "step" | "fields" | "sessionToken" | "editMode" | "request"
    >
  >,
): void {
  if (!email) return;
  const key = storageKey(email);
  const journal = readJournal(key);
  const prev = journal[email] ?? {
    email,
    otpSent: false,
    step: "email",
    fields: {},
    updatedAt: 0,
  };
  journal[email] = { ...prev, email, updatedAt: Date.now(), ...patch };
  writeJournal(key, journal);
}

export function loadAdminRequestDraft(
  email: string,
): StoredAdminRequestDraft | null {
  const journal = readJournal(storageKey(email));
  return journal[email] ?? null;
}

export function mostRecentAdminRequestDraft(): StoredAdminRequestDraft | null {
  const prefix = KEY_PREFIX;
  if (typeof window === "undefined") return null;
  let best: StoredAdminRequestDraft | null = null;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    const journal = readJournal(key);
    for (const entry of Object.values(journal)) {
      if (!best || entry.updatedAt > best.updatedAt) best = entry;
    }
  }
  return best;
}

export function clearAdminRequestDraft(email: string): void {
  const key = storageKey(email);
  const journal = readJournal(key);
  if (journal[email]) {
    delete journal[email];
    writeJournal(key, journal);
  }
}