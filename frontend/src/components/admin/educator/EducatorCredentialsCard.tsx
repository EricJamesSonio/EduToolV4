"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, Download } from "lucide-react";
import { downloadCsv } from "@/utils/csv.util";
import { toast } from "sonner";

interface EducatorCredentials {
  fullName:     string;
  email:        string;
  educatorCode: string;
  password:     string;
}

interface EducatorCredentialsCardProps {
  open:        boolean;
  onClose:     () => void;
  credentials: EducatorCredentials;
  title?:      string;
}

export function EducatorCredentialsCard({
  open,
  onClose,
  credentials,
  title = "Educator account created",
}: EducatorCredentialsCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = [
      `Full Name: ${credentials.fullName}`,
      `Email: ${credentials.email}`,
      `Educator ID: ${credentials.educatorCode}`,
      `Password: ${credentials.password}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Credentials copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadCsv(
      [{
        "Full Name":    credentials.fullName,
        Email:          credentials.email,
        "Educator ID":  credentials.educatorCode,
        Password:       credentials.password,
      }],
      `educator-credentials-${credentials.email}`
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Save these credentials now — the password will not be shown again.
          </p>

          <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
            <CredentialRow label="Full Name"   value={credentials.fullName} />
            <Separator />
            <CredentialRow label="Email"       value={credentials.email} />
            <Separator />
            <CredentialRow label="Educator ID" value={credentials.educatorCode} mono />
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Password
              </span>
              <Badge variant="secondary" className="font-mono text-sm px-3 py-1 select-all">
                {credentials.password}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}>
              {copied
                ? <><Check className="mr-2 h-4 w-4 text-green-600" />Copied!</>
                : <><Copy className="mr-2 h-4 w-4" />Copy Credentials</>}
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </div>

          <Button className="w-full" onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CredentialRow({
  label, value, mono = false,
}: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-sm font-medium truncate max-w-[240px] ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}