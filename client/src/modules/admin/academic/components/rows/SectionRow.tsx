// client/src/modules/admin/academic/components/SectionRow.tsx

import type { Section } from '../../api/section.api';

interface SectionRowProps {
  section: Section;
  levelId: string;
  schoolYearId: string;
  courseId?: string;
  strandId?: string;
  onEdit: (levelId: string, section: Section) => void;
  onDelete: (section: Section) => void;
  programId: string;
  onViewDetails?: (args: {
    schoolYearId: string;
    section: Section;
    sectionId: string;
    levelId: string;
    programId: string;
    context: { courseId?: string; strandId?: string };
  }) => void;
}

const SectionRow: React.FC<SectionRowProps> = ({
  section, levelId, schoolYearId, courseId, strandId, programId, onEdit, onDelete, onViewDetails,
}) => (
  <div className="section-row">
    <button
      type="button"
      className="section-main-button"
      onClick={() =>
onViewDetails?.({
  schoolYearId,
  section,
  sectionId: section.id,
  levelId,
  programId,
  context: { courseId, strandId },
})
      }
    >
      <span className="section-info">
        <span className="section-name">{section.name}</span>
        <span className="section-meta">
          {section.studentCount}/{section.capacity} students
        </span>
      </span>
      <span className="section-open-indicator">Open</span>
    </button>
    <div className="section-actions">
      <button
        type="button"
        className="icon-btn"
        title="Edit section"
        onClick={() => onEdit(levelId, section)}
      >
        ✎
      </button>
      <button
        type="button"
        className="icon-btn icon-btn-danger"
        title="Delete section"
        onClick={() => onDelete(section)}
      >
        ✕
      </button>
    </div>
  </div>
);

export default SectionRow;