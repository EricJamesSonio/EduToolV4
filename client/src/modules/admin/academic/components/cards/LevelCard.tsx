// client/src/modules/admin/academic/components/LevelCard.tsx

import { useMemo } from "react";
import type { ProgramWithStats } from "../../types/program.types";
import type { Level } from "../../types/level.types";
import type { Section } from "../../api/section.api";
import { useSectionsByLevel } from "../../hooks/useSections";
import BaseCard from "@/components/BaseCard";
import EmptyState from "@/components/EmptyState";
import SectionRow from "../rows/SectionRow";

interface LevelCardProps {
  levelName: string;
  levelItems: Level[];
  program: ProgramWithStats;
  schoolYearId: string;
  courseId?: string;
  strandId?: string;
  onAddSection: (levelId: string) => void;
  onEditSection: (levelId: string, section: Section) => void;
  onDeleteSection: (section: Section) => void;
  onViewSectionDetails?: (args: {
    schoolYearId: string;
    section: Section;
    sectionId: string;
    levelId: string;
    context: { courseId?: string; strandId?: string };
  }) => void;
  onViewLevelSubjects?: (args: {
    schoolYearId: string;
    levelId: string;
    levelName?: string;
    programId: string;
    context: { courseId?: string; strandId?: string };
  }) => void;
}

const LevelCard: React.FC<LevelCardProps> = ({
  levelName,
  levelItems,
  program,
  schoolYearId,
  courseId,
  strandId,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onViewSectionDetails,
  onViewLevelSubjects,
}) => {
  const primaryLevelId = levelItems[0].id;

  const { data: sections = [], isLoading: sectionsLoading } =
    useSectionsByLevel(schoolYearId, primaryLevelId);

  const visibleSections = useMemo(() => {
    if (courseId) return sections.filter((s) => s.course_id === courseId);
    if (strandId) return sections.filter((s) => s.strand_id === strandId);
    return sections;
  }, [sections, courseId, strandId]);

  const subjectsContext = { courseId, strandId };

  return (
    <BaseCard className="academic-detail-card level-section-card">
      {/* ── Card Header ── */}
      <div className="card-header">
        <div className="academic-detail-card-header">
          {onViewLevelSubjects ? (
            <button
              type="button"
              className="level-title-button"
              onClick={() =>
                onViewLevelSubjects({
                  schoolYearId,
                  levelId: primaryLevelId,
                  levelName,
                  programId: program.id,
                  context: subjectsContext,
                })
              }
            >
              {levelName}
            </button>
          ) : (
            <h3 className="card-title">{levelName}</h3>
          )}
          <span className="status-badge status-default">Level</span>
        </div>
      </div>

      {/* ── Static details ── */}
      <div className="card-body">
        <div className="academic-detail-list">
          <div className="academic-detail-row">
            <span className="detail-label">Program</span>
            <span className="detail-value">{program.name}</span>
          </div>
          <div className="academic-detail-row">
            <span className="detail-label">Type</span>
            <span className="detail-value">{program.type}</span>
          </div>
          {levelItems.length > 1 && (
            <div className="academic-detail-row">
              <span className="detail-label">Records</span>
              <span className="detail-value">
                {levelItems.length} linked records
              </span>
            </div>
          )}
        </div>

        {/* ── Sections block ── */}
        <div className="level-sections-block">
          <div className="level-sections-header">
            <span className="level-sections-title">Sections</span>
            <button
              className="btn btn-primary btn-xs"
              onClick={() => onAddSection(primaryLevelId)}
              title="Add section"
            >
              +
            </button>
            {onViewLevelSubjects && (
              <button
                className="btn btn-secondary btn-xs"
                onClick={() =>
                  onViewLevelSubjects({
                    schoolYearId,
                    levelId: primaryLevelId,
                    levelName,
                    programId: program.id,
                    context: subjectsContext,
                  })
                }
                title="View subjects"
              >
                Subjects
              </button>
            )}
          </div>

          {sectionsLoading ? (
            <div className="sections-loading">
              <div className="loading-spinner loading-spinner-sm" />
              <span className="loading-text">Loading...</span>
            </div>
          ) : visibleSections.length === 0 ? (
            <EmptyState
              className="empty-state-compact"
              title="No Sections Yet"
              description="Sections added to this level will appear here."
            />
          ) : (
            <div className="sections-list">
              {visibleSections.map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  levelId={primaryLevelId}
                  schoolYearId={schoolYearId}
                  courseId={courseId}
                  strandId={strandId}
                  onEdit={onEditSection}
                  onDelete={onDeleteSection}
                  onViewDetails={onViewSectionDetails}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  );
};

export default LevelCard;
