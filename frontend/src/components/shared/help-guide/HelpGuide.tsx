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
import { GUIDES } from "./guides.data";

interface HelpGuideProps {
  slug: string;
}

export function HelpGuide({ slug }: HelpGuideProps) {
  const guide = GUIDES[slug];
  const folder = `/guides/admin/${slug.replace("admin_", "")}`;

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            size="icon"
            aria-label="Help"
            className="h-9 w-9 shrink-0 rounded-full sm:h-10 sm:w-10"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        }
      />

      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col"
        showCloseButton={false}
      >
        {!guide ? (
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
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div className="flex items-center justify-center">
                      <img
                        src={`${folder}/step-${index + 1}.png`}
                        alt={`Step ${index + 1}`}
                        className="w-full rounded-lg border border-border object-contain shadow-sm"
                        style={{ maxHeight: 260 }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const placeholder = target.nextElementSibling as HTMLElement | null;
                          if (placeholder) {
                            placeholder.style.display = "flex";
                          }
                        }}
                      />
                      <div
                        className="hidden h-32 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/20"
                      >
                        <span className="text-xs text-muted-foreground">No image</span>
                      </div>
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
