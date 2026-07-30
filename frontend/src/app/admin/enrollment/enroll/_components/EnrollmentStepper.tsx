// ===== File: frontend\src\app\admin\enrollment\enroll\_components\EnrollmentStepper.tsx =====
"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "done" | "active" | "pending";

export interface StepDef {
  key: string;
  label: string;
  description?: string;
  status: StepStatus;
  onClick?: () => void;
}

interface EnrollmentStepperProps {
  steps: StepDef[];
}

export function EnrollmentStepper({ steps }: EnrollmentStepperProps) {
  return (
    <div className="flex items-start rounded-xl border border-border bg-card px-6 py-5">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={step.key} className="flex-1 relative">
            {!isLast && (
              <div
                className={cn(
                  "absolute top-[15px] left-[calc(50%+20px)] right-[calc(-50%+20px)] h-0.5",
                  step.status === "done" ? "bg-success" : "bg-border"
                )}
              />
            )}
            <button
              type="button"
              onClick={step.onClick}
              disabled={!step.onClick}
              className={cn(
                "relative z-10 flex w-full flex-col items-center gap-1.5 text-center",
                step.onClick ? "cursor-pointer" : "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  step.status === "done" &&
                    "border-success bg-success text-success-foreground",
                  step.status === "active" &&
                    "border-primary bg-primary/10 text-primary",
                  step.status === "pending" &&
                    "border-border bg-background text-muted-foreground"
                )}
              >
                {step.status === "done" ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  step.status === "pending"
                    ? "text-muted-foreground/60"
                    : "text-foreground"
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="max-w-[120px] truncate text-[11px] leading-tight text-muted-foreground">
                  {step.description}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}