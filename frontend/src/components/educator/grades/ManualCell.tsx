"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { fmt } from "./utils";

export function ManualCell({
  value,
  studentId,
  category,
  isLocked,
  onCommit,
  compact,
}: {
  value: number | null;
  studentId: string;
  category: string;
  isLocked: boolean;
  onCommit: (studentId: string, category: string, value: number) => void;
  compact?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const num = parseFloat(draft);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onCommit(studentId, category, num);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(String(value ?? ""));
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
      <div className="flex items-center justify-center">
        <input
          ref={inputRef}
          type="number"
          min={0}
          max={100}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
            if (e.key === "Tab") { e.preventDefault(); commit(); }
          }}
          className="w-12 rounded border border-primary px-1 py-0 text-[11px] tabular-nums focus:outline-none focus:ring-1 focus:ring-primary bg-background text-center"
        />
      </div>
    );
  }

  return (
    <span
      onClick={() => { setDraft(String(value ?? "")); setEditing(true); }}
      className="cursor-pointer text-[11px] tabular-nums text-muted-foreground hover:text-foreground"
    >
      {value !== null ? fmt(value) : "—"}
    </span>
  );
}
