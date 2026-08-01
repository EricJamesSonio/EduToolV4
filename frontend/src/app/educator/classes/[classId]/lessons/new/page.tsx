// src/app/educator/classes/[classId]/lessons/new/page.tsx
"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LessonForm } from "@/components/educator/lesson/LessonForm";
import { useCreateLesson } from "@/hooks/educator/useLessons";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks";
import { CreateLessonRequest } from "@/api/educator/lesson.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Loader2 } from "lucide-react";

export default function NewLessonPage(): React.JSX.Element {
  const params       = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const classId      = params.classId as string;

  // ?week=N is set by WeekCalendar's "+ Add lesson" link
  const preselectedWeek = searchParams.get("week")
    ? Number(searchParams.get("week"))
    : null;

  const { data: weeks, isLoading: weeksLoading } = useClassWeeks(classId);
  const { mutateAsync: createLesson, isPending }  = useCreateLesson(classId);

  async function handleSubmit(data: CreateLessonRequest): Promise<void> {
    const lesson = await createLesson(data);
    toast.success("Lesson saved. Concept extraction running...");
    router.push(`/educator/classes/${classId}/lessons/${lesson.id}?extracting=true`);
  }

  if (weeksLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  const availableWeeks = weeks ?? [{ label: "1", value: 1 }];

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Lesson"
        description="Create a new lesson for this class."
        breadcrumbs={[
          { label: "Lessons", href: `/educator/classes/${classId}/lessons` },
          { label: "New Lesson" },
        ]}
      />

      <LessonForm
        classId={classId}
        availableWeeks={availableWeeks}
        preselectedWeek={preselectedWeek}
        isLoading={isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}