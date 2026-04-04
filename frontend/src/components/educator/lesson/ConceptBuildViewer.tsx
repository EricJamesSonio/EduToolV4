// filepath: frontend/src/components/educator/lessons/ConceptBuildViewer.tsx

"use client";

import { LessonConcept } from "@/types/educator/lesson.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Layers, ArrowRight } from "lucide-react";
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

  if (!concept || concept.status === "none") {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No concept build yet. Save lesson content (10+ words) to trigger
        extraction automatically.
      </div>
    );
  }

  if (concept.status === "building" || isExtracting) {
    return (
      <div className="rounded-lg border p-6 flex items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Extracting concepts...
      </div>
    );
  }

  const isOutdated = concept.status === "outdated";

  return (
    <div className="rounded-lg border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {concept.totalItems} concept items across {concept.sections.length}{" "}
            sections
          </span>
          {isOutdated && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
              Outdated
            </Badge>
          )}
        </div>
        {concept.builtAt && (
          <span className="text-xs text-muted-foreground">
            Built {new Date(concept.builtAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Section breakdown */}
      <div className="flex flex-wrap gap-2">
        {concept.sections.map((section) => (
          <div
            key={section.id}
            className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm"
          >
            <span className="font-medium">{section.name}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {section.keywordCount} items
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