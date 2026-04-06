// frontend/src/hooks/admin/useSchoolYear.ts
import { useState, useEffect } from "react";
import { useSchoolYears } from "./useSchoolYears";

export function useSchoolYear() {
  const { data: schoolYears = [], isLoading } = useSchoolYears();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (schoolYears.length > 0 && !selectedId) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSelectedId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, selectedId]);

  return { schoolYears, selectedId, setSelectedId, isLoading };
}