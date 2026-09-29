"use client";

import { Check, X, Minus, Plus } from "lucide-react";
import { useState } from "react";
import type { ProgramType } from "@/types/admin/program.types";
import { getLevelLabel, getLevelBounds } from "@/lib/level-label";

interface LevelNumberStepperProps {
  programType: ProgramType;
  initialValue: number;
  onSave: (n: number) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LevelNumberStepper({
  programType,
  initialValue,
  onSave,
  onCancel,
  isLoading = false,
}: LevelNumberStepperProps): React.JSX.Element {
  const { min, max } = getLevelBounds(programType);
  const [n, setN] = useState(Math.min(Math.max(initialValue, min), max));

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setN((v) => Math.max(min, v - 1))}
        disabled={n <= min || isLoading}
        className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[7rem] text-center text-sm font-medium not-interactive">
        {getLevelLabel(programType, n)}
      </span>
      <button
        type="button"
        onClick={() => setN((v) => Math.min(max, v + 1))}
        disabled={n >= max || isLoading}
        className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onSave(n)}
        disabled={isLoading}
        className="p-1 rounded text-success hover:bg-success/10 disabled:opacity-40 transition-colors"
        title="Save"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        onClick={onCancel}
        disabled={isLoading}
        className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
        title="Cancel"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}