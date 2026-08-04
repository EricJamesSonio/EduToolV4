"use client";

import { Fragment, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, Download } from "lucide-react";
import { downloadCsv } from "@/utils/csv.util";
import { toast } from "sonner";

export interface CredentialsCardRow {
  label: string;
  value: string;
  mono?: boolean;
}

interface CredentialsCardProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  rows: CredentialsCardRow[];
  password: string;
  filename: string;
}

export function CredentialsCard({
  open,
  onClose,
  title = "Account created",
  rows,
  password,
  filename,
}: CredentialsCardProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = [
      ...rows.map((r) => `${r.label}: ${r.value}`),
      `Password: ${password}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Credentials copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const record: Record<string, string> = { Password: password };
    for (const r of rows) {
      record[r.label] = r.value;
    }
    downloadCsv([record], filename);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <div className="space-y-4 py-2">
        <p className="text-sm text-muted-foreground not-interactive">
          Save these credentials now — the password will not be shown again.
        </p>

        <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
          {rows.map((r, i) => (
            <Fragment key={r.label}>
              {i > 0 && <Separator />}
              <CredentialRow label={r.label} value={r.value} mono={r.mono} />
            </Fragment>
          ))}
          <Separator />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide not-interactive">
              Password
            </span>
            <Badge
              variant="secondary"
              className="font-mono text-sm px-3 py-1 select-all"
            >
              {password}
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
    </Modal>
  );
}

function CredentialRow({
  label, value, mono = false,
}: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide not-interactive">
        {label}
      </span>
      <span className={`text-sm font-medium truncate max-w-[240px] not-interactive ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
