// ===== File: frontend\src\app\login\page.tsx =====
"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  AlertCircle,
  BookOpen,
  ClipboardCheck,
  Video,
} from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!trimmedPassword) {
      setError("Password is required.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await login(trimmedEmail, trimmedPassword);
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 401) {
        setError("Incorrect email or password. Please try again.");
      } else if (status === 403) {
        setError("Your account has been suspended. Contact your administrator.");
      } else if (status === 429) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — wavy brand shape (desktop only) */}
   {/* Left panel — wavy brand shape (desktop only) */}
      <div className="relative hidden md:block md:w-[52%] lg:w-[58%] overflow-hidden bg-background">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* base panel fill — brand primary */}
          <path
            d="M0 0 L70 0 C 88 10, 74 22, 84 31 C 95 40, 108 45, 94 56
               C 82 66, 70 60, 79 75 C 88 90, 65 96, 73 100 L0 100 Z"
            className="fill-primary"
          />
          {/* lighter tint overlay wave, offset for depth — same hue, lower opacity */}
          <path
            d="M0 0 L74 0 C 90 9, 79 19, 87 27 C 96 35, 106 39, 95 49
               C 85 58, 75 53, 82 66 C 89 79, 70 86, 76 98 L0 98 Z"
            className="fill-primary"
            opacity="0.35"
          />
        </svg>

        {/* light dot texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* content */}
        <div className="relative z-10 flex h-full flex-col justify-between px-10 lg:px-14 py-10 text-primary-foreground max-w-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm bg-white/15 backdrop-blur-sm">
              <img
                src="/edutool-orange.png"
                alt="Relief-ED logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">
              Relief-ED
            </span>
          </div>

          <div className="flex flex-col gap-8">
            <div>
              <h1 className="font-marketing font-extrabold text-4xl md:text-5xl leading-tight tracking-tight text-foreground">
                Every class, grade, and meeting — in one place your school
                can trust.
              </h1>
              <p className="mt-3 text-sm text-primary-foreground/85">
                Sign in to manage classes, track attendance, and keep
                grading consistent all year.
              </p>
            </div>

            {/* floating report-card mock */}
            <div className="relative w-full max-w-[280px]">
              <div className="rotate-[-3deg] rounded-2xl bg-card text-card-foreground shadow-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Grade 10 · Section A
                    </p>
                    <p className="font-heading font-semibold text-sm">
                      Term 2 Overview
                    </p>
                  </div>
                  <div className="relative h-11 w-11 shrink-0">
                    <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
                      <circle
                        cx="18" cy="18" r="15.5" fill="none"
                        className="stroke-muted-foreground/20" strokeWidth="4"
                      />
                      <circle
                        cx="18" cy="18" r="15.5" fill="none"
                        className="stroke-primary" strokeWidth="4" strokeLinecap="round"
                        strokeDasharray="97.4" strokeDashoffset="9.7"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
                      90%
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-end gap-1.5 h-14">
                  {[40, 65, 50, 80, 70, 90, 60].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-primary"
                      style={{ height: `${h}%`, opacity: 0.5 + i * 0.07 }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Average grade trend, last 7 assessments
                </p>
              </div>

              <div className="absolute -bottom-5 -right-6 rotate-[4deg] rounded-xl bg-card text-card-foreground shadow-lg px-3.5 py-2.5">
                <p className="text-[11px] text-muted-foreground">Today</p>
                <p className="font-heading font-semibold text-xs">
                  3 classes scheduled
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { icon: BookOpen, label: "Classes & Lessons" },
              { icon: ClipboardCheck, label: "Grading & Attendance" },
              { icon: Video, label: "Live Meetings" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs text-primary-foreground/90"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full md:w-[48%] lg:w-[42%] flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 md:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                <img
                  src="/edutool-orange.png"
                  alt="Relief-ED logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight">
                Relief-ED
              </span>
            </Link>
          </div>

          <Card className="shadow-sm border-0 md:shadow-none">
            <CardHeader className="pb-4 pt-6 px-6">
              <h1 className="font-marketing font-extrabold text-3xl md:text-4xl tracking-tight">
                Welcome <span className="gradient-text">back</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to your account to continue.
              </p>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value.replace(/\s/g, ""))
                      }
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Log in"
                  )}
                </Button>

                <div className="pt-2 text-center">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}