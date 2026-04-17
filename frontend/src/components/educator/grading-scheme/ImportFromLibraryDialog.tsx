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
  onImport: (components: GradingSchemeComponentDto[], schemeName: string) => void;
}

/**
 * ⚠️ TEMP IMPLEMENTATION
 * Backend does NOT yet support library endpoint.
 * So this is disabled/empty safe UI.
 */
export function ImportFromLibraryDialog({
  open,
  onOpenChange,
}: ImportFromLibraryDialogProps) {
  const [selectedId] = useState<string | null>(null);

  const handleOpenChange = (o: boolean) => {
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
            Library feature is not available yet.
          </p>

          <div className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed py-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No library data
            </p>
            <p className="text-xs text-muted-foreground">
              This feature is pending backend support.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}