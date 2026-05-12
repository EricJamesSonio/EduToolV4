// Admin Academics Page
// Academic management and configuration

"use client";

import { useEffect, useState } from "react";
import {
  useCreateProgram,
  useDeleteProgram,
  useProgramsWithStats,
} from "../../hooks/usePrograms";
import { useSchoolYears } from "../../hooks/useSchoolYears";
import type { SchoolYear, CreateSchoolYearDto } from '../../types/school-year.types';
import type { ProgramWithStats, CreateProgramDto } from '../../types/program.types';
import AdminLayout from "../../components/AdminLayout";
import CreateSchoolYearModal from "../../components/CreateSchoolYearModal";
import CreateProgramModal from "../../components/CreateProgramModal";
import AcademicCoursePage from "../../components/admin/AcademicCoursePage";
import AcademicLevelPage from "../../components/admin/AcademicLevelPage";
import AcademicProgramPage from "../../components/admin/AcademicProgramPage";
import AcademicSchoolYearPage from "../../components/admin/AcademicSchoolYearPage";
import AcademicStrandPage from "../../components/admin/AcademicStrandPage";
import { useCreateSchoolYear } from "../../hooks/useSchoolYearMutations";

type ViewMode =
  | "school-year-selection"
  | "program-list"
  | "courses-view"
  | "strands-view"
  | "levels-view";

function AdminAcademics() {
  const [viewMode, setViewMode] = useState<ViewMode>("school-year-selection");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<SchoolYear | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithStats | null>(null);
  const [userInitiatedBack, setUserInitiatedBack] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateProgramModalOpen, setIsCreateProgramModalOpen] = useState(false);

  const createSchoolYearMutation = useCreateSchoolYear();
  const createProgramMutation = useCreateProgram();
  const deleteProgramMutation = useDeleteProgram();

  const {
    data: schoolYears = [],
    isLoading: schoolYearsLoading,
  } = useSchoolYears();

  const activeSchoolYear = schoolYears.find((sy) => sy.status === "active") || null;

  useEffect(() => {
    if (activeSchoolYear && !selectedSchoolYear && !userInitiatedBack) {
      setSelectedSchoolYear(activeSchoolYear);
      setViewMode("program-list");
    }
  }, [activeSchoolYear, selectedSchoolYear, userInitiatedBack]);

  const currentSchoolYear = selectedSchoolYear || activeSchoolYear;

  const {
    data: programs = [],
    isLoading: programsLoading,
  } = useProgramsWithStats(currentSchoolYear?.id || "");

  const handleSchoolYearSelect = (schoolYear: SchoolYear) => {
    setSelectedSchoolYear(schoolYear);
    setSelectedProgram(null);
    setViewMode("program-list");
    setUserInitiatedBack(false);
  };

  const handleCreateProgram = () => {
    setIsCreateProgramModalOpen(true);
  };

  const handleCreateSchoolYear = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCloseCreateProgramModal = () => {
    setIsCreateProgramModalOpen(false);
  };

  const handleCreateSchoolYearSubmit = async (data: CreateSchoolYearDto) => {
    try {
      await createSchoolYearMutation.mutateAsync(data);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create school year:", error);
    }
  };

  const handleCreateProgramSubmit = async (data: CreateProgramDto) => {
    try {
      await createProgramMutation.mutateAsync(data);
      setIsCreateProgramModalOpen(false);
    } catch (error) {
      console.error("Failed to create program:", error);
    }
  };

  const handleEditProgram = (program: ProgramWithStats) => {
    alert(`Edit program: ${program.name}`);
  };

  const handleDeleteProgram = async (program: ProgramWithStats) => {
    if (confirm(`Are you sure you want to delete "${program.name}"?`)) {
      await deleteProgramMutation.mutateAsync(program.id);
    }
  };

  const handleViewProgram = (program: ProgramWithStats) => {
    setSelectedProgram(program);

    if (program.courses.length > 0) {
      setViewMode("courses-view");
      return;
    }

    if (program.strands.length > 0) {
      setViewMode("strands-view");
      return;
    }

    setViewMode("levels-view");
  };

  const handleBackToSelection = () => {
    setSelectedSchoolYear(null);
    setSelectedProgram(null);
    setViewMode("school-year-selection");
    setUserInitiatedBack(true);
  };

  const handleBackToPrograms = () => {
    setSelectedProgram(null);
    setViewMode("program-list");
  };

  const isLoading =
    schoolYearsLoading || (programsLoading && viewMode === "program-list");

  return (
    <AdminLayout>
      <div className="admin-academics">
        <div className="admin-academics-content">
          {isLoading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner"></div>
              <span className="loading-text">Loading...</span>
            </div>
          ) : (
            <>
              {viewMode === "school-year-selection" && (
                <AcademicSchoolYearPage
                  schoolYears={schoolYears}
                  onCreateSchoolYear={handleCreateSchoolYear}
                  onSelectSchoolYear={handleSchoolYearSelect}
                />
              )}

              {viewMode === "program-list" && (
                <AcademicProgramPage
                  schoolYear={currentSchoolYear}
                  programs={programs}
                  onBackToSchoolYears={handleBackToSelection}
                  onCreateProgram={handleCreateProgram}
                  onEditProgram={handleEditProgram}
                  onDeleteProgram={handleDeleteProgram}
                  onViewProgram={handleViewProgram}
                />
              )}

              {viewMode === "courses-view" && selectedProgram && (
                <AcademicCoursePage
                  program={selectedProgram}
                  onBackToPrograms={handleBackToPrograms}
                  onCreateCourse={handleCreateProgram}
                />
              )}

              {viewMode === "strands-view" && selectedProgram && (
                <AcademicStrandPage
                  program={selectedProgram}
                  onBackToPrograms={handleBackToPrograms}
                  onCreateStrand={handleCreateProgram}
                />
              )}

              {viewMode === "levels-view" && selectedProgram && (
                <AcademicLevelPage
                  program={selectedProgram}
                  schoolYearId={currentSchoolYear?.id || ""}
                  onBackToPrograms={handleBackToPrograms}
                />
              )}
            </>
          )}
        </div>
      </div>

      <CreateSchoolYearModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateSchoolYearSubmit}
        isLoading={createSchoolYearMutation.isPending}
        error={createSchoolYearMutation.error?.message || null}
      />

      <CreateProgramModal
        isOpen={isCreateProgramModalOpen}
        onClose={handleCloseCreateProgramModal}
        onSubmit={handleCreateProgramSubmit}
        isLoading={createProgramMutation.isPending}
        schoolYearId={currentSchoolYear?.id || ""}
      />

    </AdminLayout>
  );
}

export default AdminAcademics;
export { AdminAcademics };
