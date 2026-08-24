// filepath: frontend/src/components/educator/lessons/LessonCard.tsx

"use client";

import Link from "next/link";
import { Lesson } from "@/types/educator/lesson.types";
import { Badge } from "@/components/ui/badge";
import {
  ListItemCard,
  ListItemCardAction,
  listItemTitleClass,
} from "@/components/shared/ListItemCard";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";

interface LessonCardProps {
  lesson: Lesson;
  classId: string;
}

/**
 * ✅ NEW: Simplified concept badge
 * Backend only tells us if concept exists or not
 */
function ConceptStatusBadge({ hasConcept }: { hasConcept: boolean }) {
  if (!hasConcept) {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <Circle className="h-3 w-3" />
        No Concepts
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1 text-xs text-success">
      <CheckCircle2 className="h-3 w-3" />
      Extracted
    </Badge>
  );
}

export function LessonCard({
  lesson,
  classId,
}: LessonCardProps): React.JSX.Element {
  /**
   * ✅ NEW: simple boolean check
   */
  const hasConcept = !!lesson.concept;

  return (
    <ListItemCard className="hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className={cn(listItemTitleClass, "truncate")}>{lesson.title}</p>

          {lesson.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {lesson.description}
            </p>
          )}

          <div className="mt-2">
            <ConceptStatusBadge hasConcept={hasConcept} />
          </div>
        </div>

        <Link href={`/educator/classes/${classId}/lessons/${lesson.id}`}>
          <ListItemCardAction
            icon={ArrowRight}
            label="View / Edit"
            variant="ghost"
            className="shrink-0"
          />
        </Link>
      </div>
    </ListItemCard>
  );
}