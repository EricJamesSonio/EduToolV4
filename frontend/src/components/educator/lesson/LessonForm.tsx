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

import { Loader2 } from "lucide-react";

interface LessonFormProps {
  classId: string;
  availableWeeks: WeekSlot[];
  lesson?: Lesson;
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
  onSubmit,
  isLoading,
}: LessonFormProps): React.JSX.Element {
  const router = useRouter();

  // 🔥 fetch existing lessons (needed for subIndex auto)
  const { data: existingLessons = [] } = useLessons(classId);

  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(
    lesson?.description ?? ""
  );
  const [detail, setDetail] = useState(lesson?.detail ?? "");

  const defaultSlot = availableWeeks[0];

  const [selectedSlotValue, setSelectedSlotValue] = useState<number>(
    lesson?.weekNumber ?? defaultSlot?.value ?? 1
  );

  const wordCount = countWords(detail);
  const detailValid = wordCount >= MIN_DETAIL_WORDS;

  const formValid = title.trim().length > 0 && detailValid;

  const selectedSlot =
    availableWeeks.find((w) => w.value === selectedSlotValue) ??
    defaultSlot;

  // 🔥 AUTO SUB-INDEX GENERATION (fixes duplicate bug)
  const computedSubIndex = useMemo(() => {
    if (lesson) return lesson.subIndex; // editing → keep existing

    const lessonsInWeek = existingLessons.filter(
      (l) => l.weekNumber === selectedSlotValue
    );

    if (lessonsInWeek.length === 0) return 1;

    return (
      Math.max(...lessonsInWeek.map((l) => l.subIndex)) + 1
    );
  }, [existingLessons, selectedSlotValue, lesson]);

  async function handleSubmit(): Promise<void> {
    if (!formValid || !selectedSlot) return;

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      weekNumber: selectedSlot.value,
      subIndex: computedSubIndex, // ✅ FIXED
      detail: detail.trim(),
    });
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Title */}
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

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">
          Description (optional)
        </Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of this lesson"
        />
      </div>

      {/* Week Assignment */}
      <div className="space-y-1.5">
        <Label>
          Week Assignment{" "}
          <span className="text-destructive">*</span>
        </Label>

        <Select
          value={String(selectedSlotValue)}
          onValueChange={(v) =>
            setSelectedSlotValue(Number(v))
          }
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select week">
              {selectedSlot && (
                <div className="flex flex-col items-start">
                  <span>Week {selectedSlot.value}</span>
                  <span className="text-xs text-muted-foreground">
                    {selectedSlot.termName} •{" "}
                    {selectedSlot.semesterName}
                  </span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            {availableWeeks.map((w) => (
              <SelectItem
                key={w.value}
                value={String(w.value)}
              >
                <div className="flex flex-col">
                  <span>Week {w.value}</span>
                  <span className="text-xs text-muted-foreground">
                    {w.termName} • {w.semesterName}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Detail */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="detail">
            Lesson Detail{" "}
            <span className="text-destructive">*</span>
          </Label>
          <span
            className={
              detailValid
                ? "text-xs text-green-600"
                : "text-xs text-muted-foreground"
            }
          >
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
            At least {MIN_DETAIL_WORDS} words required for
            concept extraction.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          onClick={handleSubmit}
          disabled={!formValid || isLoading}
        >
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {lesson ? "Save Changes" : "Save Lesson"}
        </Button>

        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}