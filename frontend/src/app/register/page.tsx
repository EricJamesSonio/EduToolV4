"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminRequestDraft } from "@/hooks/useAdminRequestDraft";
import {
  sendAdminRequestOtp,
  verifyAdminRequestOtp,
  submitAdminRequest,
} from "@/api/auth/register.api";

const GMAIL_RE = /^[^\s@]+@gmail\.com$/i;

const planLabels: Record<string, string> = {
  free: "Free",
  standard: "Standard ($20/mo)",
  pro: "Pro ($50/mo)",
};

const PLAN_ORDER = ["free", "standard", "pro"];

type RadioGroupProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  flagNote?: string;
  flagged?: boolean;
};

function RadioGroup({ label, options, value, onChange, flagNote, flagged }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {flagged && (
          <span title={flagNote} className="flex items-center gap-1 text-destructive text-sm font-semibold" aria-label={`Revision needed: ${flagNote}`}>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">!</span>
          </span>
        )}
      </div>
      <div className={`grid grid-cols-2 gap-2 ${flagged ? "border border-destructive rounded-lg p-2" : ""}`}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              value === opt
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {flagged && flagNote && (
        <p className="text-destructive text-xs">{flagNote}</p>
      )}
    </div>
  );
}

type InputGroupProps = {
  label: string;
  htmlFor: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  flagNote?: string;
  flagged?: boolean;
  type?: string;
};

