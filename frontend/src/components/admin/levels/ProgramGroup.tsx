// app/admin/school-years/[id]/levels/_components/ProgramGroup.tsx
"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, BookOpen, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineEdit } from "./InlineEdit";
import { getCountConfig } from "./get-count-config";
import type { Level } from "@/types/admin/level.types";
import type { Program } from "@/types/admin/program.types";

// ─── GenerateLevelsRow ────────────────────────────────────────────────────────

interface GenerateLevelsRowProps {
  programType: string;
  onGenerate: (count: number) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function GenerateLevelsRow({
  programType,
  onGenerate,
  onCancel,
  isLoading,
}: GenerateLevelsRowProps): React.JSX.Element {
  const cfg = getCountConfig(programType);
  const [count, setCount] = useState(cfg.default);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-t flex-wrap">
      <span className="text-sm text-muted-foreground">{cfg.label}:</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCount((c) => Math.max(cfg.min, c - 1))}
          disabled={count <= cfg.min}
          className="h-6 w-6 rounded border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-40"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-medium">{count}</span>
        <button
          onClick={() => setCount((c) => Math.min(cfg.max, c + 1))}
          disabled={count >= cfg.max}
          className="h-6 w-6 rounded border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-40"
        >
          +
        </button>
      </div>
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
        {cfg.preview(count)}
      </span>
      <div className="flex items-center gap-2 ml-auto">
        <Button
          size="sm"
          className="h-7 text-xs px-3"
          onClick={() => onGenerate(count)}
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs px-3"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── ProgramGroup ─────────────────────────────────────────────────────────────

interface ProgramGroupProps {
  program: Program;
  levels: Level[];
  isEnded: boolean;
  onUpdate: (id: string, name: string) => void;
  onDelete: (level: Level) => void;
  onGenerate: (programId: string, count: number) => void;
  isUpdating: boolean;
  isGenerating: boolean;
  updatingId: string | null;
}

export function ProgramGroup({
  program,
  levels,
  isEnded,
  onUpdate,
  onDelete,
  onGenerate,
  isUpdating,
  isGenerating,
  updatingId,
}: ProgramGroupProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Program header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm">{program.name}</span>
          <Badge variant="secondary" className="text-xs font-normal">
            {levels.length} {levels.length === 1 ? "level" : "levels"}
          </Badge>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Levels */}
      {expanded && (
        <div className="border-t divide-y">
          {/* Empty state */}
          {levels.length === 0 && !showGenerate && (
            <div className="px-4 py-8 text-center">
              <Layers className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No levels yet for this program.</p>
              {!isEnded && (
                <button
                  onClick={() => setShowGenerate(true)}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Generate levels
                </button>
              )}
            </div>
          )}

          {/* Level rows */}
          {levels.map((level) => (
            <div
              key={level.id}
              className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/20 transition-colors"
            >
              <div className="w-3 shrink-0 flex justify-center">
                <div className="w-px h-4 bg-border" />
              </div>

              {editingId === level.id ? (
                <InlineEdit
                  value={level.name}
                  onSave={(name) => {
                    onUpdate(level.id, name);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                  isLoading={isUpdating && updatingId === level.id}
                />
              ) : (
                <>
                  <span className="text-sm flex-1 min-w-0 truncate">{level.name}</span>
                  {!isEnded && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(level.id)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Rename level"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(level)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete level"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Generate row */}
          {!isEnded && showGenerate && (
            <GenerateLevelsRow
              programType={program.type}
              onGenerate={(count) => {
                onGenerate(program.id, count);
                setShowGenerate(false);
              }}
              onCancel={() => setShowGenerate(false)}
              isLoading={isGenerating}
            />
          )}

          {/* Regenerate button when levels exist */}
          {!isEnded && !showGenerate && levels.length > 0 && (
            <div className="px-4 py-2.5">
              <button
                onClick={() => setShowGenerate(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Regenerate levels
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}