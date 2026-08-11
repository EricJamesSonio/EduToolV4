"use client";

// Public (unauthenticated) enrollment portal. Self-contained: imports only
// generic UI primitives + the public api module — nothing from authenticated
// admin/educator/student layouts or auth contexts.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { enrollmentPortalApi } from "@/api/public/enrollment-portal.api";
import { useEnrollmentDraft, type UseEnrollmentDraftResult } from "@/hooks/useEnrollmentDraft";
import { draftToApplicationPayload } from "@/utils/enrollmentApplication";
import type {
  PublicPortalInfo,
  PublicProgram,
  PublicApplicationLookup,
  EnrollmentApplicationView,
  ApplicationDraft,
  ApplicationDraftStep,
} from "@/types/enrollment-portal.types";

type Step = ApplicationDraftStep;

const STEP_LABELS: Step[] = ["identity", "personal", "program", "review"];

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Typesafe extraction of a server-provided error message from an unknown. */
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: unknown } })?.response?.data;
    if (data && typeof data === "object") {
      const body = data as { message?: unknown; error?: unknown };
      if (typeof body.message === "string" && body.message) return body.message;
      // class-validator failures come back as an array of messages.
      if (Array.isArray(body.message) && body.message.length) {
        return String(body.message[0]);
      }
      // The HttpExceptionFilter nests the real message under `error`.
      if (body.error && typeof body.error === "object") {
        const nested = (body.error as { message?: unknown; error?: unknown }).message;
        if (typeof nested === "string" && nested) return nested;
        if (Array.isArray(nested) && nested.length) return String(nested[0]);
        if (typeof (body.error as { message?: unknown; error?: unknown }).error === "string")
          return (body.error as { message?: unknown; error?: unknown }).error as string;
      }
      if (typeof body.error === "string" && body.error) return body.error;
    }
  }
  return err instanceof Error ? err.message : fallback;
}

function needsCourseOrStrand(program?: PublicProgram | null): boolean {
  return !!program && (program.type === "college" || program.type === "shs");
}

