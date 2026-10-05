import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { programApi } from "@/api/admin/program.api";
import type { DeletionCheck } from "@/types/admin/deletion.types";

// ── GET /programs/:id/deletion-check ──────────────────────
// Fetches what blocks a department delete and what goes with it.
// Enable only while the delete dialog is open (pass `enabled`).

export const useProgramDeletionCheck = (
  programId?: string,
  enabled = true,
) => {
  return useAsyncQuery<DeletionCheck>(
    queryKeys.admin.programs.deletionCheck(programId ?? ""),
    () => programApi.deletionCheck(programId!),

    {
      enabled: !!programId && enabled,
      meta: { preset: "detail", feature: "programs" },
    },
  );
};
