// client/src/modules/admin/system/components/semester-template/sections/TemplatesSection.tsx

import React from 'react';
import type { SemesterTemplate } from '../../../types/semester-template.types';
import SemesterTemplateCard from '../SemesterTemplateCard';

interface TemplatesSectionProps {
  templates: SemesterTemplate[];
  isLoading: boolean;
  onEdit: (template: SemesterTemplate) => void;
  onDelete: (template: SemesterTemplate) => void;
  onAssign: (template: SemesterTemplate) => void;
  onCreateFirst: () => void;
}

const TemplatesSection: React.FC<TemplatesSectionProps> = ({
  templates,
  isLoading,
  onEdit,
  onDelete,
  onAssign,
  onCreateFirst,
}) => {
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <span className="loading-text">Loading templates…</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="empty-state">
        <p>No semester templates yet.</p>
        <button type="button" className="btn-primary" onClick={onCreateFirst}>
          Create First Template
        </button>
      </div>
    );
  }

  return (
    <div className="grading-scales-grid">
      {templates.map((t) => (
        <SemesterTemplateCard
          key={t.id}
          template={t}
          onEdit={onEdit}
          onDelete={onDelete}
          onAssign={onAssign}
        />
      ))}
    </div>
  );
};

export default TemplatesSection;