export function EnrollmentPortal({
  orgSlug,
  periodToken,
}: {
  orgSlug: string;
  periodToken: string;
}): React.JSX.Element {
  const [catalog, setCatalog] = useState<PublicPortalInfo | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [view, setView] = useState<"apply" | "status">("apply");
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const draftCtx = useEnrollmentDraft(orgSlug, periodToken);

  useEffect(() => {
    let active = true;
    enrollmentPortalApi
      .getPortalInfo(orgSlug, periodToken)
      .then((info) => {
        if (active) setCatalog(info);
      })
      .catch((err) => {
        if (active) setCatalogError(errorMessage(err, "This enrollment link is not available."));
      });
    return () => {
      active = false;
    };
  }, [orgSlug, periodToken]);

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">
            {catalog?.org?.name ?? "Enrollment Portal"}
          </h1>
          {catalog && (
            <p className="text-sm text-muted-foreground">
              {catalog.period.name} · School Year {catalog.schoolYear.name}
            </p>
          )}
          <div className="mt-3 flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setView("apply")}
              className={cn(
                "rounded-lg px-3 py-1.5 font-medium transition-colors",
                view === "apply" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              Apply / Edit
            </button>
            <button
              type="button"
              onClick={() => setView("status")}
              className={cn(
                "rounded-lg px-3 py-1.5 font-medium transition-colors",
                view === "status" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              Check Status
            </button>
          </div>
        </div>

        {catalogError && (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              {catalogError}
            </CardContent>
          </Card>
        )}

        {!catalog && !catalogError && (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </CardContent>
          </Card>
        )}

        {catalog && view === "apply" && (
          <ApplyFlow
            key={`${orgSlug}/${periodToken}/${catalog.period.id}`}
            orgSlug={orgSlug}
            periodToken={periodToken}
            catalog={catalog}
            draftCtx={draftCtx}
          />
        )}

        {catalog && view === "status" && <CheckStatus draftCtx={draftCtx} />}
      </div>
    </main>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const activeIndex = STEP_LABELS.indexOf(step);
  return (
    <ol className="flex items-center gap-2 text-xs">
      {STEP_LABELS.map((name, i) => (
        <li key={name} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium",
              i < activeIndex
                ? "bg-primary text-primary-foreground"
                : i === activeIndex
                  ? "border border-primary text-primary"
                  : "border border-muted-foreground/30 text-muted-foreground",
            )}
          >
            {i < activeIndex ? "✓" : i + 1}
          </span>
          <span className={cn("capitalize", i === activeIndex ? "font-medium" : "text-muted-foreground")}>
            {ps(i)}
          </span>
          {i < STEP_LABELS.length - 1 && <span className="h-px w-4 bg-muted-foreground/20" />}
        </li>
      ))}
    </ol>
  );
}

function ps(i: number): string {
  return ["Email", "Personal Info", "Program", "Review"][i];
}

function ApplyFlow({
  orgSlug,
  periodToken,
  catalog,
  draftCtx,
}: {
  orgSlug: string;
  periodToken: string;
  catalog: PublicPortalInfo;
  draftCtx: UseEnrollmentDraftResult;
}) {
  const {
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
    markSubmitted,
  } = draftCtx;

  const [busy, setBusy] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [createdCode, setCreatedCode] = useState("");

  const isLocked = !!application && (application.status === "locked" || application.status === "approved");

  const periodOpen = catalog.period.is_open;

  const handleRequestOtp = async () => {
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    setBusy(true);
    try {
      await enrollmentPortalApi.requestOtp(orgSlug, periodToken, email);
      setOtpSent(true);
      toast.success("Verification code sent to your email.");
    } catch (err) {
      toast.error(errorMessage(err, "Could not send the code."));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email || otpCode.length !== 6) return;
    setBusy(true);
    try {
      const result = await enrollmentPortalApi.verifyOtp(orgSlug, periodToken, email, otpCode);
      setOtpSent(true);
      activateVerifiedSession(result.token, result.mode === "edit", result.application ?? null);
    } catch (err) {
      toast.error(errorMessage(err, "That code didn't verify."));
    } finally {
      setBusy(false);
    }
  };

  const selectedProgram = draft.program_id
    ? catalog.programs.find((p) => p.id === draft.program_id)
    : undefined;

  // Self-heal any selection that no longer matches the current portal catalog
  // (e.g. a draft resumed from an earlier session). Without this, a stale
  // course/strand/level would submit and bounce back with a 400 from the API.
  useEffect(() => {
    const patch: Partial<ApplicationDraft> = {};
    const program = draft.program_id
      ? catalog.programs.find((p) => p.id === draft.program_id)
      : undefined;

    if (draft.program_id && !program) {
      patch.program_id = "";
      patch.course_id = "";
      patch.strand_id = "";
      patch.level_id = "";
    } else if (program) {
      if (draft.course_id && !program.courses.some((c) => c.id === draft.course_id)) {
        patch.course_id = "";
        patch.level_id = "";
      }
      if (draft.strand_id && !program.strands.some((s) => s.id === draft.strand_id)) {
        patch.strand_id = "";
        patch.level_id = "";
      }

      if (draft.level_id) {
        const showCourses = program.type === "college";
        const showStrands = program.type === "shs";
        let applicable = ([] as PublicProgram["levels"]).slice();
        if (showCourses && draft.course_id) {
          applicable = program.courses.find((c) => c.id === draft.course_id)?.levels ?? applicable;
        } else if (showStrands && draft.strand_id) {
          applicable = program.strands.find((s) => s.id === draft.strand_id)?.levels ?? applicable;
        }
        if (applicable.length === 0) applicable = program.levels;
        if (!applicable.some((l) => l.id === draft.level_id)) patch.level_id = "";
      }
    }

    if (patch.program_id !== undefined || patch.course_id !== undefined || patch.strand_id !== undefined || patch.level_id !== undefined) {
      patchDraft(patch);
    }
  }, [draft.program_id, draft.course_id, draft.strand_id, draft.level_id, catalog, patchDraft]);

  const handleSubmit = async () => {
    if (step !== "review") return;
    if (!sessionToken) {
      console.warn("[EnrollmentPortal] submit attempted without an active session");
      resetSession();
      toast.error("Your session expired. Please verify your email again to continue.");
      return;
    }

    if (!draft.first_name.trim() || !draft.last_name.trim()) {
      toast.error("First and last name are required.");
      setStep("personal");
      return;
    }
    if (!draft.program_id || !selectedProgram) {
      toast.error("Your saved program is no longer available. Please pick it again.");
      setStep("program");
      return;
    }
    if (needsCourseOrStrand(selectedProgram) && !draft.course_id && !draft.strand_id) {
      toast.error("Select a course or strand for this program.");
      setStep("program");
      return;
    }
    if (!draft.level_id) {
      toast.error("Select a level for this program.");
      setStep("program");
      return;
    }

    setBusy(true);
    try {
      const payload = draftToApplicationPayload(draft);
      const result = editMode
        ? await enrollmentPortalApi.updateApplication(orgSlug, periodToken, sessionToken, payload)
        : await enrollmentPortalApi.createApplication(orgSlug, periodToken, sessionToken, payload);
      setCreatedCode(result.application_code);
      setStep("success");
      markSubmitted(result.application_code);
    } catch (err) {
      const httpErr = err as { response?: { status?: number; data?: unknown } };
      console.error("Application submit failed", httpErr?.response?.status, httpErr?.response?.data);
      if (httpErr?.response?.status === 401) {
        resetSession();
        toast.error("Your session expired. Verify your email again to continue.");
      } else {
        toast.error(errorMessage(err, "Could not save your application."));
      }
    } finally {
      setBusy(false);
    }
  };

  if (isLocked && application) {
    return <LockedApplicationView application={application} />;
  }

  return (
    <div className="space-y-4">
      {sessionToken && step !== "identity" && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <span>
            Verified as <span className="font-medium">{email}</span>. Your
            session is active for 2 hours — you can leave and come back
            anytime without re-verifying.
          </span>
          <button
            type="button"
            onClick={resetSession}
            className="shrink-0 font-semibold underline underline-offset-2 hover:text-emerald-950"
          >
            End session
          </button>
        </div>
      )}

      <StepIndicator step={step} />
      {editMode && application?.status === "rejected" && application.rejection_reason && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <p className="font-medium">Your application was not approved</p>
          <p className="mt-0.5">
            Application <span className="font-mono font-semibold">{application.application_code}</span>
            {" "}was rejected. Reason: {application.rejection_reason}. You can revise your details
            below and resubmit for review.
          </p>
        </div>
      )}
      <Card>
        <CardContent className="py-6">
          {step === "identity" && (
            <IdentityStep
              periodOpen={periodOpen}
              email={email}
              setEmail={changeEmail}
              otpSent={otpSent}
              otpCode={otpCode}
              setOtpCode={setOtpCode}
              busy={busy}
              onRequestOtp={handleRequestOtp}
              onVerifyOtp={handleVerifyOtp}
            />
          )}

          {step === "personal" && (
            <PersonalStep
              draft={draft}
              setDraft={patchDraft}
              onBack={() => setStep("identity")}
              onNext={() => {
                if (!draft.first_name.trim() || !draft.last_name.trim()) {
                  toast.error("First and last name are required.");
                  return;
                }
                setStep("program");
              }}
            />
          )}

          {step === "program" && (
            <ProgramStep
              draft={draft}
              setDraft={patchDraft}
              programs={catalog.programs}
              selectedProgram={selectedProgram}
              onBack={() => setStep("personal")}
              onNext={() => {
                if (!draft.program_id || !draft.level_id) {
                  toast.error("Select a program and a level.");
                  return;
                }
                if (
                  needsCourseOrStrand(selectedProgram) &&
                  !draft.course_id &&
                  !draft.strand_id
                ) {
                  toast.error("Select a course or strand for this program.");
                  return;
                }
                setStep("review");
              }}
            />
          )}

          {step === "review" && (
            <ReviewStep
              draft={draft}
              catalog={catalog}
              editMode={editMode}
              busy={busy}
              onSubmit={handleSubmit}
              onBack={() => setStep("program")}
            />
          )}

          {step === "success" && <SuccessStep applicationCode={createdCode} />}
        </CardContent>
      </Card>
    </div>
  );
}

