"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SharePortalDialogProps {
  open: boolean;
  onClose: () => void;
  periodName: string;
  token: string;
  orgSlug: string | null;
}

export function SharePortalDialog({
  open,
  onClose,
  periodName,
  token,
  orgSlug,
}: SharePortalDialogProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/enroll/${orgSlug ?? ""}/${token}`;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Portal link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Share enrollment portal
          </DialogTitle>
          <DialogDescription>
            Share this link with applicants so they can open the enrollment form for{" "}
            <span className="font-medium text-foreground">{periodName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Input readOnly value={url} className="font-mono text-xs" onClick={(e) => e.currentTarget.select()} />
          <p className="text-xs text-muted-foreground">
            Anyone with this link can start an application for this period. It points to the public
            portal at /enroll/{orgSlug ?? "your-org"}/{token}.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={copyUrl}>
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}