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

  // NEW — used when the user picks a semester from the "All Departments"
  // grouped list (e.g. "1st - College"). A semester name can resolve to the
  // SAME physical Semester row across different departments' templates, so
  // picking one must set Department and Semester together — setting only
  // the semesterId would match "everyone's 1st semester" across every
  // department, not just the one implied by the label.
  function setDepartmentAndSemester(programId: string, semesterId: string) {
    setFilterProgramIdRaw(programId);
    setFilterSemesterId(semesterId);
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
    setDepartmentAndSemester,
    setSearch,
    resetSemester,
    query,
  };
}