function IdentityStep({
  periodOpen,
  email,
  setEmail,
  otpSent,
  otpCode,
  setOtpCode,
  busy,
  onRequestOtp,
  onVerifyOtp,
}: {
  periodOpen: boolean;
  email: string;
  setEmail: (v: string) => void;
  otpSent: boolean;
  otpCode: string;
  setOtpCode: (v: string) => void;
  busy: boolean;
  onRequestOtp: () => void;
  onVerifyOtp: () => void;
}) {
  return (
    <div className="space-y-4">
      {!periodOpen && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          This enrollment window is currently closed.
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Personal email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          disabled={otpSent || busy}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          We&apos;ll send a one-time code to verify you own this inbox. No password or account
          needed yet.
        </p>
      </div>

      {otpSent && (
        <div className="space-y-2">
          <Label htmlFor="otp">Verification code</Label>
          <div className="flex gap-2">
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={onRequestOtp}
              disabled={busy || !email}
              className="shrink-0"
            >
              Resend
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {otpSent ? (
          <Button onClick={onVerifyOtp} disabled={otpCode.length !== 6 || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Continue
          </Button>
        ) : (
          <Button onClick={onRequestOtp} disabled={!email || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
          </Button>
        )}
      </div>
    </div>
  );
}

// Avoid confusing the "Continue" label with edit mode (kept simple).

function PersonalStep({
  draft,
  setDraft,
  onBack,
  onNext,
}: {
  draft: ApplicationDraft;
  setDraft: (patch: Partial<ApplicationDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const set = (key: keyof ApplicationDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft({ [key]: e.target.value });
  // Names: letters only plus common name punctuation (space, hyphen, apostrophe,
  // period). Blocks digits and symbols at the input level.
  const setText = (key: "first_name" | "middle_name" | "last_name") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setDraft({ [key]: e.target.value.replace(/[^A-Za-z' .-]/g, "") });
  // Contact number: digits only, capped at 11.
  const setContact = (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft({ contact_number: e.target.value.replace(/\D/g, "").slice(0, 11) });
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="first_name">First name *</Label>
        <Input id="first_name" value={draft.first_name} onChange={setText("first_name")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="middle_name">Middle name</Label>
        <Input id="middle_name" value={draft.middle_name} onChange={setText("middle_name")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="last_name">Last name *</Label>
        <Input id="last_name" value={draft.last_name} onChange={setText("last_name")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="age">Age</Label>
        <Input id="age" type="number" min={1} max={120} value={draft.age} onChange={set("age")} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" value={draft.address} onChange={set("address")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_number">Contact number</Label>
        <Input
          id="contact_number"
          inputMode="numeric"
          maxLength={11}
          placeholder="09171234567"
          value={draft.contact_number}
          onChange={setContact}
        />
        <p className="text-xs text-muted-foreground">
          {draft.contact_number.length}/11 digits
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="last_school">Last school graduated</Label>
        <Input id="last_school" value={draft.last_school_graduated} onChange={set("last_school_graduated")} />
      </div>
      <div className="col-span-full flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ProgramStep({
  draft,
  setDraft,
  programs,
  selectedProgram,
  onBack,
  onNext,
}: {
  draft: ApplicationDraft;
  setDraft: (patch: Partial<ApplicationDraft>) => void;
  programs: PublicProgram[];
  selectedProgram?: PublicProgram;
  onBack: () => void;
  onNext: () => void;
}) {
  const showCourses = selectedProgram?.type === "college";
  const showStrands = selectedProgram?.type === "shs";

  // Levels available for the chosen program, course, or strand.
  const levelOptions = (() => {
    if (!selectedProgram) return [];
    if (showCourses && draft.course_id) {
      const c = selectedProgram.courses.find((x) => x.id === draft.course_id);
      if (c?.levels?.length) return c.levels;
    }
    if (showStrands && draft.strand_id) {
      const s = selectedProgram.strands.find((x) => x.id === draft.strand_id);
      if (s?.levels?.length) return s.levels;
    }
    return selectedProgram.levels;
  })();

  const selectedCourse = showCourses
    ? selectedProgram?.courses.find((c) => c.id === draft.course_id)
    : undefined;
  const selectedStrand = showStrands
    ? selectedProgram?.strands.find((s) => s.id === draft.strand_id)
    : undefined;
  const selectedLevel = levelOptions.find((l) => l.id === draft.level_id);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Program</Label>
        <Select
          value={draft.program_id || ""}
          onValueChange={(v) =>
            setDraft({ program_id: v ?? "", course_id: "", strand_id: "", level_id: "" })
          }
        >
          <SelectTrigger>
            <span className="truncate">{selectedProgram?.name ?? "Select a program"}</span>
          </SelectTrigger>
          <SelectContent>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProgram && showCourses && (
        <div className="space-y-2">
          <Label>Course</Label>
          <Select
            value={draft.course_id || ""}
            onValueChange={(v) => setDraft({ course_id: v ?? "", strand_id: "", level_id: "" })}
          >
            <SelectTrigger>
              <span className="truncate">
                {selectedCourse
                  ? `${selectedCourse.name}${selectedCourse.code ? ` (${selectedCourse.code})` : ""}`
                  : "Select a course"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {selectedProgram.courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {c.code ? `(${c.code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedProgram && showStrands && (
        <div className="space-y-2">
          <Label>Strand</Label>
          <Select
            value={draft.strand_id || ""}
            onValueChange={(v) => setDraft({ strand_id: v ?? "", course_id: "", level_id: "" })}
          >
            <SelectTrigger>
              <span className="truncate">{selectedStrand?.name ?? "Select a strand"}</span>
            </SelectTrigger>
            <SelectContent>
              {selectedProgram.strands.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedProgram && (
        <div className="space-y-2">
          <Label>Level</Label>
          <Select value={draft.level_id || ""} onValueChange={(v) => setDraft({ level_id: v ?? "" })}>
            <SelectTrigger>
              <span className="truncate">{selectedLevel?.name ?? "Select a level"}</span>
            </SelectTrigger>
            <SelectContent>
              {levelOptions.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({
  draft,
  catalog,
  editMode,
  busy,
  onSubmit,
  onBack,
}: {
  draft: ApplicationDraft;
  catalog: PublicPortalInfo;
  editMode: boolean;
  busy: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const program = catalog.programs.find((p) => p.id === draft.program_id);
  const course = program?.courses.find((c) => c.id === draft.course_id);
  const strand = program?.strands.find((s) => s.id === draft.strand_id);
  const courseLevel = (course?.levels ?? []).find((l) => l.id === draft.level_id);
  const strandLevel = (strand?.levels ?? []).find((l) => l.id === draft.level_id);
  const programLevel = (program?.levels ?? []).find((l) => l.id === draft.level_id);
  const level = courseLevel ?? strandLevel ?? programLevel;

  return (
    <div className="space-y-4">
      <dl className="divide-y border rounded-lg text-sm">
        <Row label="Name" value={[draft.first_name, draft.middle_name, draft.last_name].filter(Boolean).join(" ")} />
        <Row label="Age" value={draft.age} />
        <Row label="Address" value={draft.address} />
        <Row label="Contact number" value={draft.contact_number} />
        <Row label="Last school graduated" value={draft.last_school_graduated} />
        <Row label="Program" value={program?.name} />
        {course ? <Row label="Course" value={`${course.name}${course.code ? ` (${course.code})` : ""}`} /> : null}
        {strand ? <Row label="Strand" value={strand.name} /> : null}
        <Row label="Level" value={level?.name} />
      </dl>

      <div className="flex justify-between pt-1">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onSubmit} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {editMode ? "Save Changes" : "Submit Application"}
        </Button>
      </div>
    </div>
  );
}

function SuccessStep({ applicationCode }: { applicationCode: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      <h2 className="text-lg font-semibold">Application submitted</h2>
      <p className="text-sm text-muted-foreground">
        Keep your application code safe. Use it to track your application status.
      </p>
      <div className="rounded-lg border bg-muted/40 px-6 py-3 font-mono text-2xl font-bold tracking-widest">
        {applicationCode || "—"}
      </div>
      <p className="text-xs text-muted-foreground">
        Our registrar will review it soon.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 px-3 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value || "—"}</dd>
    </div>
  );
}

function LockedApplicationView({ application }: { application: EnrollmentApplicationView }) {
  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <span>
            Your application is <span className="font-semibold capitalize">{application.status}</span> and
            has been locked for review. You can no longer edit it.
          </span>
        </div>
        <dl className="mt-4 divide-y rounded-lg border text-sm">
          <Row
            label="Application code"
            value={
              <span className="font-mono font-semibold">{application.application_code}</span>
            }
          />
          <Row
            label="Status"
            value={<span className="inline-flex items-center gap-2"><StatusPill status={application.status} /></span>}
          />
          <Row
            label="Name"
            value={[application.first_name, application.middle_name, application.last_name]
              .filter(Boolean)
              .join(" ")}
          />
          <Row label="Age" value={application.age ?? null} />
          <Row label="Address" value={application.address} />
          <Row label="Contact number" value={application.contact_number} />
          <Row label="Last school" value={application.last_school_graduated} />
        </dl>
      </CardContent>
    </Card>
  );
}

function CheckStatus({
  draftCtx,
}: {
  draftCtx: UseEnrollmentDraftResult;
}) {
  const { application, email } = draftCtx;

  // The applicant is already verified in a live session and has an existing
  // application — surface the code + status directly instead of asking them to
  // type it again.
  if (application) {
    return (
      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="space-y-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Application code</span>
              <div className="rounded-lg border bg-muted/40 px-4 py-3 font-mono text-2xl font-bold tracking-widest">
                {application.application_code}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusPill status={application.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">
                {[application.first_name, application.middle_name, application.last_name]
                  .filter(Boolean)
                  .join(" ")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{email}</span>
            </div>
          </div>

          {application.status === "rejected" && application.rejection_reason && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <span className="font-medium">Your application was not approved.</span>{" "}
              {application.rejection_reason}
            </p>
          )}
          {application.status === "locked" && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              Your application is locked for review — editing is disabled.
            </p>
          )}
          {application.status === "approved" && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              <span className="font-medium">Congratulations!</span> Your application has been approved.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return <LookupStatus />;
}

function LookupStatus() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [results, setResults] = useState<PublicApplicationLookup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLookup = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const res = await enrollmentPortalApi.lookupApplication(code.trim(), email.trim() || undefined);
      setResults(res);
    } catch (err) {
      setError(errorMessage(err, "No application found for that code."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <div className="space-y-2">
          <Label htmlFor="code">Application code</Label>
          <Input
            id="code"
            placeholder="e.g. AB12"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status-email">Email (optional)</Label>
          <Input
            id="status-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button onClick={handleLookup} disabled={!code || busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check status"}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {results && results.length > 0 && (
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.application_code} className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
                <div>
                  <div className="font-medium">{r.full_name}</div>
                  <div className="text-xs text-muted-foreground">{r.application_code}</div>
                </div>
                <StatusPill status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    locked: "bg-slate-200 text-slate-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium capitalize", map[status] ?? "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}