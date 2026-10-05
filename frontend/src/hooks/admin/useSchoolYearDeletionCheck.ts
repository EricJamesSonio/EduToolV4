import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { schoolYearApi } from "@/api/admin/school-year.api";
import type { DeletionCheck } from "@/types/admin/deletion.types";

// ── GET /school-years/:id/deletion-check ──────────────────
// Lists what blocks a school-year delete (enrolled students, applications,
// classes, active status) and what goes with it (departments, levels,
// sections, subjects, ...). Enable only while the delete dialog is open
// (pass `enabled`).

export const useSchoolYearDeletionCheck = (
  schoolYearId?: string,
  enabled = true,
) => {
  return useAsyncQuery<DeletionCheck>(
    queryKeys.admin.schoolYears.deletionCheck(schoolYearId ?? ""),
    () => schoolYearApi.deletionCheck(schoolYearId!),

    {
      enabled: !!schoolYearId && enabled,
      meta: { preset: "detail", feature: "schoolYears" },
    },
  );
};
