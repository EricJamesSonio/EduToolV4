"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check, Copy, Download, Users, AlertCircle } from "lucide-react";
import { educatorApi, type BulkCreateEducatorResult, type BulkCreateResponse } from "@/api/admin/educator.api";
import { downloadCsv } from "@/utils/csv.util";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queryKeys.factory";

interface BulkCreateEducatorDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ParsedLine {
  raw: string;
  fullName: string;
  id: string;
  error?: string;
}

function parseLines(raw: string): ParsedLine[] {
  return raw.split(/\n/).map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return { raw: "", fullName: "", id: "", error: "Empty line" };

    const lastSpace = trimmed.lastIndexOf(" ");
    if (lastSpace === -1) {
      return { raw: trimmed, fullName: "", id: "", error: "Missing ID — provide name and ID separated by a space" };
    }

    const fullName = trimmed.slice(0, lastSpace).trim();
    const id = trimmed.slice(lastSpace + 1).trim();

    if (fullName.length < 2) {
      return { raw: trimmed, fullName: "", id: "", error: "Name too short (min 2 chars)" };
    }
    if (!id) {
      return { raw: trimmed, fullName: "", id: "", error: "Missing ID" };
    }

    return { raw: trimmed, fullName, id };
  }).filter((p) => p.raw !== "");
}

export function BulkCreateEducatorDialog({
  open,
  onClose,
}: BulkCreateEducatorDialogProps) {
  const [raw, setRaw] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [results, setResults] = useState<BulkCreateResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const parsed = useMemo(() => parseLines(raw), [raw]);
  const valid = useMemo(() => parsed.filter((p) => !p.error), [parsed]);
  const hasErrors = parsed.some((p) => p.error);

  const handleCreate = async () => {
    setIsPending(true);
    try {
      const res = await educatorApi.bulkCreate(
        valid.map((p) => ({ fullName: p.fullName, id: p.id }))
      );
      const data: BulkCreateResponse = Array.isArray(res as any) ? { created: res as any, skipped: [] } : (res as BulkCreateResponse);
      setResults(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.educators.all });
      const { created, skipped } = data;
      if (skipped.length > 0) {
        toast.success(`Created ${created.length}, skipped ${skipped.length} duplicate${skipped.length === 1 ? "" : "s"}.`);
      } else {
        toast.success(`Created ${created.length} educator${created.length === 1 ? "" : "s"}.`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to create educators.");
    } finally {
      setIsPending(false);
    }
  };

  const handleCopyAll = async () => {
    const created = results?.created ?? [];
    const text = created
      .map(
        (r: BulkCreateEducatorResult) =>
          `Full Name: ${r.fullName}\nEmail: ${r.email}\nEducator ID: ${r.educatorId}\nPassword: ${r.plainPassword}`
      )
      .join("\n\n");
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("All credentials copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!results) return;
    downloadCsv(
      results.created.map((r: BulkCreateEducatorResult) => ({
        "Full Name": r.fullName,
        Email: r.email,
        "Educator ID": r.educatorId,
        Password: r.plainPassword,
      })),
      "educator-credentials"
    );
  };

  const handleDone = () => {
    setResults(null);
    setRaw("");
    onClose();
  };

  const handleClose = () => {
    if (results) {
      handleDone();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={results ? "Educators Created" : "Bulk Create Educators"}
      size={results ? "lg" : "lg"}
    >
      {!results ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-edu">
              Paste one per line: <span className="font-mono text-xs text-muted-foreground">Full Name ID</span>
            </Label>
            <Textarea
              id="bulk-edu"
              placeholder={"Eric jame Sonio 22-2081\nMaria Santos MS-2024-001\nJuan Dela Cruz EDU-A3F9K2LM"}
              rows={8}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              disabled={isPending}
              className="font-mono text-sm"
            />
          </div>

          {parsed.length > 0 && (
            <div className="max-h-[240px] overflow-y-auto rounded-lg border bg-muted/40 p-3 space-y-1.5">
              <div className="grid grid-cols-[1fr_auto] gap-x-3 text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
                <span>Name</span>
                <span>ID</span>
              </div>
              <Separator />
              {parsed.map((p, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[1fr_auto] gap-x-3 text-sm px-1 py-0.5 rounded ${
                    p.error ? "bg-destructive/10" : ""
                  }`}
                >
                  <span className="truncate">{p.error ? <span className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{p.error}</span> : p.fullName}</span>
                  <span className="font-mono text-xs text-right">{p.id || <span className="text-destructive">—</span>}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleCreate}
              disabled={isPending || valid.length === 0}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Create {valid.length > 0 ? `${valid.length} Account${valid.length === 1 ? "" : "s"}` : "Accounts"}
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Save these credentials now — passwords will not be shown again.
          </p>

          <div className="max-h-[360px] overflow-y-auto space-y-2 rounded-lg border bg-muted/40 p-3">
            {results.created.map((r: BulkCreateEducatorResult, i: number) => (
              <div key={i}>
                {i > 0 && <Separator className="my-2" />}
                <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Full Name
                  </span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">
                    Password
                  </span>
                  <span className="font-medium truncate">{r.fullName}</span>
                  <Badge
                    variant="secondary"
                    className="font-mono text-xs px-2 py-0.5 select-all justify-self-end"
                  >
                    {r.plainPassword}
                  </Badge>
                  <span className="text-xs text-muted-foreground col-span-2 truncate">
                    {r.email} &middot; ID: {r.educatorId}
                  </span>
                </div>
              </div>
            ))}
            {results.skipped.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Skipped — duplicates ({results.skipped.length})
                  </p>
                  {results.skipped.map((s: any, i: number) => (
                    <div key={`skipped-${i}`} className="flex items-center justify-between rounded bg-amber-50 dark:bg-amber-950/30 px-2 py-1.5 text-xs">
                      <span className="font-mono truncate">{s.email}</span>
                      <span className="ml-2 shrink-0 text-muted-foreground">row {s.row} · {s.reason.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleCopyAll}>
              {copied
                ? <><Check className="mr-2 h-4 w-4 text-success" />Copied!</>
                : <><Copy className="mr-2 h-4 w-4" />Copy All</>}
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </div>

          <Button className="w-full" onClick={handleDone}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}
