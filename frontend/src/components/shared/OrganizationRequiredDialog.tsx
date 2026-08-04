"use client";

import { Building2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrganizationSetupForm } from "@/components/shared/OrganizationSetupForm";

interface OrganizationRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationRequiredDialog({
  open,
  onOpenChange,
}: OrganizationRequiredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false); }}>
      <DialogContent className="sm:max-w-[420px]" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Organization Required</DialogTitle>
          </div>
          <DialogDescription>
            You must create an organization first before you can manage school
            years, programs, enrollments, and other records. Create one now to
            continue.
          </DialogDescription>
        </DialogHeader>

        <OrganizationSetupForm onSuccess={() => onOpenChange(false)} />

        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
