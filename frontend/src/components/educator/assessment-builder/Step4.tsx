import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assessmentApi } from "@/api/educator/assessment.api";
import type { Question } from "@/types/educator/assessment.types";

export function Step4({
  classId,
  previewId,
  onQuestionsReady,
}: {
  classId: string;
  previewId: string;
  onQuestionsReady: (q: Question[]) => void;
}) {
  const advancedRef = useRef(false);
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  const { data: preview } = useQuery({
    queryKey: ["preview", previewId],
    queryFn: () => assessmentApi.getPreview(classId, previewId),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "completed" || s === "failed" ? false : 1500;
    },
    enabled: !!previewId && !advancedRef.current && !cancelling,
    retry: false,
  });

  const ready =
    preview?.status === "completed" && !!preview?.questions?.length;
  if (ready && !advancedRef.current) {
    advancedRef.current = true;
    setTimeout(() => {
      const mapped = preview!.questions!.map((q: any, i: number) => ({
        id: `preview-${i}`,
        assessmentId: previewId,
        order: q.number ?? i + 1,
        type: q.type as Question["type"],
        text: q.question,
        choices: Array.isArray(q.choices)
          ? q.choices
              .slice(0, 4)
              .map((t: string, j: number) => ({
                label: ["A", "B", "C", "D"][j] as "A" | "B" | "C" | "D",
                text: t,
              }))
          : null,
        correctAnswer: q.answer ?? q.correct_answer ?? null,
        points: 1,
        isLocked: false,
        isManual: q.type === "manual",
      }));
      onQuestionsReady(mapped);
    }, 300);
  }

  const failed = preview?.status === "failed" && !ready;

  async function handleCancel() {
    setCancelling(true);
    try {
      await assessmentApi.cancelPreview(classId, previewId);
    } catch {}
    router.back();
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 max-w-md mx-auto text-center">
      {ready ? (
        <>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm font-medium">
            Questions generated! Advancing...
          </p>
        </>
      ) : failed ? (
        <>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl font-bold">!</span>
          </div>
          <p className="text-sm font-medium text-red-600">
            Generation failed
          </p>
          <p className="text-xs text-muted-foreground">
            {preview?.message ?? "Unknown error"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            Go back and try again
          </Button>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
          <p className="text-sm font-medium">
            Generating assessment questions...
          </p>
          {preview?.chunksTotal ? (
            <>
              <p className="text-xs text-muted-foreground">
                {preview.message}
              </p>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{
                    width: `${(preview.chunksDone / preview.chunksTotal) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {preview.chunksDone}/{preview.chunksTotal} chunks
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {preview?.message ?? "Starting generation..."}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={cancelling}
            className="mt-4"
          >
            {cancelling ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            Cancel
          </Button>
        </>
      )}
    </div>
  );
}
