// client/src/modules/admin/system/components/semester-template/AssignmentCard.tsx

import React from 'react';
import type {
  SemesterTemplateAssignment,
} from '../../types/semester-template.types';
import { PROGRAM_TYPE_LABELS } from '../../types/semester-template.types';

interface AssignmentCardProps {
  assignment: SemesterTemplateAssignment;
  onManage: (assignment: SemesterTemplateAssignment) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onManage,
}) => {
  const totalTerms = assignment.template.semesters.reduce(
    (acc, s) => acc + s.terms.length,
    0,
  );
  const datesSet = assignment.termDates.length;

  return (
    <div className="grading-scale-card card">
      <div className="scale-card-header">
        <div>
          <h4 className="scale-name">{assignment.program.name}</h4>
          <span className="scale-range-count">
            {PROGRAM_TYPE_LABELS[assignment.program.type]}
          </span>
        </div>
        <button
          type="button"
          className="action-button action-button-edit"
          onClick={() => onManage(assignment)}
        >
          Manage
        </button>
      </div>

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
                    {t.name}
                    {td ? ' ✓' : ''}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="scale-card-footer">
        <span className="scale-stat passing">
          {datesSet}/{totalTerms} dates set
        </span>
        {datesSet === totalTerms && totalTerms > 0 && (
          <span className="locked-badge">✓ Complete</span>
        )}
      </div>
    </div>
  );
};

export default AssignmentCard;