function InputGroup({
  label,
  htmlFor,
  value,
  onChange,
  placeholder,
  flagNote,
  flagged,
  type = "text",
}: InputGroupProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {flagged && (
          <span title={flagNote} className="flex items-center gap-1 text-destructive text-sm font-semibold" aria-label={`Revision needed: ${flagNote}`}>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">!</span>
          </span>
        )}
      </div>
      <Input
        id={htmlFor}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className={flagged ? "border-destructive" : undefined}
      />
      {flagged && flagNote && (
        <p className="text-destructive text-xs">{flagNote}</p>
      )}
    </div>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPlan = searchParams.get("plan") ?? "free";

  const {
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
  } = useAdminRequestDraft();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Seed the chosen plan into the form fields on first mount if not already set.
  const [initializedPlan, setInitializedPlan] = useState(false);
  if (!initializedPlan && !fields.plan) {
    patchFields({ plan: defaultPlan });
    setInitializedPlan(true);
  }

  const revisionNotes = request?.revision_notes ?? {};

  // Map each editable field to a stable slot name. If any of them appear in the
  // owner's revision notes, their group/input is flagged with a red "!" + note.
  const value = (key: string) => fields[key] ?? "";
  const flag = (key: string) => Boolean(revisionNotes[key]);
  const note = (key: string) => revisionNotes[key];

  const getFieldError = (err: unknown): string => {
    const message = (err as any)?.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    return message ?? "Something went wrong. Please try again.";
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !GMAIL_RE.test(email)) {
      setError("Please enter a valid Gmail address (e.g. jane@gmail.com).");
      return;
    }

    setLoading(true);
    try {
      await sendAdminRequestOtp(email);
      setOtpSent(true);
      setStep("otp");
      setCode("");
    } catch (err) {
      setError(getFieldError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setError("");
    setLoading(true);
    try {
      await sendAdminRequestOtp(email);
      setCode("");
    } catch (err) {
      setError(getFieldError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code) {
      setError("Please enter the verification code.");
      return;
    }
    setLoading(true);
    try {
      const result = await verifyAdminRequestOtp({ email, code });
      activateVerifiedSession(result.token, result.mode, result.request);
      setCode("");
    } catch (err) {
      setError(getFieldError(err));
    } finally {
      setLoading(false);
    }
  };

  const toOption = (opt: string): string => opt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Session expired (or ended) — the stored session is the only way to reach
    // this step, so a missing token means the 2h window lapsed while typing.
    if (!sessionToken) {
      setError("Your session has expired. Please verify your email again.");
      resetSession();
      return;
    }

    setLoading(true);
    try {
      await submitAdminRequest(sessionToken, {
        full_name: value("full_name"),
        plan: value("plan") || undefined,
        institution_name: value("institution_name") || undefined,
        role: value("role") || undefined,
        student_count: value("student_count") || undefined,
        programs_departments: value("programs_departments") || undefined,
      });
      markSubmitted();
    } catch (err) {
      const status = (err as any)?.response?.status;
      if (status === 401) {
        setError("Your session has expired. Please verify your email again.");
        resetSession();
      } else {
        setError(getFieldError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<string, string> = {
    email: "Request an Admin Account",
    otp: "Verify Your Email",
    form: editMode ? "Review Your Request" : "Complete Your Request",
    success: "Request Submitted",
  };

  const subtitles: Record<string, string> = {
    email: "Only Gmail addresses are eligible for admin registration.",
    otp: `Enter the code sent to ${email}`,
    form: editMode
      ? "The owner requested changes below — please correct the flagged fields."
      : "Provide your institution details for the platform owner to review.",
    success: "The platform owner will review and create your admin account.",
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
              <img src="/edutool-orange.png" alt="Relief-ED" className="w-full h-full object-cover" />
            </div>
            <span className="font-heading font-bold text-xl">Relief-ED</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{titles[step]}</h1>
          <p className="text-sm text-muted-foreground">{subtitles[step]}</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-3">
              {error}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requestEmail">Gmail Address</Label>
                <Input
                  id="requestEmail"
                  type="email"
                  value={email}
                  onChange={(e) => changeEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Only an organization-endorsed Gmail can become an admin login.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Verification Code"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requestCode">Verification Code</Label>
                <Input
                  id="requestCode"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
              <button
                type="button"
                onClick={handleResend}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={resetSession}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                Use a different email
              </button>
            </form>
          )}

          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className={`${flag("full_name") ? "border border-destructive rounded-lg p-2 -m-2 space-y-2" : "space-y-4"}`}>
                <InputGroup
                  label="Full Name"
                  htmlFor="full_name"
                  value={value("full_name")}
                  onChange={(val) => patchFields({ full_name: val })}
                  placeholder="John Doe"
                  flagged={flag("full_name")}
                  flagNote={note("full_name")}
                />

                <InputGroup
                  label="Institution Name"
                  htmlFor="institution_name"
                  value={value("institution_name")}
                  onChange={(val) => patchFields({ institution_name: val })}
                  placeholder="e.g. Manila Central University"
                  flagged={flag("institution_name")}
                  flagNote={note("institution_name")}
                />

                <RadioGroup
                  label="Your Role"
                  options={["Principal", "IT Director", "Admin Officer", "Other"]}
                  value={value("role")}
                  onChange={(val) => patchFields({ role: toOption(val) })}
                  flagged={flag("role")}
                  flagNote={note("role")}
                />

                <RadioGroup
                  label="Student Count"
                  options={["Under 500", "500 – 1,000", "1,000 – 3,000", "3,000+"]}
                  value={value("student_count")}
                  onChange={(val) => patchFields({ student_count: toOption(val) })}
                  flagged={flag("student_count")}
                  flagNote={note("student_count")}
                />

                <RadioGroup
                  label="Programs / Departments"
                  options={["1–5", "6–15", "16–30", "30+"]}
                  value={value("programs_departments")}
                  onChange={(val) => patchFields({ programs_departments: toOption(val) })}
                  flagged={flag("programs_departments")}
                  flagNote={note("programs_departments")}
                />

                <RadioGroup
                  label="Plan"
                  options={PLAN_ORDER.map((p) => planLabels[p])}
                  value={value("plan")}
                  onChange={(val) =>
                    patchFields({
                      plan: PLAN_ORDER[PLAN_ORDER.findIndex((p) => planLabels[p] === val)] ?? val,
                    })
                  }
                  flagged={flag("plan")}
                  flagNote={note("plan")}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
              <button
                type="button"
                onClick={resetSession}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                End session and start over
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground text-sm">
                Your admin account request has been submitted. The platform owner
                will review your application and create your account.
              </p>
              {value("institution_name") && (
                <div className="rounded-lg bg-muted/50 px-4 py-3 text-left text-sm space-y-1">
                  <p><span className="font-medium">Institution:</span> {value("institution_name")}</p>
                  <p><span className="font-medium">Role:</span> {value("role")}</p>
                  <p><span className="font-medium">Students:</span> {value("student_count")}</p>
                  <p><span className="font-medium">Programs/Depts:</span> {value("programs_departments")}</p>
                </div>
              )}
              <Button className="w-full" variant="outline" onClick={() => router.push("/")}>
                Back to Home
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}