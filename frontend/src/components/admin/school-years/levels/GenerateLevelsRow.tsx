"use client";
import { useState } from "react";
import { getCountConfig } from "@/components/admin/levels/get-count-config";
import { Button } from "@/components/ui/button";

interface GenerateLevelsRowProps {
  programType: string;
  onGenerate:  (count: number) => void;
  onCancel:    () => void;
  isLoading:   boolean;
}

export function GenerateLevelsRow({
  programType,
  onGenerate,
  onCancel,
  isLoading,
}: GenerateLevelsRowProps): React.JSX.Element {
  const cfg = getCountConfig(programType);
  const [count, setCount] = useState(cfg.default);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-t flex-wrap">
      <span className="text-sm text-muted-foreground not-interactive">{cfg.label}:</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCount((c) => Math.max(cfg.min, c - 1))}
          disabled={count <= cfg.min}
          className="h-6 w-6 rounded border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-40"
        >−</button>
        <span className="w-6 text-center text-sm font-medium not-interactive">{count}</span>
        <button
          onClick={() => setCount((c) => Math.min(cfg.max, c + 1))}
          disabled={count >= cfg.max}
          className="h-6 w-6 rounded border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-40"
        >+</button>
      </div>
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded not-interactive">
        {cfg.preview(count)}
      </span>
      <div className="flex items-center gap-2 ml-auto">
        <Button size="sm" className="h-7 text-xs px-3" onClick={() => onGenerate(count)} disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs px-3" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}