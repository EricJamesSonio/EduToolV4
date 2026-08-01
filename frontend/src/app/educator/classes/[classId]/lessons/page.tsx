"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useLessons } from "@/hooks/educator/useLessons";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks";
import { WeekCalendar } from "@/components/educator/lesson/WeekCalendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

export default function LessonsPage(): React.JSX.Element {
  const params = useParams();
  const classId = params.classId as string;

  const { data: lessonsData = [], isLoading: lessonsLoading } =
    useLessons(classId);

  const { data: weeksData = [], isLoading: weeksLoading } =
    useClassWeeks(classId);

  const isLoading = lessonsLoading || weeksLoading;

  // 🔥 derive safe values
  const lessons = lessonsData ?? [];
  const weeks = weeksData ?? [];

  // 🔥 IMPORTANT: derive max week number, not array length
  const totalWeeks =
    weeks.length > 0
      ? Math.max(...weeks.map((w) => w.value))
      : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lessons"
        actions={
          <Link href={`/educator/classes/${classId}/lessons/new`}>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Lesson
            </Button>
          </Link>
        }
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading lessons...
        </div>
      ) : (
        <WeekCalendar
          lessons={lessons}
          classId={classId}
          totalWeeks={totalWeeks}
          weeks={weeks}
        />
      )}
    </div>
  );
}