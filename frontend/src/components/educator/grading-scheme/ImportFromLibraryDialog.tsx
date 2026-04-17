"use client";

import { useState } from "react";
import { Check, Library } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import type {
  GradingScheme,
  GradingSchemeComponentDto,
} from "@/types/admin/grading-scheme.types";

interface ImportFromLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /**
   * IMPORTANT:
   * This is NOT a backend library.
   * This is just existing schemes passed from parent.
   */
  schemes: GradingScheme[];

  onImport: (
    components: GradingSchemeComponentDto[],
    schemeName: string
  ) => void;
}

export function ImportFromLibraryDialog({
  open,
  onOpenChange,
  schemes,
  onImport,
}: ImportFromLibraryDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    schemes.find((s) => s.id === selectedId) ?? null;

  const handleImport = () => {
    if (!selected) return;

    const components: GradingSchemeComponentDto[] =
      (selected.components ?? []).map((c) => ({
        name: c.name,
        type: c.type,
        weight: c.weight,
        maxScore: c.maxScore ?? undefined,
        isOptional: c.isOptional,
      }));

    onImport(components, selected.name);

    setSelectedId(null);
    onOpenChange(false);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) setSelectedId(null);
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Import Components
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">

          <p className="text-sm text-muted-foreground">
            Select an existing grading scheme to copy its components.
          </p>

          {schemes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed py-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No grading schemes found
              </p>
              <p className="text-xs text-muted-foreground">
                Create a grading scheme first.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-64">

              <div className="space-y-2 pr-2">

                {schemes.map((scheme) => {
                  const totalWeight =
                    (scheme.components ?? [])
                      .filter((c) => !c.isOptional)
                      .reduce((sum, c) => sum + c.weight, 0);

                  return (
                    <button
                      key={scheme.id}
                      type="button"
                      onClick={() => setSelectedId(scheme.id)}
                      className={cn(
                        "w-full rounded-md border px-4 py-3 text-left transition-colors",
                        "hover:bg-muted/50",
                        selectedId === scheme.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background"
                      )}
                    >
                      <div className="flex items-center justify-between">

                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">
                            {scheme.name}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {(scheme.components?.length ?? 0)} components ·{" "}
                            {totalWeight}% required
                          </p>
                        </div>

                        {selectedId === scheme.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}

              </div>

            </ScrollArea>
          )}

        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            disabled={!selected}
            onClick={handleImport}
          >
            Import
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}