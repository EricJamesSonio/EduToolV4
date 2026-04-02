import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { educatorClassApi } from "@/api/educator/class.api";
import type { EducatorClass } from "@/types/educator/class.types";

export const EDUCATOR_CLASSES_KEY = ["educator", "classes"] as const;

/**
 * Fetches the educator's own assigned classes.
 * Enrichment (subject name, section name, etc.) is done on the page
 * by joining with admin lookup queries.
 */
export const useEducatorClasses = (): UseQueryResult<EducatorClass[], Error> => {
  return useQuery({
    queryKey: EDUCATOR_CLASSES_KEY,
    queryFn: educatorClassApi.getMyClasses,
  });
};

/**
 * Single class — used inside /educator/classes/[classId] pages.
 */
export const useEducatorClass = (
  classId: string,
): UseQueryResult<EducatorClass, Error> => {
  return useQuery({
    queryKey: [...EDUCATOR_CLASSES_KEY, classId],
    queryFn: () => educatorClassApi.getOne(classId),
    enabled: !!classId,
  });
};