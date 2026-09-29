"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Sparkles, BookOpen } from "lucide-react";
import {
  WelcomeActions,
  WelcomeDialogShell,
  WelcomeFeatureList,
  WelcomeHeader,
} from "@/components/shared/WelcomeDialogShell";

interface WelcomeModalProps {
  role: "educator" | "student";
}

const STORAGE_KEY: Record<WelcomeModalProps["role"], string> = {
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
} as const;

export function WelcomeModal({ role }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY[role])) {
      setOpen(true);
    }
  }, [role]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY[role], "1");
    setOpen(false);
  };

  const content = CONTENT[role];

  return (
    <WelcomeDialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) handleDismiss();
      }}
    >
      <WelcomeHeader icon={content.icon} title={content.title} />

      <WelcomeFeatureList features={content.features} />

      <Link
        href={content.helpHref}
        onClick={handleDismiss}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      >
        <BookOpen className="h-4 w-4" />
        Read the Help page
      </Link>

      <WelcomeActions>
        <Button onClick={handleDismiss} className="w-full sm:w-auto">
          Got it
        </Button>
      </WelcomeActions>
    </WelcomeDialogShell>
  );
}