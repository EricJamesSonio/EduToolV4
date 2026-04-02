// filepath: frontend/src/components/educator/lessons/LessonCard.tsx

"use client";

import Link from "next/link";
import { Lesson } from "@/types/educator/lesson.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Loader2, CheckCircle2, AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonCardProps {
  lesson: Lesson;
  classId: string;
}

function ConceptStatusBadge({
  status,
}: {
  status: Lesson["conceptBuild"] extends null ? "none" : NonNullable<Lesson["conceptBuild"]>["status"] | "none";
}) {
  if (status === "none" || !status) {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <Circle className="h-3 w-3" />
        No Concepts
      </Badge>
    );
  }
  if (status === "building") {
    return (
      <Badge variant="secondary" className="gap-1 text-xs text-blue-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        Extracting
      </Badge>
    );
  }
  if (status === "ready") {
    return (
      <Badge variant="secondary" className="gap-1 text-xs text-green-600">
        <CheckCircle2 className="h-3 w-3" />
        Extracted
      </Badge>
    );
  }
  if (status === "outdated") {
    return (
      <Badge variant="secondary" className="gap-1 text-xs text-amber-600">
        <AlertTriangle className="h-3 w-3" />
        Outdated
      </Badge>
    );
  }
  return null;
}

export function LessonCard({ lesson, classId }: LessonCardProps): React.JSX.Element {
  const conceptStatus = lesson.conceptBuild?.status ?? "none";

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{lesson.title}</p>
          {lesson.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {lesson.description}
            </p>
          )}
          <div className="mt-2">
            <ConceptStatusBadge status={conceptStatus} />
          </div>
        </div>
        <Link href={`/educator/classes/${classId}/lessons/${lesson.id}`}>
          <Button variant="ghost" size="sm" className="shrink-0 gap-1">
            View / Edit
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}