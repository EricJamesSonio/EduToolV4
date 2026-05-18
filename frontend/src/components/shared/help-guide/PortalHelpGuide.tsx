"use client";

import { useGuidesWithSteps } from "@/hooks/platform/useGuides";
import type { GuidePortal } from "@/types/platform/guide.types";
import { API_BASE_URL } from "@/config/api.config";
import { HelpCircle } from "lucide-react";
import { Loader2 } from "lucide-react";

interface PortalHelpGuideProps {
  portal: GuidePortal;
}

function resolveImageUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith("/uploads/") ? `${API_BASE_URL}${url}` : url;
}

export function PortalHelpGuide({ portal }: PortalHelpGuideProps) {
  const { data: guides, isLoading } = useGuidesWithSteps(portal);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading help guides...
      </div>
    );
  }

  if (!guides || guides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <HelpCircle className="mb-3 h-10 w-10" />
        <p>No help guides available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find answers to common questions about using the {portal} portal.
        </p>
      </div>

      {guides.map((guide) => (
        <section key={guide.id}>
          <h2 className="text-lg font-semibold text-foreground">{guide.title}</h2>
          {guide.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{guide.description}</p>
          )}

          <div className="mt-4 space-y-1">
            {guide.steps.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No guides steps yet.</p>
            ) : (
              guide.steps.map((step) => (
                <details
                  key={step.id}
                  className="group border-b border-border/40 last:border-b-0"
                >
                  <summary className="flex cursor-pointer items-center gap-2 py-3 text-sm font-medium text-foreground transition-colors hover:text-primary list-none [&::-webkit-details-marker]:hidden">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground group-open:bg-primary group-open:text-primary-foreground transition-colors">
                      ?
                    </span>
                    <span>{step.title ?? step.content.slice(0, 60)}</span>
                    <svg
                      className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </summary>
                  <div className="pb-4 pl-7">
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {step.content}
                    </p>
                    {step.imageUrl && (
                      <img
                        src={resolveImageUrl(step.imageUrl)}
                        alt={step.title ?? "Help image"}
                        className="mt-3 max-w-full rounded-lg border border-border object-contain shadow-sm"
                        style={{ maxHeight: 300 }}
                      />
                    )}
                  </div>
                </details>
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
