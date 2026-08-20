"use client";
import { useState, useMemo } from "react";

export interface ClassFilters {
  semesterId: string | undefined;
  educatorId: string | undefined;
  programId: string | undefined;
  search: string | undefined;
}

export function useClassFilters() {
  const [filterProgramId, setFilterProgramIdRaw] = useState<string>("all");
  const [filterSemesterId, setFilterSemesterId] = useState<string>("all");
  const [filterEducatorId, setFilterEducatorId] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Changing department invalidates whatever semester was selected —
  // always fall back to "all" so the Select never points at a stale id.
  function setFilterProgramId(value: string) {
    setFilterProgramIdRaw(value);
    setFilterSemesterId("all");
  }

  const query: ClassFilters = useMemo(
    () => ({
      semesterId: filterSemesterId !== "all" ? filterSemesterId : undefined,
      educatorId: filterEducatorId !== "all" ? filterEducatorId : undefined,
      programId: filterProgramId !== "all" ? filterProgramId : undefined,
      search: search.trim() ? search.trim() : undefined,
    }),
    [filterSemesterId, filterEducatorId, filterProgramId, search]
  );

  function resetSemester() {
    setFilterSemesterId("all");
  }

  return {
    filterProgramId,
    filterSemesterId,
    filterEducatorId,
    search,
    setFilterProgramId,
    setFilterSemesterId,
    setFilterEducatorId,
    setSearch,
    resetSemester,
    query,
  };
}