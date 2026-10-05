import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { educatorApi } from "@/api/admin/educator.api";
import type { DeletionCheck } from "@/types/admin/deletion.types";

// ── GET /educators/:id/deletion-check ─────────────────────
// Lists what blocks an educator's delete (classes, teachable links,
// meetings, ownership and grade-lock history). Blocked means unassign
// first — there is no deactivate alternative. Enable only while the
// delete dialog is open (pass `enabled`).

export const useEducatorDeletionCheck = (
  educatorId?: string,
  enabled = true,
) => {
  return useAsyncQuery<DeletionCheck>(
    queryKeys.admin.educators.deletionCheck(educatorId ?? ""),
    () => educatorApi.deletionCheck(educatorId!),

    {
      enabled: !!educatorId && enabled,
      meta: { preset: "detail", feature: "educators" },
    },
  );
};
