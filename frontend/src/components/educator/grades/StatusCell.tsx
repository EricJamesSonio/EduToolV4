"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import apiClient from "@/api/client";
import { fmt } from "./utils";

const STATUS_ACTIONS = [
  { label: "Missed", status: "missed" as const, badge: "M", className: "bg-red-100 text-red-700 hover:bg-red-200" },
  { label: "Custom Score", status: "custom" as const, badge: "C", className: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
  { label: "Exempted", status: "exempted" as const, badge: "E", className: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
];

export function StatusCell({
  score,
  classId,
  assessmentId,
  submissionId,
  studentId,
  isMissed,
  isExempted,
  status,
  totalItems,
  onStatusChange,
  isLocked,
  compact,
}: {
  score: number | null;
  classId: string;
  assessmentId: string;
  submissionId?: string;
  studentId?: string;
  isMissed?: boolean;
  isExempted?: boolean;
  status: string;
  totalItems: number;
  onStatusChange: () => void;
  isLocked?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [customScoreOpen, setCustomScoreOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleScroll() { setOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const toggleDropdown = () => {
    if (isLocked) {
      toast.error("Grades are locked. Unlock grades before making changes.");
      return;
    }
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const up = spaceBelow < 140;
      setDropdownPos({
        top: up ? rect.top - 4 : rect.bottom + 4,
        left: rect.left + rect.width / 2,
        up,
      });
    }
    setOpen(!open);
  };

  const handleStatusAction = async (newStatus: string) => {
    const effectiveId = submissionId || (studentId ? `not_started_${studentId}` : null);
    if (!effectiveId) return;
    if (newStatus === "custom") {
      setCustomDraft(String(score ?? ""));
      setCustomScoreOpen(true);
      return;
    }
    await patchStatus(effectiveId, { status: newStatus });
  };

  const handleCustomConfirm = async () => {
    const val = parseInt(customDraft, 10);
    if (isNaN(val) || val < 0) { toast.error("Invalid score."); return; }
    if (val > totalItems) { toast.error(`Score cannot exceed ${totalItems}.`); return; }
    const effectiveId = submissionId || (studentId ? `not_started_${studentId}` : null);
    if (!effectiveId) return;
    await patchStatus(effectiveId, { status: "custom", manualScore: val });
    setCustomScoreOpen(false);
  };

  const patchStatus = async (effectiveId: string, body: any) => {
    setPending(true);
    try {
      await apiClient.patch(
        `/classes/${classId}/assessments/${assessmentId}/submissions/${effectiveId}/status`,
        body,
      );
      onStatusChange();
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setPending(false);
      setOpen(false);
    }
  };

  const dropdown = dropdownPos ? (
    <div
      style={{ top: dropdownPos.top, left: dropdownPos.left }}
      className={`fixed z-50 -translate-x-1/2 w-32 rounded-lg border bg-popover shadow-lg py-1 ${dropdownPos.up ? "mb-1" : "mt-1"}`}>
      {STATUS_ACTIONS.map((action) => (
        <button
          key={action.status}
          onClick={() => { handleStatusAction(action.status); setOpen(false); }}
          disabled={pending}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50 hover:bg-muted"
        >
          <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold shrink-0 ${action.className.split('hover')[0].trim()}`}>
            {action.badge}
          </span>
          {action.label}
        </button>
      ))}
    </div>
  ) : null;

  if (status === 'not_started' || (!submissionId && !score && score !== 0)) {
    return (
      <div className="relative flex justify-center" ref={ref}>
        <button
          ref={btnRef}
          onClick={toggleDropdown}
          className="text-muted-foreground/50 hover:text-foreground transition-colors leading-none"
        >
          —
        </button>
        {open && dropdown}
        {customScoreOpen && (
          <Dialog open onOpenChange={(open) => { if (!open) setCustomScoreOpen(false); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enter Custom Score</DialogTitle>
                <DialogDescription>Score out of {totalItems}</DialogDescription>
              </DialogHeader>
              <input
                type="number"
                min={0}
                max={totalItems}
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCustomConfirm(); }}
                className="w-full rounded-md border bg-card px-3 py-2 text-sm"
                autoFocus
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setCustomScoreOpen(false)}>Cancel</Button>
                <Button onClick={handleCustomConfirm} disabled={pending}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  const isCustom = status === 'custom' && !isMissed && !isExempted;
  const badgeLabel = isMissed ? "M" : isExempted ? "E" : isCustom ? "C" : null;
  const badgeClass = isMissed
    ? "bg-red-100 text-red-700"
    : isExempted
      ? "bg-amber-100 text-amber-700"
      : isCustom
        ? "bg-amber-100 text-amber-700"
        : "";

  return (
    <div className="relative flex justify-center" ref={ref}>
      <button
        ref={btnRef}
        onClick={toggleDropdown}
        className="tabular-nums text-muted-foreground hover:text-foreground transition-colors text-[11px] leading-none"
      >
        {isCustom ? (
          <span className="inline-flex items-center gap-0.5">
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700">C</span>
            <span>{fmt(score, 0)}/{totalItems}</span>
          </span>
        ) : isMissed || isExempted ? (
          <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded text-[8px] font-bold ${badgeClass}`}>
            {badgeLabel}
          </span>
        ) : score !== null ? (
          `${fmt(score, 0)}/${totalItems}`
        ) : (
          "—"
        )}
      </button>
      {open && dropdown}
      {customScoreOpen && (
        <Dialog open onOpenChange={(open) => { if (!open) setCustomScoreOpen(false); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Custom Score</DialogTitle>
              <DialogDescription>Score out of {totalItems}</DialogDescription>
            </DialogHeader>
            <input
              type="number"
              min={0}
              max={totalItems}
              value={customDraft}
              onChange={(e) => setCustomDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCustomConfirm(); }}
              className="w-full rounded-md border bg-card px-3 py-2 text-sm"
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCustomScoreOpen(false)}>Cancel</Button>
              <Button onClick={handleCustomConfirm} disabled={pending}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
