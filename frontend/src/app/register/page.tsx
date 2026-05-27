"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register, verifyOtp, resendOtp } from "@/api/auth/register.api";

type Step = "form" | "otp" | "submitted";
type Role = "admin" | "educator" | "student";

const planLabels: Record<string, string> = {
  free: "Free",
  standard: "Standard ($20/mo)",
  pro: "Pro ($50/mo)",
};

type RadioGroupProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
};

function RadioGroup({ label, options, value, onChange }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
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
    </div>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "free";

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [role, setRole] = useState("");
  const [studentCount, setStudentCount] = useState("");
  const [programsDepartments, setProgramsDepartments] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!role || !studentCount || !programsDepartments) {
      setError("Please complete all selections.");
      return;
    }

    setLoading(true);
    try {
      await register({ email, fullName, plan, institutionName, role, studentCount, programsDepartments });
      setStep("otp");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp({ email, code });
      setStep("submitted");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      await resendOtp(email);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
              <img src="/edutool.png" alt="EduTool" className="w-full h-full object-cover" />
            </div>
            <span className="font-heading font-bold text-xl">EduTool</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {step === "form" && "Create Your Account"}
            {step === "otp" && "Verify Your Email"}
            {step === "submitted" && "Request Submitted"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "form" && `Selected plan: ${planLabels[plan] ?? plan}`}
            {step === "otp" && `Enter the code sent to ${email}`}
            {step === "submitted" && "The platform owner will review and create your account"}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-3">
              {error}
            </div>
          )}

          {step === "form" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institutionName">Institution Name</Label>
                <Input
                  id="institutionName"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. Manila Central University"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  required
                />
              </div>

              <RadioGroup
                label="Your Role"
                options={["Principal", "IT Director", "Admin Officer", "Other"]}
                value={role}
                onChange={setRole}
              />

              <RadioGroup
                label="Student Count"
                options={["Under 500", "500 – 1,000", "1,000 – 3,000", "3,000+"]}
                value={studentCount}
                onChange={setStudentCount}
              />

              <RadioGroup
                label="Programs / Departments"
                options={["1–5", "6–15", "16–30", "30+"]}
                value={programsDepartments}
                onChange={setProgramsDepartments}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Verification Code"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Registration"}
              </Button>
              <button
                type="button"
                onClick={handleResend}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                Resend code
              </button>
            </form>
          )}

          {step === "submitted" && (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground text-sm">
                Your registration request has been submitted. The platform owner
                will review your application and create your account.
              </p>
              {institutionName && (
                <div className="rounded-lg bg-muted/50 px-4 py-3 text-left text-sm space-y-1">
                  <p><span className="font-medium">Institution:</span> {institutionName}</p>
                  <p><span className="font-medium">Role:</span> {role}</p>
                  <p><span className="font-medium">Students:</span> {studentCount}</p>
                  <p><span className="font-medium">Programs/Depts:</span> {programsDepartments}</p>
                </div>
              )}
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push("/")}
              >
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