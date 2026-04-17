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
//import { useGradingSchemeLibrary } from "@/hooks/educator/useGradingSchemes";
import type { GradingScheme, GradingSchemeComponentDto } from "@/types/admin/grading-scheme.types";

interface ImportFromLibraryDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  onImport:     (components: GradingSchemeComponentDto[], schemeName: string) => void;
}

export function ImportFromLibraryDialog({
  open,
  onOpenChange,
  onImport,
}: ImportFromLibraryDialogProps) {
  const { data, isLoading } = useGradingSchemeLibrary();
  const library: GradingScheme[] = Array.isArray(data) ? data : [];

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = library.find((s) => s.id === selectedId) ?? null;

  const handleImport = () => {
    if (!selected) return;
    const components: GradingSchemeComponentDto[] = selected.components.map((c) => ({
      name:       c.name,
      type:       c.type,
      weight:     c.weight,
      maxScore:   c.maxScore ?? undefined,
      isOptional: c.isOptional,
    }));
    onImport(components, selected.name);
    onOpenChange(false);
    setSelectedId(null);
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
            Import from Library
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select a grading scheme from your library to load its components.
          </p>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 w-full animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : library.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed py-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">No saved schemes</p>
              <p className="text-xs text-muted-foreground">
                Save a scheme as a template first to import it here.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="space-y-2 pr-2">
                {library.map((scheme) => (
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
                      <div>
                        <p className="text-sm font-medium">{scheme.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {scheme.components.length} component
                          {scheme.components.length !== 1 ? "s" : ""}
                          {" · "}
                          {scheme.components
                            .filter((c) => !c.isOptional)
                            .reduce((sum, c) => sum + c.weight, 0)}
                          % total
                        </p>
                      </div>
                      {selectedId === scheme.id && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
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
          <Button disabled={!selected} onClick={handleImport}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}