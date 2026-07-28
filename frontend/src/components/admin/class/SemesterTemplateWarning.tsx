"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";

interface SemesterTemplateWarningProps {
  onDiscard: () => void;
}

export function SemesterTemplateWarning({ onDiscard }: SemesterTemplateWarningProps) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300 not-interactive">
          No semester template assigned
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 not-interactive">
          This program doesn&apos;t have a semester template yet. Classes can&apos;t be
          created until one is assigned.
        </p>
        <button
          type="button"
          onClick={onDiscard}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:underline"
        >
          Go to Semester Settings
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
