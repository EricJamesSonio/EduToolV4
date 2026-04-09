"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Layers,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineEdit } from "./InlineEdit";
import { getCountConfig } from "./get-count-config";
import type { Level } from "@/types/admin/level.types";
import type { Program, CourseSnapshot, StrandSnapshot } from "@/types/admin/program.types";

// ─── GenerateLevelsRow (unchanged — only used for empty-state initial generation) ───

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

// ─── LevelRow (unchanged) ───

interface LevelRowProps {
  level: Level;
  isEnded: boolean;
  isEditing: boolean;
  isUpdating: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (name: string) => void;
  onDelete: () => void;
  indented?: boolean;
}

function LevelRow({
  level,
  isEnded,
  isEditing,
  isUpdating,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  indented = false,
}: LevelRowProps): React.JSX.Element {
  return (
    <div
      className={`flex items-center gap-3 py-2.5 group hover:bg-muted/20 transition-colors ${
        indented ? "pl-10 pr-4" : "px-4"
      }`}
    >
      <div className="w-3 shrink-0 flex justify-center">
        <div className="w-px h-4 bg-border" />
      </div>
      {isEditing ? (
        <InlineEdit
          value={level.name}
          onSave={onSave}
          onCancel={onCancelEdit}
          isLoading={isUpdating}
        />
      ) : (
        <>
          <span className="text-sm flex-1 min-w-0 truncate">{level.name}</span>
          {!isEnded && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onEdit}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Rename level"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onDelete}
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
  );
}

// ─── CourseGroup (unchanged) ───

interface CourseGroupProps {
  label: string;
  levels: Level[];
  isEnded: boolean;
  editingId: string | null;
  isUpdating: boolean;
  updatingId: string | null;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSave: (id: string, name: string) => void;
  onDelete: (level: Level) => void;
}

function CourseGroup({
  label,
  levels,
  isEnded,
  editingId,
  isUpdating,
  updatingId,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: CourseGroupProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t">
      <button
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="w-3 shrink-0" />
        <div className="flex h-5 w-5 items-center justify-center rounded bg-muted">
          <GraduationCap className="h-3 w-3 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium flex-1 min-w-0 truncate">{label}</span>
        <Badge variant="outline" className="text-xs font-normal shrink-0">
          {levels.length} {levels.length === 1 ? "level" : "levels"}
        </Badge>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="divide-y bg-muted/5">
          {levels.length === 0 ? (
            <p className="pl-14 pr-4 py-3 text-xs text-muted-foreground">
              No levels yet for this program.
            </p>
          ) : (
            levels.map((level) => (
              <LevelRow
                key={level.id}
                level={level}
                isEnded={isEnded}
                isEditing={editingId === level.id}
                isUpdating={isUpdating && updatingId === level.id}
                onEdit={() => onEdit(level.id)}
                onCancelEdit={onCancelEdit}
                onSave={(name) => onSave(level.id, name)}
                onDelete={() => onDelete(level)}
                indented
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── ProgramGroup ───

interface ProgramGroupProps {
  program: Program;
  levels: Level[];
  isEnded: boolean;
  onUpdate: (id: string, name: string) => void;
  onDelete: (level: Level) => void;
  onGenerate: (programId: string, count: number) => void;
  /** Add a single new level to this program */
  onAdd: (programId: string) => void;
  isUpdating: boolean;
  isGenerating: boolean;
  isAdding: boolean;
  updatingId: string | null;
}

export function ProgramGroup({
  program,
  levels,
  isEnded,
  onUpdate,
  onDelete,
  onGenerate,
  onAdd,
  isUpdating,
  isGenerating,
  isAdding,
  updatingId,
}: ProgramGroupProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);

  const hasCourses = program.courses && program.courses.length > 0;
  const hasStrands = program.strands && program.strands.length > 0;
  const useSubGroups = hasCourses || hasStrands;

  const subGroups: Array<{ id: string; label: string }> = hasCourses
    ? program.courses.map((c: CourseSnapshot) => ({
        id: c.id,
        label: c.code ? `${c.code} – ${c.name}` : c.name,
      }))
    : hasStrands
      ? program.strands.map((s: StrandSnapshot) => ({ id: s.id, label: s.name }))
      : [];

  const hasLevels = levels.length > 0;

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

      {expanded && (
        <div className="border-t divide-y">
          {/* ── Sub-grouped view (college / SHS) ── */}
          {useSubGroups ? (
            <>
              {subGroups.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">No courses or strands found.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {subGroups.map((group) => (
                    <CourseGroup
                      key={group.id}
                      label={group.label}
                      levels={levels}
                      isEnded={isEnded}
                      editingId={editingId}
                      isUpdating={isUpdating}
                      updatingId={updatingId}
                      onEdit={(id) => setEditingId(id)}
                      onCancelEdit={() => setEditingId(null)}
                      onSave={(id, name) => {
                        onUpdate(id, name);
                        setEditingId(null);
                      }}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Empty state — show generate row */}
              {!hasLevels && !showGenerate && (
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
                <LevelRow
                  key={level.id}
                  level={level}
                  isEnded={isEnded}
                  isEditing={editingId === level.id}
                  isUpdating={isUpdating && updatingId === level.id}
                  onEdit={() => setEditingId(level.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={(name) => {
                    onUpdate(level.id, name);
                    setEditingId(null);
                  }}
                  onDelete={() => onDelete(level)}
                />
              ))}
            </>
          )}

          {/* Initial bulk-generate row (empty state only) */}
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

          {/* Bottom action bar — shown when levels exist */}
          {!isEnded && hasLevels && !showGenerate && (
            <div className="px-4 py-2.5 flex items-center gap-4">
              <button
                onClick={() => onAdd(program.id)}
                disabled={isAdding}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                {isAdding ? "Adding…" : "Add level"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}