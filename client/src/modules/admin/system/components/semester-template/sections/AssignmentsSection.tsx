// client/src/modules/admin/system/components/semester-template/sections/AssignmentsSection.tsx

import React from 'react';
import SchoolYearSelector from '@/components/shared/SchoolYearSelector';
import ProgramAssignmentGrid from '../ProgramAssignmentGrid';
import type { SemesterTemplateAssignment } from '../../../types/semester-template.types';
import type { Program } from '@/modules/admin/academic/types/program.types';

interface SchoolYear {
  id: string;
  name: string;
}

interface AssignmentsSectionProps {
  schoolYears: SchoolYear[];
  schoolYearsLoading: boolean;
  selectedSchoolYearId: string | null;
  onSelectSchoolYear: (id: string | null) => void;
  programs: Program[];
  assignments: SemesterTemplateAssignment[];
  assignmentsLoading: boolean;
  programsLoading: boolean;
  onAssign: (program: Program) => void;
  onManage: (program: Program, assignment: SemesterTemplateAssignment) => void;
}

const AssignmentsSection: React.FC<AssignmentsSectionProps> = ({
  schoolYears,
  schoolYearsLoading,
  selectedSchoolYearId,
  onSelectSchoolYear,
  programs,
  assignments,
  assignmentsLoading,
  programsLoading,
  onAssign,
  onManage,
}) => {
  return (
    <>
      <div className="card grading-scale-filters">
        <div className="filter-row">
          <div className="form-group filter-group">
            <label className="form-label">School Year</label>
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={schoolYearsLoading}
              selectedId={selectedSchoolYearId}
              onSelect={onSelectSchoolYear}
            />
          </div>
        </div>
      </div>

      {!selectedSchoolYearId ? (
        <div className="empty-state">
          <p>Select a school year above to view and manage program assignments.</p>
        </div>
      ) : assignmentsLoading || programsLoading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <span className="loading-text">Loading programs…</span>
        </div>
      ) : (
        <ProgramAssignmentGrid
          programs={programs}
          assignments={assignments}
          onAssign={onAssign}
          onManage={onManage}
        />
      )}
    </>
  );
};

export default AssignmentsSection;