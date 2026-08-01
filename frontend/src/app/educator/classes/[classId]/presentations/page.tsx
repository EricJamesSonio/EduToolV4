"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  usePresentations,
  useDeletePresentation,
} from "@/hooks/educator/usePresentations";
import { useLessons } from "@/hooks/educator/useLessons";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListItemCardAction } from "@/components/shared/ListItemCard";
import { cn, pickCardColor } from "@/lib/utils";
import {
  Plus,
  Loader2,
  Eye,
  Edit3,
  Trash2,
  Presentation,
  Calendar,
} from "lucide-react";

function LessonSelectDialog({
  classId,
}: {
  classId: string;
}): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: lessonsData = [], isLoading: lessonsLoading } =
    useLessons(classId);
  const { data: weeksData = [] } = useClassWeeks(classId);

  const lessonMap = useMemo(() => {
    const map = new Map<number, (typeof lessonsData)[0][]>();
    for (const lesson of lessonsData) {
      const w = lesson.weekNumber;
      if (!map.has(w)) map.set(w, []);
      map.get(w)!.push(lesson);
    }
    return map;
  }, [lessonsData]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Presentation
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select a Lesson</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {lessonsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading lessons...
            </div>
          ) : weeksData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No weeks found for this class.
            </p>
          ) : (
            weeksData.map((week) => {
              const lessons = lessonMap.get(week.globalWeek) ?? [];
              if (lessons.length === 0) return null;

              return (
                <div key={week.globalWeek}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {week.label}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          setOpen(false);
                          router.push(
                            `/educator/classes/${classId}/presentations/new?lessonId=${lesson.id}`,
                          );
                        }}
                        className="w-full text-left text-sm rounded-lg border bg-card px-4 py-3 hover:border-primary/40 hover:bg-accent/30 transition-colors"
                      >
                        {lesson.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PresentationCard({
  presentation,
  lessonName,
  classId,
  weekNumber,
}: {
  presentation: {
    id: string;
    title: string;
    lessonId: string;
    slides: unknown[];
    template: string;
    createdAt: string;
  };
  lessonName: string;
  classId: string;
  weekNumber: number | null;
}): React.JSX.Element {
  const router = useRouter();
  const { mutateAsync: deletePresentation, isPending: isDeleting } =
    useDeletePresentation(classId);

  const slideCount = presentation.slides?.length ?? 0;

  async function handleDelete(): Promise<void> {
    await deletePresentation(presentation.id);
    toast.success("Presentation deleted.");
  }

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "rounded-md p-2.5 shrink-0",
              pickCardColor(presentation.id),
            )}
          >
            <Presentation className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <CardTitle className="truncate">{presentation.title}</CardTitle>
            <p className="text-xs text-muted-foreground truncate">
              {lessonName || "Unknown lesson"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {weekNumber !== null && (
            <>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Week {weekNumber}
              </span>
              <span>·</span>
            </>
          )}
          <span>{slideCount} slide{slideCount !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>{format(new Date(presentation.createdAt), "MMM d, yyyy")}</span>
        </div>
      </CardContent>

      <div className="flex items-center gap-2 px-3 pb-3 sm:px-6 sm:pb-4">
        <ListItemCardAction
          icon={Eye}
          label="View"
          onClick={() =>
            router.push(
              `/educator/classes/${classId}/presentations/${presentation.id}/view`,
            )
          }
        />
        <ListItemCardAction
          icon={Edit3}
          label="Edit"
          onClick={() =>
            router.push(
              `/educator/classes/${classId}/presentations/new?lessonId=${presentation.lessonId}&presentationId=${presentation.id}`,
            )
          }
        />
        <div className="ml-auto">
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this presentation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove &quot;{presentation.title}&quot;
                  and all its slides. This action cannot be undone.
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
                  Delete Presentation
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}

function CardSkeleton(): React.JSX.Element {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-md shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-32" />
      </CardContent>
      <div className="flex items-center gap-2 px-3 pb-3 sm:px-6 sm:pb-4">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-14 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md ml-auto" />
      </div>
    </Card>
  );
}

export default function PresentationsPage(): React.JSX.Element {
  const { classId } = useParams<{ classId: string }>();

  const { data: presentations, isLoading } = usePresentations(classId);
  const { data: lessonsData = [] } = useLessons(classId);

  const [weekFilter, setWeekFilter] = useState<number | "all">("all");

  const lessonNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const lesson of lessonsData) {
      map.set(lesson.id, lesson.title);
    }
    return map;
  }, [lessonsData]);

  const lessonWeekMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const lesson of lessonsData) {
      map.set(lesson.id, lesson.weekNumber);
    }
    return map;
  }, [lessonsData]);

  const presentationWeeks = useMemo(() => {
    const weeks = new Set<number>();
    for (const p of presentations ?? []) {
      const wn = lessonWeekMap.get(p.lessonId);
      if (wn !== undefined) weeks.add(wn);
    }
    return [...weeks].sort((a, b) => a - b);
  }, [presentations, lessonWeekMap]);

  const filteredPresentations = useMemo(() => {
    if (weekFilter === "all") return presentations;
    return (presentations ?? []).filter(
      (p) => lessonWeekMap.get(p.lessonId) === weekFilter,
    );
  }, [presentations, weekFilter, lessonWeekMap]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Presentations"
        actions={<LessonSelectDialog classId={classId} />}
      />

      {!isLoading && presentations && presentations.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground shrink-0">Filter by week:</span>
          <Select
            value={String(weekFilter)}
            onValueChange={(v) => setWeekFilter(v === "all" ? "all" : Number(v))}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Week" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Weeks</SelectItem>
              {presentationWeeks.map((wn) => (
                <SelectItem key={wn} value={String(wn)}>Week {wn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !presentations || presentations.length === 0 ? (
        <EmptyState
          icon={Presentation}
          title="No presentations yet"
          description="Create a presentation from any of your lessons to get started."
          action={{
            label: "New Presentation",
            onClick: () => {
              const btn = document.querySelector(
                '[data-slot="dialog-trigger"]',
              ) as HTMLButtonElement;
              btn?.click();
            },
          }}
        />
      ) : filteredPresentations.length === 0 ? (
        <EmptyState
          icon={Presentation}
          title="No presentations for this week"
          description="Try selecting a different week or create a new presentation."
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          {filteredPresentations.map((pres) => (
            <PresentationCard
              key={pres.id}
              presentation={pres}
              lessonName={lessonNameMap.get(pres.lessonId) ?? ""}
              classId={classId}
              weekNumber={lessonWeekMap.get(pres.lessonId) ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
