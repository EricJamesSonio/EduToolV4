// filepath: frontend/src/components/educator/lessons/ConceptBuildViewer.tsx

"use client";

import { LessonConcept } from "@/types/educator/lesson.types";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface ConceptBuildViewerProps {
  classId: string;
  lessonId: string;
  concept: LessonConcept | null;
  onReExtract?: () => void;
  isExtracting?: boolean;
}

export function ConceptBuildViewer({
  classId,
  lessonId,
  concept,
  onReExtract,
  isExtracting = false,
}: ConceptBuildViewerProps): React.JSX.Element {
  const router = useRouter();

  /**
   * ❌ No concept at all
   */
  if (!concept) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No concept build yet. Save lesson content (10+ words) to trigger extraction automatically.
      </div>
    );
  }

  /**
   * 🔄 Extraction loading state (frontend-driven now)
   */
  if (isExtracting) {
    return (
      <div className="rounded-lg border p-6 flex items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Extracting concepts...
      </div>
    );
  }

  /**
   * ✅ NEW: read from raw JSON content
   */
  const sections = (concept.content as any)?.sections ?? [];

  return (
    <div className="rounded-lg border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {sections.length} sections extracted
        </span>

        <span className="text-xs text-muted-foreground">
          Built{" "}
          {new Date(
            // support both snake_case and camelCase just in case
            (concept as any).created_at ?? (concept as any).createdAt
          ).toLocaleDateString()}
        </span>
      </div>

      {/* Sections */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section: any, i: number) => (
          <div
            key={i}
            className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm"
          >
            <span className="font-medium">{section.name}</span>
            <span className="text-muted-foreground">
              ({section.items?.length ?? 0})
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          onClick={() =>
            router.push(
              `/educator/classes/${classId}/assessments/new?lessonId=${lessonId}`
            )
          }
        >
          Use in Assessment
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>

        {onReExtract && (
          <Button size="sm" variant="outline" onClick={onReExtract}>
            Re-extract
          </Button>
        )}
      </div>
    </div>
  );
}