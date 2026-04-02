// filepath: frontend/src/components/educator/lessons/LessonForm.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lesson } from "@/types/educator/lesson.types";
import { CreateLessonRequest, UpdateLessonRequest } from "@/api/educator/lesson.api";
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
  availableWeeks: number[];
  lesson?: Lesson;                          // present = edit mode
  onSubmit: (data: CreateLessonRequest | UpdateLessonRequest) => Promise<void>;
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

  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [weekNumber, setWeekNumber] = useState<number>(
    lesson?.weekNumber ?? availableWeeks[0] ?? 1
  );
  const [detail, setDetail] = useState(lesson?.detail ?? "");

  const wordCount = countWords(detail);
  const detailValid = wordCount >= MIN_DETAIL_WORDS;
  const formValid = title.trim().length > 0 && detailValid;

  async function handleSubmit(): Promise<void> {
    if (!formValid) return;
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      weekNumber,
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
          value={String(weekNumber)}
          onValueChange={(v) => setWeekNumber(Number(v))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select week" />
          </SelectTrigger>
          <SelectContent>
            {availableWeeks.map((w) => (
              <SelectItem key={w} value={String(w)}>
                Week {w}
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
              detailValid ? "text-xs text-green-600" : "text-xs text-muted-foreground"
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