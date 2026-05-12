// Admin Academics Page
// Academic management and configuration

"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSchoolYears } from "../../hooks/useSchoolYears";
import { useProgramsBySchoolYear, useCreateProgram, useDeleteProgram } from "../../hooks/usePrograms";

import type { SchoolYear } from "../../types/school-year.types";
import type { Program } from "../../types/program.types";
import type { CreateSchoolYearDto } from "../../types/school-year.types";
import type { CreateProgramDto } from "../../types/program.types";
import AdminLayout from "../../components/AdminLayout";
import ActionButtons from "../../components/ActionButtons";
import Modal from "../../components/Modal";
import SchoolYearForm from "../../components/SchoolYearForm";
import ProgramForm from "../../components/admin/ProgramForm";
import Button from "../../components/Button/Button";
import { useCreateSchoolYear } from "../../hooks/useSchoolYearMutations";

type ViewMode = "school-year-selection" | "program-list";

function AdminAcademics() {
  const [viewMode, setViewMode] = useState<ViewMode>("school-year-selection");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<SchoolYear | null>(null);
  const [userInitiatedBack, setUserInitiatedBack] = useState<boolean>(false);
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
  } = useProgramsBySchoolYear(currentSchoolYear?.id || "");

  const handleSchoolYearSelect = (schoolYear: SchoolYear) => {
    setSelectedSchoolYear(schoolYear);
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

  const handleEditProgram = (program: Program) => {
    alert(`Edit program: ${program.name}`);
  };

  const handleDeleteProgram = async (program: Program) => {
    if (confirm(`Are you sure you want to delete "${program.name}"?`)) {
      await deleteProgramMutation.mutateAsync(program.id);
    }
  };

  const handleBackToSelection = () => {
    setSelectedSchoolYear(null);
    setViewMode("school-year-selection");
    setUserInitiatedBack(true);
  };

  const isLoading = schoolYearsLoading || (programsLoading && viewMode === "program-list");

  return (
    <AdminLayout>
      <style jsx>{`
        .admin-academics ::selection {
          background-color: #3b82f6;
          color: white;
        }
        .admin-academics ::-moz-selection {
          background-color: #3b82f6;
          color: white;
        }
      `}</style>
      <div className="admin-academics">
        <div className="admin-academics-content">
          {isLoading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner"></div>
              <span className="loading-text">Loading...</span>
            </div>
          ) : (
            <>
              {/* School Year Selection */}
              {viewMode === "school-year-selection" && (
                <div className="school-year-selection">
                  <div className="dashboard-section-header">
                    <div className="header-title">
                      <h2 className="dashboard-section-title">Select School Year</h2>
                      <p className="dashboard-section-subtitle">
                        Choose a school year to manage its academic programs.
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleCreateSchoolYear}
                      className="create-school-year-btn"
                    >
                      Create School Year
                    </Button>
                  </div>

                  <div className="school-year-grid">
                    {schoolYears.map((schoolYear) => (
                      <div
                        key={schoolYear.id}
                        className="card card-clickable school-year-card"
                        onClick={() => handleSchoolYearSelect(schoolYear)}
                      >
                        <div className="card-header">
                          <div className="school-year-header">
                            <h3 className="card-title">{schoolYear.name}</h3>
                            <span
                              className={`status-badge ${schoolYear.status === "active"
                                ? "status-active"
                                : schoolYear.status === "inactive"
                                  ? "status-inactive"
                                  : "status-default"
                                }`}
                            >
                              {schoolYear.status}
                            </span>
                          </div>
                        </div>

                        <div className="card-body">
                          <div className="school-year-details">
                            {schoolYear.start_date && (
                              <div className="school-year-date">
                                <span className="date-label">Starts:</span>
                                <span className="date-value">
                                  {new Date(schoolYear.start_date).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {schoolYear.end_date && (
                              <div className="school-year-date">
                                <span className="date-label">Ends:</span>
                                <span className="date-value">
                                  {new Date(schoolYear.end_date).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="card-footer">
                          <div className="footer-text">Click to manage programs</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Program List */}
              {viewMode === "program-list" && (
                <div className="program-list">
                  <div className="program-list-header">
                    <button onClick={handleBackToSelection} className="back-button">
                      ← Back to School Years
                    </button>

                    <div className="header-title">
                      <h2 className="dashboard-section-title">Programs</h2>
                      <p className="dashboard-section-subtitle">{currentSchoolYear?.name}</p>
                    </div>

                    <button
                      onClick={handleCreateProgram}
                      className="btn btn-primary create-program-btn"
                    >
                      Create Program
                    </button>
                  </div>

                  {programs.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-content">
                        <h3 className="empty-state-title">No Programs Found</h3>
                        <p className="empty-state-text">
                          Get started by creating your first academic program.
                        </p>
                        <button onClick={handleCreateProgram} className="btn btn-primary">
                          Create Program
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="program-cards">
                      {programs.map((program) => (
                        <div key={program.id} className="card program-card">
                          <div className="card-header">
                            <h3 className="card-title">{program.name}</h3>
                          </div>
                          <div className="card-footer">
                            <div className="footer-actions">
                              <ActionButtons
                                onEdit={() => handleEditProgram(program)}
                                onDelete={() => handleDeleteProgram(program)}
                                size="sm"
                                variant="compact"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create School Year Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Create School Year"
        size="md"
      >
        <SchoolYearForm
          onSubmit={handleCreateSchoolYearSubmit}
          onCancel={handleCloseCreateModal}
          isLoading={createSchoolYearMutation.isPending}
          error={createSchoolYearMutation.error?.message || null}
        />
      </Modal>

      {/* Create Program Modal */}
      <Modal
        isOpen={isCreateProgramModalOpen}
        onClose={handleCloseCreateProgramModal}
        title="Create Program"
        size="md"
      >
        <ProgramForm
          schoolYearId={currentSchoolYear?.id || ""}
          onSubmit={handleCreateProgramSubmit}
          onCancel={handleCloseCreateProgramModal}
          isLoading={createProgramMutation.isPending}
        />
      </Modal>
    </AdminLayout>
  );
}

export default AdminAcademics;
export { AdminAcademics };