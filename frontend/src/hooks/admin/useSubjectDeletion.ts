import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { subjectApi } from "@/api/admin/subject.api";
import type { DeletionCheck } from "@/types/admin/deletion.types";

// ── GET /subjects/:id/deletion-check ─────────────────────
// Reports the delete-vs-archive outcome plus what goes with it.
// Enable only while the delete dialog is open (pass `enabled`).

export const useSubjectDeletionCheck = (
  subjectId?: string,
  enabled = true,
) => {
  return useAsyncQuery<DeletionCheck>(
    queryKeys.admin.subjects.deletionCheck(subjectId ?? ""),
    () => subjectApi.deletionCheck(subjectId!),

    {
      enabled: !!subjectId && enabled,
      meta: { preset: "detail", feature: "subjects" },
    },
  );
};

// ── DELETE /subjects/:id (hard delete or archive) ─────────

export const useDeleteSubject = () => {
  return useMutationWithInvalidation(
    (id: string) => subjectApi.remove(id),

    {
      invalidateKeys: [
        queryKeys.admin.subjects.all,
        queryKeys.admin.schoolYears.readiness(),
        queryKeys.admin.classGenerator.all,
      ],
    },
  );
};

// ── PATCH /subjects/:id/restore ───────────────────────────

export const useRestoreSubject = () => {
  return useMutationWithInvalidation(
    (id: string) => subjectApi.restore(id),

    {
      invalidateKeys: [
        queryKeys.admin.subjects.all,
        queryKeys.admin.schoolYears.readiness(),
        queryKeys.admin.classGenerator.all,
      ],
    },
  );
};
