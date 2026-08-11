// src/hooks/useAdminRequestDraft.ts
// Owns the in-progress state of the public admin-request flow and keeps the
// applicant's typed form fields + the last step in sync with browser-local
// storage, mirroring the Enrollment Portal's useEnrollmentDraft.
//
// A verified Gmail opens a short-lived session (JWT, 2h). While that session
// is still valid, returning to the page resumes the form in-place — the
// email/OTP screen is skipped entirely. The OTP code itself is never
// persisted; the code input always starts empty.

import { useCallback, useEffect, useState } from "react";
import { isTokenExpired } from "@/utils/token.util";
import {
  saveAdminRequestDraft,
  loadAdminRequestDraft,
  mostRecentAdminRequestDraft,
  clearAdminRequestDraft,
} from "@/utils/adminRequestDraft";
import type { AdminRequestView } from "@/api/auth/register.api";

export type AdminRequestStep = "email" | "otp" | "form" | "success";

export interface UseAdminRequestDraftResult {
  email: string;
  changeEmail: (email: string) => void;
  otpSent: boolean;
  setOtpSent: (value: boolean) => void;
  fields: Record<string, string>;
  patchFields: (patch: Partial<Record<string, string>>) => void;
  step: AdminRequestStep;
  setStep: (step: AdminRequestStep) => void;
  /** Active verified-email session token while it is still valid (2h). */
  sessionToken: string | null;
  /** True when the active session is editing an existing request. */
  editMode: boolean;
  /** The existing request being edited (edit mode), if any. Includes
   *  revision_notes flags used to render "!" markers. */
  request: AdminRequestView | null;
  /** Starts a verified session right after a successful OTP: restores the
   *  stored draft (or the existing request in edit mode) and jumps into the
   *  form without an identity round-trip. */
  activateVerifiedSession: (
    token: string,
    mode: "edit" | "create",
    request?: AdminRequestView | null,
  ) => void;
  /** Ends the active session, clears the stored draft, and returns to a fresh
   *  identity screen. */
  resetSession: () => void;
  /** Records a successful submission. */
  markSubmitted: () => void;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function useAdminRequestDraft(): UseAdminRequestDraftResult {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [step, setStep] = useState<AdminRequestStep>("email");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [request, setRequest] = useState<AdminRequestView | null>(null);

  // Hydrate the most recent saved draft for this applicant.
  // - Valid session (2h): resume the form in-place, skipping email/OTP.
  // - No / expired session: fresh identity; email is prefilled for convenience
  //   but the OTP input is NEVER pre-filled (no code is ever persisted).
  useEffect(() => {
    const saved = mostRecentAdminRequestDraft();
    if (!saved) return;

    setEmail(saved.email);
    if (!saved.sessionToken) return;

    if (isTokenExpired(saved.sessionToken)) {
      clearAdminRequestDraft(saved.email);
      return;
    }

    setSessionToken(saved.sessionToken);
    setEditMode(saved.editMode ?? false);
    setRequest(saved.editMode ? saved.request ?? null : null);

    if (saved.step && saved.step !== "email") {
      setFields(
        saved.editMode && saved.request
          ? {
              full_name: saved.request.full_name,
              institution_name: saved.request.institution_name ?? "",
              plan: saved.request.plan ?? "",
              role: saved.request.role ?? "",
              student_count: saved.request.student_count ?? "",
              programs_departments: saved.request.programs_departments ?? "",
              ...saved.fields,
            }
          : saved.fields,
      );
      setStep(saved.step === "success" ? "success" : "form");
    } else {
      setFields({});
      setStep("form");
    }
  }, []);

  // Auto-save the form fields + session as the applicant types / moves between
  // steps. Skipped on success so a completed form is never resurrected.
  useEffect(() => {
    const key = normalize(email);
    if (!key || step === "success") return;
    saveAdminRequestDraft(key, {
      otpSent,
      step,
      fields,
      sessionToken: sessionToken ?? undefined,
      editMode,
      request,
    });
  }, [email, otpSent, step, fields, sessionToken, editMode, request]);

  const changeEmail = useCallback((value: string) => {
    setEmail(value);
    setOtpSent(false);
  }, []);

  const patchFields = useCallback((patch: Partial<Record<string, string>>) => {
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) cleaned[key] = value;
    }
    setFields((prev) => ({ ...prev, ...cleaned }));
  }, []);

  const activateVerifiedSession = useCallback(
    (
      token: string,
      mode: "edit" | "create",
      serverRequest?: AdminRequestView | null,
    ) => {
      const key = normalize(email);
      const saved = key ? loadAdminRequestDraft(key) : null;

      setSessionToken(token);
      setEditMode(mode === "edit");
      setRequest(mode === "edit" && serverRequest ? serverRequest : null);
      setFields({
        ...(mode === "edit" && serverRequest
          ? {
              full_name: serverRequest.full_name,
              institution_name: serverRequest.institution_name ?? "",
              plan: serverRequest.plan ?? "",
              role: serverRequest.role ?? "",
              student_count: serverRequest.student_count ?? "",
              programs_departments: serverRequest.programs_departments ?? "",
            }
          : {}),
        ...(saved ? saved.fields : {}),
      });
      setStep("form");

      // Persist the session immediately so a reload right after verify resumes.
      if (key) {
        saveAdminRequestDraft(key, {
          otpSent: false,
          step: "form",
          fields,
          sessionToken: token,
          editMode: mode === "edit",
          request: mode === "edit" && serverRequest ? serverRequest : null,
        });
      }
    },
    [email, fields],
  );

  const resetSession = useCallback(() => {
    const key = normalize(email);
    if (key) clearAdminRequestDraft(key);
    setSessionToken(null);
    setEditMode(false);
    setRequest(null);
    setOtpSent(false);
    setFields({});
    setStep("email");
  }, [email]);

  const markSubmitted = useCallback(() => {
    setStep("success");
  }, []);

  return {
    email,
    changeEmail,
    otpSent,
    setOtpSent,
    fields,
    patchFields,
    step,
    setStep,
    sessionToken,
    editMode,
    request,
    activateVerifiedSession,
    resetSession,
    markSubmitted,
  };
}