// src/components/educator/lesson/LessonForm.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Lesson } from "@/types/educator/lesson.types";
import { CreateLessonRequest } from "@/api/educator/lesson.api";
import type { WeekSlot } from "@/types/educator/lesson.types";
import { useLessons } from "@/hooks/educator/useLessons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";

interface LessonFormProps {
  classId: string;
  availableWeeks: WeekSlot[];
  lesson?: Lesson;
  /** When set (from ?week= URL param), the week picker is locked to this value */
  preselectedWeek?: number | null;
  onSubmit: (data: CreateLessonRequest) => Promise<void>;
  isLoading: boolean;
}

const MIN_DETAIL_WORDS = 10;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function LessonForm({
  classId,
  availableWeeks,
  lesson,
  preselectedWeek,
  onSubmit,
  isLoading,
}: LessonFormProps): React.JSX.Element {
  const router = useRouter();
  const { data: existingLessons = [] } = useLessons(classId);

  const [title,       setTitle]       = useState(lesson?.title       ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [detail,      setDetail]      = useState(lesson?.detail      ?? "");

  // Determine the locked/default week value
  const defaultSlot = availableWeeks[0];
  const lockedWeek  = preselectedWeek ?? null;

  const [selectedSlotValue, setSelectedSlotValue] = useState<number>(
    lesson?.weekNumber ?? lockedWeek ?? defaultSlot?.value ?? 1
  );

  const wordCount   = countWords(detail);
  const detailValid = wordCount >= MIN_DETAIL_WORDS;
  const formValid   = title.trim().length > 0 && detailValid;

  const selectedSlot =
    availableWeeks.find((w) => w.value === selectedSlotValue) ?? defaultSlot;

  // Auto sub-index: max existing subIndex in this week + 1
  const computedSubIndex = useMemo(() => {
    if (lesson) return lesson.subIndex;
    const lessonsInWeek = existingLessons.filter(
      (l) => l.weekNumber === selectedSlotValue
    );
    if (lessonsInWeek.length === 0) return 1;
    return Math.max(...lessonsInWeek.map((l) => l.subIndex)) + 1;
  }, [existingLessons, selectedSlotValue, lesson]);

  async function handleSubmit(): Promise<void> {
    if (!formValid || !selectedSlot) return;
    await onSubmit({
      title:       title.trim(),
      description: description.trim() || undefined,
      weekNumber:  selectedSlot.value,
      subIndex:    computedSubIndex,
      detail:      detail.trim(),
    });
  }

  const colorIdx = selectedSlotValue % WEEK_COLORS.length;

  return (
    <div className="space-y-5 max-w-2xl">

      {/* ── Week Assignment ─────────────────────────────────────────────────
          Locked (read-only pill) when navigated from "+ Add lesson"
          Editable dropdown when navigated from the top "New Lesson" button */}
      <div className="space-y-1.5">
        <Label>
          Week Assignment <span className="text-destructive">*</span>
        </Label>

        {lockedWeek !== null ? (
          /* Locked display */
          <div className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3 w-64",
            "bg-muted/40 cursor-not-allowed",
          )}>
            <div className={cn("rounded-md p-1.5 shrink-0", WEEK_COLORS[colorIdx])}>
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">
                Week {selectedSlot?.semesterWeek ?? selectedSlotValue}
              </p>
              {selectedSlot && (
                <p className="text-xs text-muted-foreground truncate">
                  {selectedSlot.termName} · {selectedSlot.semesterName}
                </p>
              )}
            </div>
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </div>
        ) : (
          /* Editable dropdown */
          <Select
            value={String(selectedSlotValue)}
            onValueChange={(v) => setSelectedSlotValue(Number(v))}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select week">
                {selectedSlot && (
                  <div className="flex flex-col items-start">
                    <span>Week {selectedSlot.semesterWeek ?? selectedSlot.value}</span>
                    <span className="text-xs text-muted-foreground">
                      {selectedSlot.termName} · {selectedSlot.semesterName}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableWeeks.map((w) => (
                <SelectItem key={w.value} value={String(w.value)}>
                  <div className="flex flex-col">
                    <span>Week {w.semesterWeek ?? w.value}</span>
                    <span className="text-xs text-muted-foreground">
                      {w.termName} · {w.semesterName}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Introduction to Stacks"
        />
      </div>

      {/* ── Description ────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of this lesson"
        />
      </div>

      {/* ── Lesson Detail (card container) ────────────────────────────────── */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="detail">
            Lesson Detail <span className="text-destructive">*</span>
          </Label>
          <span className={cn(
            "text-xs",
            detailValid ? "text-green-600" : "text-muted-foreground",
          )}>
            {wordCount} / {MIN_DETAIL_WORDS} words min
          </span>
        </div>

        <Textarea
          id="detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Write detailed lesson content (minimum 10 words)..."
          rows={8}
        />

        {detail.length > 0 && !detailValid && (
          <p className="text-xs text-destructive">
            At least {MIN_DETAIL_WORDS} words required for concept extraction.
          </p>
        )}
      </div>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 pt-1">
        <Button onClick={handleSubmit} disabled={!formValid || isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {lesson ? "Save Changes" : "Save Lesson"}
        </Button>
        <Button variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}