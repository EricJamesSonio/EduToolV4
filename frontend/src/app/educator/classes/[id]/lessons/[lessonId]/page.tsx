// filepath: frontend/src/app/educator/classes/[classId]/lessons/[lessonId]/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useLesson, useUpdateLesson, useDeleteLesson, useTriggerExtraction } from "@/hooks/educator/useLessons";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks";
import { LessonForm } from "@/components/educator/lesson/LessonForm";
import { ConceptBuildViewer } from "@/components/educator/lesson/ConceptBuildViewer";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UpdateLessonRequest } from "@/api/educator/lesson.api";
import { Pencil, Trash2, Loader2, ArrowLeft, RotateCcw } from "lucide-react";

export default function LessonDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const lessonId = params.lessonId as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showReExtractBanner, setShowReExtractBanner] = useState(false);

  const { data: lesson, isLoading } = useLesson(classId, lessonId);
  const { data: weeks } = useClassWeeks(classId);
  const { mutateAsync: updateLesson, isPending: isUpdating } = useUpdateLesson(classId);
  const { mutateAsync: deleteLesson, isPending: isDeleting } = useDeleteLesson(classId);
  const { mutateAsync: triggerExtraction, isPending: isExtracting } = useTriggerExtraction(classId);

  async function handleUpdate(data: UpdateLessonRequest): Promise<void> {
    const detailChanged = data.detail !== undefined && data.detail !== lesson?.detail;
    const hasExistingBuild = lesson?.conceptBuild !== null;

    await updateLesson({ lessonId, data });
    setIsEditing(false);

    if (detailChanged && hasExistingBuild) {
      setShowReExtractBanner(true);
    } else {
      toast.success("Lesson updated.");
    }
  }

  async function handleReExtract(): Promise<void> {
    await triggerExtraction(lessonId);
    setShowReExtractBanner(false);
    toast.success("Re-extraction started. You'll be notified when complete.");
  }

  async function handleDelete(): Promise<void> {
    await deleteLesson(lessonId);
    toast.success("Lesson deleted.");
    router.push(`/educator/classes/${classId}/lessons`);
  }

  if (isLoading || !lesson) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading lesson...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm min-w-0">
          <Link
            href={`/educator/classes/${classId}/lessons`}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            Lessons
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium truncate">{lesson.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setIsEditing((v) => !v)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {isEditing ? "Cancel Edit" : "Edit Lesson"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove &quot;{lesson.title}&quot; and its
                  concept build. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Lesson
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Re-extract banner */}
      {showReExtractBanner && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm space-y-2">
          <p className="font-medium text-amber-800">
            Content updated. Re-extract concepts?
          </p>
          <p className="text-amber-700 text-xs">
            Re-extraction does not affect already-generated assessments.
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-100"
              onClick={handleReExtract}
              disabled={isExtracting}
            >
              {isExtracting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Re-extract
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-amber-700"
              onClick={() => setShowReExtractBanner(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Form (edit) or read-only view */}
      {isEditing ? (
        <LessonForm
          classId={classId}
          availableWeeks={weeks ?? [lesson.weekNumber]}
          lesson={lesson}
          isLoading={isUpdating}
          onSubmit={handleUpdate}
        />
      ) : (
        <div className="space-y-4 max-w-2xl">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Title</p>
            <p className="font-medium">{lesson.title}</p>
          </div>
          {lesson.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Description</p>
              <p className="text-sm">{lesson.description}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Week</p>
            <p className="text-sm">Week {lesson.weekNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Lesson Detail</p>
            <p className="text-sm whitespace-pre-wrap">{lesson.detail}</p>
          </div>
        </div>
      )}

      {/* Concept build section */}
      <div className="space-y-2 pt-2 border-t">
        <h2 className="text-sm font-semibold">Concept Build</h2>
        <ConceptBuildViewer
          classId={classId}
          lessonId={lessonId}
          concept={lesson.conceptBuild}
          onReExtract={
            lesson.conceptBuild && !isEditing ? handleReExtract : undefined
          }
          isExtracting={isExtracting}
        />
      </div>
    </div>
  );
}