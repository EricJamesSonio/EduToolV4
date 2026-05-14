// client/src/modules/admin/system/components/semester-template/ProgramAssignmentGrid.tsx

import React from 'react';
import type { Program } from '@/modules/admin/academic/types/program.types';
import type { SemesterTemplateAssignment } from '../../types/semester-template.types';
import { PROGRAM_TYPE_LABELS } from '../../types/semester-template.types';

interface ProgramAssignmentGridProps {
  programs: Program[];
  assignments: SemesterTemplateAssignment[];
  onAssign: (program: Program) => void;
  onManage: (program: Program, assignment: SemesterTemplateAssignment) => void;
}

const ProgramAssignmentGrid: React.FC<ProgramAssignmentGridProps> = ({
  programs,
  assignments,
  onAssign,
  onManage,
}) => {
  if (programs.length === 0) {
    return (
      <div className="empty-state">
        <p>No programs found for this school year.</p>
      </div>
    );
  }

  return (
    <div className="grading-scales-grid">
      {programs.map((program) => {
        const assignment = assignments.find((a) => a.program_id === program.id) ?? null;
        const totalTerms = assignment
          ? assignment.template.semesters.reduce((acc, s) => acc + s.terms.length, 0)
          : 0;
        const datesSet    = assignment?.termDates.length ?? 0;
        const isComplete  = assignment && totalTerms > 0 && datesSet === totalTerms;

        return (
          <div key={program.id} className="grading-scale-card card">
            <div className="scale-card-header">
              <div>
                <h4 className="scale-name">{program.name}</h4>
                <span className="scale-range-count">
                  {PROGRAM_TYPE_LABELS[program.type] ?? program.type}
                </span>
              </div>

              {/* Status badge */}
              {assignment ? (
                <span className={`assignment-status-badge ${isComplete ? 'badge-complete' : 'badge-partial'}`}>
                  {isComplete ? '✓ Complete' : '⚠ Incomplete'}
                </span>
              ) : (
                <span className="assignment-status-badge badge-unassigned">
                  Not assigned
                </span>
              )}
            </div>

            {/* Assignment details */}
            {assignment ? (
              <div className="ranges-preview">
                <div className="sem-preview-row">
                  <span className="sem-preview-name">Template:</span>
                  <span className="template-term-chip">{assignment.template.name}</span>
                </div>
                {assignment.template.semesters.map((sem) => (
                  <div key={sem.id} className="sem-preview-row">
                    <span className="sem-preview-name">{sem.name}</span>
                    <div className="template-term-chips">
                      {sem.terms.map((t) => {
                        const td = assignment.termDates.find((d) => d.term_id === t.id);
                        return (
                          <span
                            key={t.id}
                            className={`template-term-chip ${td ? 'chip-dated' : ''}`}
                            title={
                              td
                                ? `${td.start_date.slice(0, 10)} → ${td.end_date.slice(0, 10)}`
                                : 'No dates set'
                            }
                          >
                            {t.name}{td ? ' ✓' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="program-no-assignment-hint">
                <p>No semester template assigned yet.</p>
              </div>
            )}

            {/* Footer */}
            <div className="scale-card-footer">
              {assignment && (
                <span className="scale-stat passing">
                  {datesSet}/{totalTerms} dates set
                </span>
              )}
              {assignment ? (
                <button
                  type="button"
                  className="assign-template-btn"
                  onClick={() => onManage(program, assignment)}
                >
                  Manage
                </button>
              ) : (
                <button
                  type="button"
                  className="assign-template-btn assign-template-btn--primary"
                  onClick={() => onAssign(program)}
                >
                  Assign Template
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgramAssignmentGrid;