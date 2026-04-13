import { useState, useEffect } from "react";
import type { SubjectType } from "@/types/admin/subject.types";

export interface FiltersState {
  selectedSchoolYearId: string | null;
  activeTab: SubjectType;
  selectedProgramId: string;
  filterLevelId: string;
  selectedCourseId: string;
  selectedStrandId: string;
}

export interface FiltersActions {
  setSelectedSchoolYearId: (id: string | null) => void;
  setActiveTab: (tab: SubjectType) => void;
  setSelectedProgramId: (id: string) => void;
  setFilterLevelId: (id: string) => void;
  setSelectedCourseId: (id: string) => void;
  setSelectedStrandId: (id: string) => void;
  resetAllFilters: () => void;
}

export function useSubjectFilters(): FiltersState & FiltersActions {
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState<SubjectType>("major");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const [filterLevelId, setFilterLevelId] = useState<string>("all");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [selectedStrandId, setSelectedStrandId] = useState<string>("all");

  // Reset filters when school year or tab changes
  useEffect(() => {
    setSelectedProgramId("all");
    setFilterLevelId("all");
    setSelectedCourseId("all");
    setSelectedStrandId("all");
  }, [selectedSchoolYearId, activeTab]);

  // Reset level when course/strand changes
  useEffect(() => {
    setFilterLevelId("all");
  }, [selectedCourseId, selectedStrandId]);

  const resetAllFilters = () => {
    setSelectedSchoolYearId(null);
    setActiveTab("major");
    setSelectedProgramId("all");
    setFilterLevelId("all");
    setSelectedCourseId("all");
    setSelectedStrandId("all");
  };

  return {
    selectedSchoolYearId,
    activeTab,
    selectedProgramId,
    filterLevelId,
    selectedCourseId,
    selectedStrandId,
    setSelectedSchoolYearId,
    setActiveTab,
    setSelectedProgramId,
    setFilterLevelId,
    setSelectedCourseId,
    setSelectedStrandId,
    resetAllFilters,
  };
}