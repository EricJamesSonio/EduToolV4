import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { educatorClassApi } from "@/api/educator/class.api";
import type { EducatorClass } from "@/types/educator/class.types";

export const useEducatorClasses = () => {
  return useAsyncQuery<EducatorClass[]>(
    queryKeys.educator.classes.list(),
    educatorClassApi.getMyClasses,
  );
};

export const useEducatorClass = (classId: string) => {
  return useAsyncQuery<EducatorClass>(
    queryKeys.educator.classes.detail(classId),
    () => educatorClassApi.getOne(classId),
    { enabled: !!classId },
  );
};
