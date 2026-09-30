"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { fmt } from "./utils";

export function ManualCell({
  value,
  maxScore,
  studentId,
  category,
  isLocked,
  onCommit,
  compact,
}: {
  value: number | null;
  /**
   * TICK-GRADE-005: the ceiling for this category (scheme `max_score`, else the
   * category weight). null = uncapped, which keeps the old 0-100 behavior.
   */
  maxScore?: number | null;
  studentId: string;
  category: string;
  isLocked: boolean;
  onCommit: (studentId: string, category: string, value: number) => void;
  compact?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const limit = maxScore != null && maxScore > 0 ? maxScore : 100;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const num = parseFloat(draft);
    if (Number.isNaN(num)) {
      // Empty/invalid input: treat as clearing the score rather than silently
      // keeping the old value, but don't send a NaN to the server.
      setEditing(false);
      setError(null);
      setDraft(String(value ?? ""));
      return;
    }
    if (num < 0) {
      setError(`Cannot be negative.`);
      return;
    }
    if (num > limit) {
      // Stay in edit mode so the educator can correct it rather than silently
      // discarding what they typed. The server rejects this too — this is UX,
      // not the authority.
      setError(`Maximum is ${limit}.`);
      return;
    }
    setError(null);
    onCommit(studentId, category, num);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(String(value ?? ""));
    setError(null);
    setEditing(false);
  };

  if (isLocked) {
    return (
      <span
        className="tabular-nums text-muted-foreground leading-none cursor-default"
        onClick={() => toast.error("Grades are locked. Unlock grades before making changes.")}
      >
        {value !== null ? fmt(value) : "—"}
      </span>
    );
  }

  if (editing) {
    return (
      <div className="flex flex-col items-center">
        <input
          ref={inputRef}
          type="number"
          min={0}
          max={limit}
          step="any"
          aria-label={`${category} score, maximum ${limit}`}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
            if (e.key === "Tab") { e.preventDefault(); commit(); }
          }}
          className="w-14 rounded border border-primary px-1 py-0 text-[11px] tabular-nums focus:outline-none focus:ring-1 focus:ring-primary bg-background text-center"
        />
        {error && (
          <span className="mt-0.5 text-[9px] text-destructive leading-none whitespace-nowrap">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <span
      onClick={() => {
        setDraft(String(value ?? ""));
        setError(null);
        setEditing(true);
      }}
      title={`${category} — click to enter a score (max ${limit})`}
      className="cursor-pointer text-[11px] tabular-nums text-muted-foreground hover:text-foreground"
    >
      {value !== null ? fmt(value) : "—"}
    </span>
  );
}
