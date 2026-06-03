"use client";

import { useState } from "react";
import { Check, Library, Loader2 } from "lucide-react";

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

import { useEducatorTemplateLibrary } from "@/hooks/educator/useGradingSchemeTemplates";

import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";
import type { GradingSchemeComponentDto } from "@/types/admin/grading-scheme.types";

interface ImportFromLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (components: GradingSchemeComponentDto[], schemeName: string) => void;
}

export function ImportFromLibraryDialog({
  open,
  onOpenChange,
  onImport,
}: ImportFromLibraryDialogProps) {
  const { data: library, isLoading } = useEducatorTemplateLibrary();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleOpenChange = (o: boolean) => {
    if (!o) setSelectedId(null);
    onOpenChange(o);
  };

  const handleImport = () => {
    if (!selectedId || !library) return;

    const template = library.find((t) => t.id === selectedId);
    if (!template) return;

    const components: GradingSchemeComponentDto[] = template.components.map((c) => ({
      name: c.name,
      type: c.type,
      weight: c.weight,
      maxScore: c.maxScore ?? undefined,
      isOptional: false,
    }));

    onImport(components, template.name);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Import from Library
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading templates...
            </div>
          ) : !library || library.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed py-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No templates available
              </p>
              <p className="text-xs text-muted-foreground">
                Create templates in the Grading Scheme Library first.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="space-y-2 pr-2">
                {library.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedId(template.id)}
                    className={cn(
                      "w-full rounded-md border px-4 py-3 text-left transition-colors",
                      "hover:bg-muted/50",
                      selectedId === template.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {template.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {template.components.length} component{template.components.length !== 1 ? "s" : ""}
                          {template.programType ? ` · ${template.programType}` : ""}
                        </p>
                      </div>

                      {selectedId === template.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!selectedId} onClick={handleImport}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
