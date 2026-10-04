import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { classGeneratorApi } from "@/api/admin/class-generator.api";
import { queryKeys } from "@/hooks/queryKeys.factory";
import type {
  GenerateRequest,
  GeneratePreview,
  GenerateReadiness,
  GeneratorRoster,
  CommitGenerateResponse,
} from "@/types/admin/class-generator.types";
import type { AxiosError } from "axios";

const errMessage = (err: unknown, fallback: string) =>
  (err as AxiosError<{ message?: string }>)?.response?.data?.message ?? fallback;

/**
 * Readiness is shown as the admin configures, so they learn what is missing
 * while choosing — not after clicking Generate.
 */
export const useGeneratorReadiness = (
  schoolYearId: string | undefined,
  programIds: string[],
  scope?: {
    courseIds?: string[];
    strandIds?: string[];
    educatorIds?: string[];
  },
  enabled = true,
) => {
  const key = programIds.join(",");
  const courseKey = (scope?.courseIds ?? []).join(",");
  const strandKey = (scope?.strandIds ?? []).join(",");
  const educatorKey = (scope?.educatorIds ?? []).join(",");
  return useQuery<GenerateReadiness>({
    queryKey: [
      ...queryKeys.admin.classGenerator.readiness(schoolYearId ?? "", key),
      courseKey,
      strandKey,
      educatorKey,
    ],
    queryFn: () =>
      classGeneratorApi.readiness({
        schoolYearId: schoolYearId!,
        programIds: key,
        ...(courseKey ? { courseIds: courseKey } : {}),
        ...(strandKey ? { strandIds: strandKey } : {}),
        ...(educatorKey ? { educatorIds: educatorKey } : {}),
      }),
    enabled: enabled && !!schoolYearId && programIds.length > 0,
    // Readiness is cheap but not free; a short window keeps the panel fresh
    // without refetching on every keystroke.
    staleTime: 30_000,
  });
};

/**
 * Who can teach what this school year, for the generate page's roster panel.
 * Read-only and year-scoped.
 */
export const useGeneratorRoster = (schoolYearId: string | undefined) =>
  useQuery<GeneratorRoster>({
    queryKey: queryKeys.admin.classGenerator.roster(schoolYearId ?? ""),
    queryFn: () => classGeneratorApi.roster(schoolYearId!),
    enabled: !!schoolYearId,
    staleTime: 30_000,
  });

/** Builds a plan. Writes nothing, so it is safe to call repeatedly. */
export const useGeneratePreview = () =>
  useMutation<GeneratePreview, Error, GenerateRequest>({
    mutationFn: (body) => classGeneratorApi.preview(body),
    onError: (err) => toast.error(errMessage(err, "Could not build a plan.")),
  });

export const useCommitGenerated = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation<
    CommitGenerateResponse,
    Error,
    GenerateRequest & { confirmed: boolean }
  >({
    mutationFn: (body) => classGeneratorApi.commit(body),
    onSuccess: (result, variables) => {
      toast.success(
        `Generated ${result.created} class${result.created === 1 ? "" : "es"}.`,
      );
      // One item failing must be visible, not buried.
      if (result.skipped.length > 0) {
        toast.warning(
          `${result.skipped.length} item(s) were skipped. First: ${result.skipped[0].detail}`,
          { duration: 9000 },
        );
      }
      // Classes, and anything derived from them, are now stale.
      void qc.invalidateQueries({ queryKey: queryKeys.admin.classes.all });
      void qc.invalidateQueries({ queryKey: queryKeys.admin.schoolYears.all });
      void qc.invalidateQueries({ queryKey: queryKeys.admin.semesters.all });
      void qc.invalidateQueries({
        queryKey: queryKeys.admin.classGenerator.all,
      });
      onDone?.();
    },
    onError: (err) => toast.error(errMessage(err, "Generation failed.")),
  });
};