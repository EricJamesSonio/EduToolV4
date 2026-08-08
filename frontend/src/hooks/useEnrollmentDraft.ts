// src/hooks/useEnrollmentDraft.ts
// Owns the in-progress state of the public enrollment application and keeps the
// applicant's typed form fields + the last step in sync with browser-local
// storage, so switching tabs / an accidental close never makes the applicant
// start over or re-type.
//
// A verified email opens a short-lived session (JWT, 2h). While that session is
// still valid, returning to the page resumes the form in-place — the email/OTP
// screen is skipped entirely. The OTP code itself is never persisted; the code
// input always starts empty.

import { useCallback, useEffect, useState } from "react";
import { isTokenExpired } from "@/utils/token.util";
import {
  saveEnrollmentDraft,
  loadEnrollmentDraft,
  mostRecentEnrollmentDraft,
  clearEnrollmentDraft,
} from "@/utils/enrollmentPortalDraft";
import { applicationToDraft } from "@/utils/enrollmentApplication";
import {
  type ApplicationDraft,
  type ApplicationDraftStep,
  emptyApplicationDraft,
  sanitizeApplicationDraft,
  resumeApplicationStep,
} from "@/types/enrollment-portal.types";
import type { EnrollmentApplicationView } from "@/types/enrollment-portal.types";

export interface UseEnrollmentDraftResult {
  email: string;
  changeEmail: (email: string) => void;
  otpSent: boolean;
  setOtpSent: (value: boolean) => void;
  draft: ApplicationDraft;
  /** Merges a partial patch into the current draft (auto-saved). */
  patchDraft: (patch: Partial<ApplicationDraft>) => void;
  step: ApplicationDraftStep;
  setStep: (step: ApplicationDraftStep) => void;
  /** Active verified-email session token while it is still valid (2h). */
  sessionToken: string | null;
  /** True when the active session is editing an existing application. */
  editMode: boolean;
  /** The existing application being edited (edit mode), if any. */
  application: EnrollmentApplicationView | null;
  /** Starts a verified session right after a successful OTP: restores the
   *  stored draft (or the existing application in edit mode) and jumps back
   *  into the form without an identity round-trip. */
  activateVerifiedSession: (
    token: string,
    editMode: boolean,
    application?: EnrollmentApplicationView | null,
  ) => void;
  /** Ends the active session, clears the stored draft, and returns to a fresh
   *  identity screen. */
  resetSession: () => void;
  /** Drops the stored draft + session once the application was submitted. */
  completeDraft: () => void;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function useEnrollmentDraft(
  orgSlug: string,
  periodToken: string,
): UseEnrollmentDraftResult {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [draft, setDraft] = useState<ApplicationDraft>(emptyApplicationDraft);
  const [step, setStep] = useState<ApplicationDraftStep>("identity");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [application, setApplication] = useState<EnrollmentApplicationView | null>(null);

  // Hydrate the most recent saved draft for this period into the form.
  // - Valid session (2h): resume the form in-place, skipping email/OTP.
  // - No / expired session: fresh identity; email is prefilled for convenience
  //   but the OTP input is NEVER pre-filled (no code is ever persisted).
  useEffect(() => {
    const saved = mostRecentEnrollmentDraft(orgSlug, periodToken);
    if (!saved) return;

    setEmail(saved.email);
    if (!saved.sessionToken) return;

    if (isTokenExpired(saved.sessionToken)) {
      clearEnrollmentDraft(orgSlug, periodToken, saved.email);
      return;
    }

    setSessionToken(saved.sessionToken);
    setEditMode(saved.editMode ?? false);
    setApplication(saved.editMode ? saved.application ?? null : null);

    if (saved.step && saved.step !== "identity") {
      setDraft({
        ...emptyApplicationDraft,
        ...(saved.editMode && saved.application
          ? applicationToDraft(saved.application)
          : {}),
        ...sanitizeApplicationDraft(saved.fields),
      });
      setStep(resumeApplicationStep(saved.step));
    } else {
      setDraft(emptyApplicationDraft);
      setStep("personal");
    }
  }, [orgSlug, periodToken]);

  // Auto-save the form fields + session as the applicant types / moves between
  // steps. Skipped on success so a completed application is never resurrected.
  useEffect(() => {
    const key = normalize(email);
    if (!key || step === "success") return;
    saveEnrollmentDraft(orgSlug, periodToken, key, {
      otpSent,
      step,
      fields: draft as unknown as Record<string, string>,
      sessionToken: sessionToken ?? undefined,
      editMode,
      application,
    });
  }, [email, otpSent, step, draft, sessionToken, editMode, application, orgSlug, periodToken]);

  const changeEmail = useCallback((value: string) => {
    setEmail(value);
    setOtpSent(false);
  }, []);

  const patchDraft = useCallback((patch: Partial<ApplicationDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const activateVerifiedSession = useCallback(
    (token: string, mode: boolean, serverApplication?: EnrollmentApplicationView | null) => {
      const key = normalize(email);
      const saved = key ? loadEnrollmentDraft(orgSlug, periodToken, key) : null;
      const resumeStep = saved ? resumeApplicationStep(saved.step) : "personal";

      setSessionToken(token);
      setEditMode(mode);
      setApplication(mode && serverApplication ? serverApplication : null);
      setDraft({
        ...emptyApplicationDraft,
        ...(mode && serverApplication ? applicationToDraft(serverApplication) : {}),
        ...(saved ? sanitizeApplicationDraft(saved.fields) : {}),
      });
      setStep(resumeStep);

      // Persist the session immediately so a reload right after verify resumes.
      if (key) {
        saveEnrollmentDraft(orgSlug, periodToken, key, {
          otpSent: false,
          step: resumeStep,
          fields: sanitizeApplicationDraft(saved?.fields) as unknown as Record<string, string>,
          sessionToken: token,
          editMode: mode,
          application: mode && serverApplication ? serverApplication : null,
        });
      }
    },
    [email, orgSlug, periodToken],
  );

  const resetSession = useCallback(() => {
    const key = normalize(email);
    if (key) clearEnrollmentDraft(orgSlug, periodToken, key);
    setSessionToken(null);
    setEditMode(false);
    setApplication(null);
    setOtpSent(false);
    setDraft(emptyApplicationDraft);
    setStep("identity");
  }, [email, orgSlug, periodToken]);

  const completeDraft = useCallback(() => {
    const key = normalize(email);
    if (key) clearEnrollmentDraft(orgSlug, periodToken, key);
    setSessionToken(null);
    setEditMode(false);
    setApplication(null);
  }, [email, orgSlug, periodToken]);

  return {
    email,
    changeEmail,
    otpSent,
    setOtpSent,
    draft,
    patchDraft,
    step,
    setStep,
    sessionToken,
    editMode,
    application,
    activateVerifiedSession,
    resetSession,
    completeDraft,
  };
}