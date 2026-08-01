"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  useLesson,
  useUpdateLesson,
  useDeleteLesson,
  useTriggerExtraction,
  useConceptBuild,
} from "@/hooks/educator/useLessons";
import { usePresentationByLesson } from "@/hooks/educator/usePresentations";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks";
import { LessonForm } from "@/components/educator/lesson/LessonForm";
import { ConceptBuildViewer } from "@/components/educator/lesson/ConceptBuildViewer";
import { PageHeader } from "@/components/shared/PageHeader";

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
import { UpdateLessonRequest, CreateLessonRequest } from "@/api/educator/lesson.api";
import { Pencil, Trash2, Loader2, RotateCcw, Presentation } from "lucide-react";

export default function LessonDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = params.classId as string;
  const lessonId = params.lessonId as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showReExtractBanner, setShowReExtractBanner] = useState(false);
  const [isBuilding, setIsBuilding] = useState(
    searchParams.get("extracting") === "true",
  );

  const {
    data: lesson,
    isLoading,
    refetch,
  } = useLesson(classId, lessonId, isBuilding);

  const { data: existingPresentation } = usePresentationByLesson(classId, lessonId);

  const { data: weeks } = useClassWeeks(classId);
  const { mutateAsync: updateLesson, isPending: isUpdating } =
    useUpdateLesson(classId);
  const { mutateAsync: deleteLesson, isPending: isDeleting } =
    useDeleteLesson(classId);
  const { mutateAsync: triggerExtraction, isPending: isTriggering } =
    useTriggerExtraction(classId);
  const { mutateAsync: conceptBuild, isPending: isConceptBuilding } =
    useConceptBuild(classId);

  const isExtracting = isBuilding || isTriggering || isConceptBuilding;

  // Poll when building
  useEffect(() => {
    if (!isBuilding) return;
    if (lesson?.concept) {
      setIsBuilding(false);
      return;
    }
    const timer = setInterval(() => refetch(), 3000);
    return () => clearInterval(timer);
  }, [isBuilding, lesson?.concept, refetch]);

  async function handleUpdate(data: CreateLessonRequest): Promise<void> {
    const detailChanged =
      data.detail !== undefined && data.detail !== lesson?.detail;
    const hasExistingBuild = lesson?.concept !== null;

    await updateLesson({ lessonId, data });
    setIsEditing(false);

    if (detailChanged && hasExistingBuild) {
      setShowReExtractBanner(true);
    } else {
      toast.success("Lesson updated.");
    }
  }

  async function handleBuildConcepts(): Promise<void> {
    const detail = lesson?.detail;
    if (!detail) {
      toast.error("Lesson has no content to build from.");
      return;
    }
    setIsBuilding(true);
    await conceptBuild({ lessonId, detail });
    refetch();
  }

  async function handleReExtract(): Promise<void> {
    const detail = lesson?.detail;
    if (!detail) {
      toast.error("Lesson has no content to extract.");
      return;
    }
    setIsBuilding(true);
    setShowReExtractBanner(false);
    await triggerExtraction({ lessonId, detail });
    refetch();
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
      <PageHeader
        title={lesson.title}
        description="View and edit this lesson's content."
        breadcrumbs={[
          { label: "Lessons", href: `/educator/classes/${classId}/lessons` },
          { label: lesson.title },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setIsEditing((v) => !v)}
            >
              <Pencil className="h-3.5 w-3.5" />
              {isEditing ? "Cancel Edit" : "Edit"}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove &quot;{lesson.title}&quot; and
                    its concept build. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete Lesson
                  </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {existingPresentation ? (
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    router.push(
                      `/educator/classes/${classId}/presentations/${existingPresentation.id}/view`
                    )
                  }
                >
                  <Presentation className="h-3.5 w-3.5" />
                  View Presentation
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    router.push(
                      `/educator/classes/${classId}/presentations/new?lessonId=${lessonId}`
                    )
                  }
                >
                  <Presentation className="h-3.5 w-3.5" />
                  Create Presentation
                </Button>
              )}
            </>
          }
        />

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
          availableWeeks={
            weeks ?? [
              {
                label: String(lesson.weekNumber),
                value: lesson.weekNumber,
              },
            ]
          }
          lesson={lesson}
          isLoading={isUpdating}
          onSubmit={handleUpdate}
        />
      ) : (
        <div className="rounded-lg border bg-card divide-y divide-border">
          <div className="flex items-center gap-6 px-6 py-4">
            <span className="w-28 text-sm text-muted-foreground shrink-0">Title</span>
            <span className="text-sm font-medium">{lesson.title}</span>
          </div>
          {lesson.description && (
            <div className="flex items-center gap-6 px-6 py-4">
              <span className="w-28 text-sm text-muted-foreground shrink-0">Description</span>
              <span className="text-sm">{lesson.description}</span>
            </div>
          )}
          <div className="flex items-center gap-6 px-6 py-4">
            <span className="w-28 text-sm text-muted-foreground shrink-0">Week</span>
            <span className="text-sm">Week {lesson.weekNumber}</span>
          </div>
          <div className="px-6 py-4 space-y-1.5">
            <span className="text-sm text-muted-foreground">Lesson Detail</span>
            <p className="text-sm whitespace-pre-wrap">{lesson.detail}</p>
          </div>
        </div>
      )}

      {/* Concept build section */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Concept Build</h2>
        <ConceptBuildViewer
          classId={classId}
          lessonId={lessonId}
          concept={lesson.concept}
          onBuildConcepts={
            !isEditing && !isExtracting ? handleBuildConcepts : undefined
          }
          isExtracting={isExtracting}
        />
      </div>
    </div>
  );
}
