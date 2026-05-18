"use client";

import type { GuideStep } from "@/types/platform/guide.types";

interface GuidePreviewProps {
  steps: GuideStep[];
}

export function GuidePreview({ steps }: GuidePreviewProps) {
  if (steps.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No guide steps added yet
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {steps.map((step, index) => (
        <div key={step.id} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT: Text - vertically centered, pointing to the image */}
          <div className="relative flex flex-col justify-center">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </div>
              <div className="space-y-1">
                {step.title && (
                  <h3 className="font-semibold text-foreground">
                    {step.title}
                  </h3>
                )}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.text}
                </p>
              </div>
            </div>
            {/* Arrow pointing to the image (hidden on mobile) */}
            {step.imageUrl && (
              <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 lg:block">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="rotate-180 text-border"
                >
                  <path
                    d="M2 1L10 6L2 11V1Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* RIGHT: Image - vertically aligned with text */}
          {step.imageUrl ? (
            <div className="flex items-center justify-center">
              <img
                src={step.imageUrl}
                alt={`Step ${index + 1}`}
                className="w-full rounded-lg border border-border object-contain shadow-sm"
                style={{ maxHeight: 240 }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  No image
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
