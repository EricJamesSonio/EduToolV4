// src/utils/enrollmentPortalDraft.ts
// Browser-local persistence of an in-progress public enrollment application.
//
// What is kept:
//  - the applicant's typed form fields (name, school, programme/course/level…)
//    and the last reached step, so leaving the page / switching tabs never
//    forces a re-type;
//  - the short-lived verified-email session (JWT, 2h) so a returning applicant
//    resumes the form WITHOUT re-entering a second OTP.
//
// What is intentionally NOT kept:
//  - the OTP code. The verification input always starts empty and the code is
//    never persisted to local storage.
//
// Everything is scoped per enrollment period and per (normalized) applicant
// email, so several applicants on a shared device don't leak data into each
// other's form. Cleared after a successful submission or on "End session".

import type { EnrollmentApplicationView } from "@/types/enrollment-portal.types";

const KEY_PREFIX = "enroll_draft_v1_";

export interface StoredEnrollmentDraft {
  email: string;
  /** True once a code was requested. NOTE: never used to restore the code
   *  input — identity always starts at "Send code". */
  otpSent: boolean;
  /** Last reached step: identity | personal | program | review. */
  step: string;
  /** Typed form fields (sanitized on read). */
  fields: Record<string, string>;
  /** Short-lived verified-email session token (JWT, 2h). */
  sessionToken?: string;
  /** True while the session edits an existing application. */
  editMode?: boolean;
  /** Snapshot of the existing application (edit mode only) used to prefill
   *  the form after a session resume. */
  application?: EnrollmentApplicationView | null;
  updatedAt: number;
}

type Journal = Record<string, StoredEnrollmentDraft>;

function storageKey(orgSlug: string, periodToken: string): string {
  return `${KEY_PREFIX}${orgSlug}__${periodToken}`;
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

export function saveEnrollmentDraft(
  orgSlug: string,
  periodToken: string,
  email: string,
  patch: Partial<
    Pick<
      StoredEnrollmentDraft,
      "otpSent" | "step" | "fields" | "sessionToken" | "editMode" | "application"
    >
  >,
): void {
  if (!email) return;
  const key = storageKey(orgSlug, periodToken);
  const journal = readJournal(key);
  const prev = journal[email] ?? {
    email,
    otpSent: false,
    step: "identity",
    fields: {},
    updatedAt: 0,
  };
  journal[email] = { ...prev, email, updatedAt: Date.now(), ...patch };
  writeJournal(key, journal);
}

export function loadEnrollmentDraft(
  orgSlug: string,
  periodToken: string,
  email: string,
): StoredEnrollmentDraft | null {
  const journal = readJournal(storageKey(orgSlug, periodToken));
  return journal[email] ?? null;
}

export function mostRecentEnrollmentDraft(
  orgSlug: string,
  periodToken: string,
): StoredEnrollmentDraft | null {
  const journal = readJournal(storageKey(orgSlug, periodToken));
  let best: StoredEnrollmentDraft | null = null;
  for (const entry of Object.values(journal)) {
    if (!best || entry.updatedAt > best.updatedAt) best = entry;
  }
  return best;
}

export function clearEnrollmentDraft(
  orgSlug: string,
  periodToken: string,
  email: string,
): void {
  const key = storageKey(orgSlug, periodToken);
  const journal = readJournal(key);
  if (journal[email]) {
    delete journal[email];
    writeJournal(key, journal);
  }
}