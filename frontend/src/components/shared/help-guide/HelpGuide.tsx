"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useGuideBySlug } from "@/hooks/platform/useGuides";
import { API_BASE_URL } from "@/config/api.config";

function resolveImageUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith("/uploads/") ? `${API_BASE_URL}${url}` : url;
}

interface HelpGuideProps {
  slug: string;
}

export function HelpGuide({ slug }: HelpGuideProps) {
  const { data: guide, isLoading } = useGuideBySlug(slug);

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button size="icon-sm" className="rounded-full">
            <HelpCircle className="h-4 w-4" />
          </Button>
        }
      />

      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col"
        showCloseButton={false}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : !guide ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Guide not available
          </div>
        ) : (
          <>
            <SheetHeader className="px-6 pt-6 pb-2 border-b border-border shrink-0">
              <SheetTitle className="text-lg font-semibold">{guide.title}</SheetTitle>
              {guide.description && (
                <SheetDescription className="text-sm text-muted-foreground mt-1">
                  {guide.description}
                </SheetDescription>
              )}
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10">
              {guide.steps.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  No steps in this guide
                </div>
              ) : (
                guide.steps.map((step, index) => (
                  <div key={step.id} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* LEFT: text, vertically centered to image */}
                    <div className="flex items-center">
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
                          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                            {step.content}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: image */}
                    <div className="flex items-center justify-center">
                      {step.imageUrl ? (
                        <img
                          src={resolveImageUrl(step.imageUrl)}
                          alt={`Step ${index + 1}`}
                          className="w-full rounded-lg border border-border object-contain shadow-sm"
                          style={{ maxHeight: 260 }}
                        />
                      ) : (
                        <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
