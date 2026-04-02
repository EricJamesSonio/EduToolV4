// filepath: frontend/src/app/educator/classes/[classId]/lessons/new/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { LessonForm } from "@/components/educator/lesson/LessonForm";
import { useCreateLesson } from "@/hooks/educator/useLessons";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks";
import { lessonApi } from "@/api/educator/lesson.api";
import { CreateLessonRequest } from "@/api/educator/lesson.api";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewLessonPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const { data: weeks, isLoading: weeksLoading } = useClassWeeks(classId);
  const { mutateAsync: createLesson, isPending } = useCreateLesson(classId);

  async function handleSubmit(data: CreateLessonRequest): Promise<void> {
    const lesson = await createLesson(data);
    toast.success("Lesson saved. Concept extraction running...");

    // fire-and-forget extraction — result arrives via in-app notification
    lessonApi.triggerExtraction(classId, lesson.id).catch(() => {
      // extraction failure is surfaced via notification channel, not toast
    });

    router.push(`/educator/classes/${classId}/lessons`);
  }

  if (weeksLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/educator/classes/${classId}/lessons`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold">New Lesson</h1>
      </div>

      <LessonForm
        classId={classId}
        availableWeeks={weeks ?? [1]}
        isLoading={isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}