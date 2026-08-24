// app/admin/school-years/[id]/levels/_components/InlineEdit.tsx
"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function InlineEdit({
  value,
  onSave,
  onCancel,
  isLoading,
}: InlineEditProps): React.JSX.Element {
  const [draft, setDraft] = useState(value);

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="h-7 text-sm max-w-xs"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) onSave(draft.trim());
          if (e.key === "Escape") onCancel();
        }}
      />
      <button
        onClick={() => draft.trim() && onSave(draft.trim())}
        disabled={isLoading || !draft.trim()}
        className="p-1 rounded text-success hover:bg-success/10 dark:hover:bg-success/15 disabled:opacity-40 transition-colors"
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