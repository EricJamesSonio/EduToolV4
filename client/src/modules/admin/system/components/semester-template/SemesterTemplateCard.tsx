// client/src/modules/admin/system/components/semester-template/SemesterTemplateCard.tsx

import React from 'react';
import ActionButtons from '@/components/ActionButtons/ActionButtons';
import type {
  SemesterTemplate,
  SemesterTemplateAssignment,
} from '../../types/semester-template.types';
import { PROGRAM_TYPE_LABELS } from '../../types/semester-template.types';

interface SemesterTemplateCardProps {
  template: SemesterTemplate;
  assignment?: SemesterTemplateAssignment;
  onEdit: (t: SemesterTemplate) => void;
  onDelete: (t: SemesterTemplate) => void;
  onAssign: (t: SemesterTemplate) => void;
}

const SemesterTemplateCard: React.FC<SemesterTemplateCardProps> = ({
  template,
  assignment,
  onEdit,
  onDelete,
  onAssign,
}) => {
  const totalTerms = template.semesters.reduce(
    (acc, sem) => acc + sem.terms.length,
    0,
  );
  const hasTermDates = assignment && assignment.termDates.length > 0;

  return (
    <div className="grading-scale-card card">
      <div className="scale-card-header">
        <div>
          <h4 className="scale-name">{template.name}</h4>
          <span className="scale-range-count">
            {PROGRAM_TYPE_LABELS[template.program_type]}
          </span>
        </div>
        <ActionButtons
          size="sm"
          variant="compact"
          onEdit={() => onEdit(template)}
          onDelete={() => onDelete(template)}
        />
      </div>

      {/* Semester + term structure */}
      <div className="ranges-preview">
        {template.semesters.map((sem) => (
          <div key={sem.id} className="sem-preview-row">
            <span className="sem-preview-name">{sem.name}</span>
            <div className="template-term-chips">
              {sem.terms.map((t) => (
                <span key={t.id} className="template-term-chip">
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="scale-card-footer">
        <span className="scale-stat passing">
          {template.semesters.length} semester{template.semesters.length !== 1 ? 's' : ''}
        </span>
        <span className="scale-stat">
          {totalTerms} term{totalTerms !== 1 ? 's' : ''}
        </span>
        {hasTermDates && (
          <span className="scale-stat passing">✓ Dates set</span>
        )}
        <button
          type="button"
          className="assign-template-btn"
          onClick={() => onAssign(template)}
        >
          {assignment ? 'Manage Assignment' : 'Assign to Program'}
        </button>
      </div>
    </div>
  );
};

export default SemesterTemplateCard;