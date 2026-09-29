import { useMemo } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { classApi } from "@/api/admin/class.api";
import type { Class } from "@/types/admin/class.types";

interface UseClassScheduleContextParams {
  /** School year the class belongs to — schedules are only compared within it. */
  schoolYearId?: string | null;
  /** Currently selected educator, if any. */
  educatorId?: string;
  /** Currently selected section, if any (a class's section is optional). */
  sectionId?: string;
  /**
   * The class currently being edited, if any. Its own existing schedule
   * slots are filtered out of both lists below so editing a class doesn't
   * flag its own current slots as conflicting with themselves.
   */
  excludeClassId?: string;
  /** Set false to skip both fetches (e.g. dialog not open yet). */
  enabled?: boolean;
}

/**
 * Fetches the other classes contending for the same educator's week and the
 * same section's week (e.g. "BSCS 1-A"), scoped to one school year.
 *
 * Shared by CreateClassDialog and EditClassDialog so both the "add a class"
 * and "edit a class" schedule pickers validate against — and visually
 * render — the same two things: the educator's existing weekly schedule,
 * and the section's existing weekly schedule. Mirrors the backend's two
 * separate checks (assertNoEducatorConflict / assertNoSectionConflict) so a
 * conflict is caught and shown before the person ever hits Save.
 */
export function useClassScheduleContext({
  schoolYearId,
  educatorId,
  sectionId,
  excludeClassId,
  enabled = true,
}: UseClassScheduleContextParams) {
  const { data: educatorClassesRaw, isLoading: educatorLoading } = useAsyncQuery(
    queryKeys.admin.classes.list({ schoolYearId, educatorId }),
    () => classApi.getAll({ schoolYearId: schoolYearId!, educatorId }),
    {
      enabled: enabled && !!schoolYearId && !!educatorId,
      staleTime: 5 * 60 * 1000,
    },
  );

  const { data: sectionClassesRaw, isLoading: sectionLoading } = useAsyncQuery(
    queryKeys.admin.classes.list({ schoolYearId, sectionId }),
    () => classApi.getAll({ schoolYearId: schoolYearId!, sectionId }),
    {
      enabled: enabled && !!schoolYearId && !!sectionId,
      staleTime: 5 * 60 * 1000,
    },
  );

  const educatorClasses = useMemo<Class[] | undefined>(
    () => educatorClassesRaw?.filter((c) => c.id !== excludeClassId),
    [educatorClassesRaw, excludeClassId],
  );
  const sectionClasses = useMemo<Class[] | undefined>(
    () => sectionClassesRaw?.filter((c) => c.id !== excludeClassId),
    [sectionClassesRaw, excludeClassId],
  );

  return {
    educatorClasses,
    sectionClasses,
    isLoading: educatorLoading || sectionLoading,
  };
}