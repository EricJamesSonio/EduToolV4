"use client";

import { useState, useMemo } from "react";

export interface ClassFilters {
  schoolYearId: string | undefined;
  semesterId: string | undefined;
  educatorId: string | undefined;
}

export function useClassFilters() {
  const [filterSchoolYearId, setFilterSchoolYearId] = useState<string>("all");
  const [filterSemesterId, setFilterSemesterId] = useState<string>("all");
  const [filterEducatorId, setFilterEducatorId] = useState<string>("all");

  const query: ClassFilters = useMemo(
    () => ({
      schoolYearId: filterSchoolYearId !== "all" ? filterSchoolYearId : undefined,
      semesterId: filterSemesterId !== "all" ? filterSemesterId : undefined,
      educatorId: filterEducatorId !== "all" ? filterEducatorId : undefined,
    }),
    [filterSchoolYearId, filterSemesterId, filterEducatorId]
  );

  function handleSchoolYearChange(value: string) {
    setFilterSchoolYearId(value ?? "all");
    setFilterSemesterId("all"); // reset dependent filter
  }

  return {
    filterSchoolYearId,
    filterSemesterId,
    filterEducatorId,
    setFilterSemesterId,
    setFilterEducatorId,
    handleSchoolYearChange,
    query,
  };
}