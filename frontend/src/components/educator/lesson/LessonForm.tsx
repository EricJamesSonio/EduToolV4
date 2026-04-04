"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lesson } from "@/types/educator/lesson.types";
import { CreateLessonRequest } from "@/api/educator/lesson.api";
import type { WeekSlot } from "@/hooks/educator/useClassWeeks";
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

const MIN_DETAIL_WORDS = 5;

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

  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");

  // selectedSlot holds the full WeekSlot so we get both weekNumber and subIndex
  const defaultSlot = availableWeeks[0] ?? { label: "1", value: 1 };
  const [selectedSlotValue, setSelectedSlotValue] = useState<number>(
    lesson?.weekNumber ?? defaultSlot.value
  );

  const [detail, setDetail] = useState(lesson?.detail ?? "");

  const wordCount = countWords(detail);
  const detailValid = wordCount >= MIN_DETAIL_WORDS;
  const formValid = title.trim().length > 0 && detailValid;

  const selectedSlot =
    availableWeeks.find((w) => w.value === selectedSlotValue) ?? defaultSlot;

  async function handleSubmit(): Promise<void> {
    if (!formValid) return;

    // Derive weekNumber from the slot label (e.g. "1.2" → week 1, subIndex = slot.value)
    const rawWeek = selectedSlot.label.split(".")[0];
    const weekNumber = parseInt(rawWeek, 10);

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      weekNumber,
      subIndex: selectedSlot.value, // ← auto-derived, no manual input needed
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
        <Label htmlFor="description">Description (optional)</Label>
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
          Week Assignment <span className="text-destructive">*</span>
        </Label>
        <Select
          value={String(selectedSlotValue)}
          onValueChange={(v) => setSelectedSlotValue(Number(v))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select week" />
          </SelectTrigger>
          <SelectContent>
            {availableWeeks.map((w) => (
              <SelectItem key={w.value} value={String(w.value)}>
                Week {w.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Detail */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="detail">
            Lesson Detail <span className="text-destructive">*</span>
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
            At least {MIN_DETAIL_WORDS} words required for concept extraction.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button onClick={handleSubmit} disabled={!formValid || isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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