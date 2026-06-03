"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap, Sparkles, BookOpen } from "lucide-react";

interface WelcomeModalProps {
  role: "educator" | "student";
}

const STORAGE_KEY: Record<string, string> = {
  educator: "welcome-seen-educator",
  student: "welcome-seen-student",
};

const CONTENT = {
  educator: {
    title: "Welcome, Educator!",
    icon: GraduationCap,
    features: [
      "Manage your classes and students",
      "Create and grade assessments",
      "Build interactive presentations",
      "Track attendance and performance",
    ],
    helpHref: "/educator/help",
  },
  student: {
    title: "Welcome, Student!",
    icon: Sparkles,
    features: [
      "View your grades and progress",
      "Access class activities and assessments",
      "Join scheduled meetings",
      "Track your attendance",
    ],
    helpHref: "/student/help",
  },
};

export function WelcomeModal({ role }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const seen = localStorage.getItem(STORAGE_KEY[role]);
    if (!seen) {
      setOpen(true);
    }
  }, [role]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY[role], "1");
    }
    setOpen(false);
  };

  const content = CONTENT[role];
  const Icon = content.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
      <DialogContent
        className="sm:max-w-[600px] p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        <div className="relative min-h-[280px] sm:min-h-[300px]">
          {/* ─── Background image — same on all screens ────── */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/robot.png')",
              backgroundSize: "cover",
              backgroundPosition: "left center",
            }}
          />
          {/* Gradient overlay — transparent on left → solid bg on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-background" />

          {/* ─── Content — right side, takes more space on mobile ─── */}
          <div className="relative z-10 ml-auto flex w-full max-w-[65%] min-h-[280px] flex-col justify-center gap-4 px-4 py-6 sm:max-w-[55%] sm:min-h-[300px] sm:gap-5 sm:px-8 sm:py-8">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                {content.title}
              </h2>
            </div>

            {/* Feature list */}
            <ul className="space-y-2">
              {content.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Help link */}
            <Link
              href={content.helpHref}
              onClick={handleDismiss}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-3 hover:text-primary/80"
            >
              <BookOpen className="h-4 w-4" />
              Read the Help page
            </Link>

            {/* Action */}
            <Button onClick={handleDismiss} className="self-start">
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
