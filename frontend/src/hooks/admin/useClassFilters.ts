"use client";

import { useState, useMemo } from "react";

export interface ClassFilters {
  semesterId: string | undefined;
  educatorId: string | undefined;
}

export function useClassFilters() {
  const [filterSemesterId, setFilterSemesterId] = useState<string>("all");
  const [filterEducatorId, setFilterEducatorId] = useState<string>("all");

  const query: ClassFilters = useMemo(
    () => ({
      semesterId: filterSemesterId !== "all" ? filterSemesterId : undefined,
      educatorId: filterEducatorId !== "all" ? filterEducatorId : undefined,
    }),
    [filterSemesterId, filterEducatorId]
  );

  function resetSemester() {
    setFilterSemesterId("all");
  }

  return {
    filterSemesterId,
    filterEducatorId,
    setFilterSemesterId,
    setFilterEducatorId,
    resetSemester,
    query,
  };
}