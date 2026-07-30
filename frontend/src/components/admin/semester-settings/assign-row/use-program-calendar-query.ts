import { useMemo } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { programCalendarApi } from "@/api/admin/program-calendar.api";
import type { SemesterTemplate } from "@/types/admin/semester-template.types";

export function useProgramCalendarQuery(
  program: { id: string; type: string; school_year_id: string; semesterAssignment?: { template_id: string } | null },
  templates: SemesterTemplate[],
) {
  const { data: calendarInfo } = useAsyncQuery(
    queryKeys.admin.programCalendar.detail(program.id, program.school_year_id),
    () => programCalendarApi.getForProgram(program.id, program.school_year_id),
    { enabled: !!program.school_year_id },
  );

  const calendarBreaks = calendarInfo?.breaks ?? [];

  const hasNoCalendar = !calendarInfo;

  const matchingTemplates = useMemo(() => {
    const typeFiltered = templates.filter((t) => t.program_type === program.type)
    if (!calendarBreaks.length) return typeFiltered;
    const filtered = typeFiltered.filter((t) => t.semesters.length === calendarBreaks.length);
    const current = program.semesterAssignment;
    if (current && !filtered.some((t) => t.id === current.template_id)) {
      const ct = typeFiltered.find((t) => t.id === current.template_id);
      if (ct) return [...filtered, ct];
    }
    return filtered;
  }, [templates, calendarBreaks.length, program.semesterAssignment, program.type]);

  return {
    calendarInfo,
    hasNoCalendar,
    calendarBreaks,
    matchingTemplates,
    calendarStart: calendarInfo?.startDate ?? "",
    calendarEnd: calendarInfo?.endDate ?? "",
  };
}
