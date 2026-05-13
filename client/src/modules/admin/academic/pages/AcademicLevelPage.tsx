// client/src/modules/admin/academic/pages/AcademicLevelPage.tsx

import { useMemo, useState } from 'react';
import type { ProgramWithStats } from '../types/program.types';
import {
  useLevelsBySchoolYear,
  useAddNextLevel,
  useRemoveLevel,
} from '../hooks/useLevels';
import {
  useSectionsByLevel,
  useCreateSection,
  useUpdateSection,
  useRemoveSection,
} from '../hooks/useSections';
import ConfirmationModal from '@/components/ConfirmationModal';
import SectionFormModal from '../components/modals/SectionFormModal';
import BaseCard from '@/components/BaseCard';
import type { Level } from '../types/level.types';
import type { Section } from '../api/section.api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AcademicLevelPageProps {
  program: ProgramWithStats;
  schoolYearId: string;
  /** Present when drilling in from a College course */
  courseId?: string;
  /** Present when drilling in from a SHS strand */
  strandId?: string;
  /** Display name of the course or strand for the subtitle */
  contextLabel?: string;
  onBackToPrograms: () => void;
}

interface SectionModalState {
  levelId: string;
  editTarget?: Section;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getLevelSortValue = (name: string): number => {
  const gradeMatch = name.match(/Grade\s+(\d+)/i);
  if (gradeMatch) return Number(gradeMatch[1]);

  const yearMatch = name.match(/(\d+)(?:st|nd|rd|th)\s+Year/i);
  if (yearMatch) return Number(yearMatch[1]);

  const trailingNumberMatch = name.match(/(\d+)$/);
  return trailingNumberMatch ? Number(trailingNumberMatch[1]) : 0;
};

// ---------------------------------------------------------------------------
// Sub-component: level card with embedded section list
// ---------------------------------------------------------------------------

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
}) => {
  const primaryLevelId = levelItems[0].id;

  const { data: sections = [], isLoading: sectionsLoading } =
    useSectionsByLevel(schoolYearId, primaryLevelId);

  // When scoped to a course or strand, only show sections that belong to it
  const visibleSections = useMemo(() => {
    if (courseId) return sections.filter((s) => s.course_id === courseId);
    if (strandId) return sections.filter((s) => s.strand_id === strandId);
    return sections;
  }, [sections, courseId, strandId]);

  return (
    <BaseCard className="academic-detail-card level-section-card">
      {/* ── Card Header ── */}
      <div className="card-header">
        <div className="academic-detail-card-header">
          <h3 className="card-title">{levelName}</h3>
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
          </div>

          {sectionsLoading ? (
            <div className="sections-loading">
              <div className="loading-spinner loading-spinner-sm" />
              <span className="loading-text">Loading...</span>
            </div>
          ) : visibleSections.length === 0 ? (
            <p className="sections-empty">No sections yet.</p>
          ) : (
            <div className="sections-list">
              {visibleSections.map((section) => (
                <div key={section.id} className="section-row">
                  <div className="section-info">
                    <span className="section-name">{section.name}</span>
                    <span className="section-meta">
                      {section.studentCount}/{section.capacity} students
                    </span>
                  </div>
                  <div className="section-actions">
                    <button
                      className="icon-btn"
                      title="Edit section"
                      onClick={() => onEditSection(primaryLevelId, section)}
                    >
                      ✎
                    </button>
                    <button
                      className="icon-btn icon-btn-danger"
                      title="Delete section"
                      onClick={() => onDeleteSection(section)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const AcademicLevelPage: React.FC<AcademicLevelPageProps> = ({
  program,
  schoolYearId,
  courseId,
  strandId,
  contextLabel,
  onBackToPrograms,
}) => {
  const [levelToDelete, setLevelToDelete] = useState<Level | null>(null);
  const [sectionModal, setSectionModal] = useState<SectionModalState | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);

  const { data: schoolYearLevels = [], isLoading } =
    useLevelsBySchoolYear(schoolYearId);

  const addNextLevelMutation = useAddNextLevel();
  const removeLevelMutation = useRemoveLevel();
  const createSectionMutation = useCreateSection();
  const updateSectionMutation = useUpdateSection();
  const removeSectionMutation = useRemoveSection();

  const levels = schoolYearLevels.filter(
    (level) => level.program_id === program.id,
  );

  const visibleLevels = useMemo(() => {
    const grouped = new Map<string, Level[]>();
    levels.forEach((level) => {
      grouped.set(level.name, [...(grouped.get(level.name) ?? []), level]);
    });
    return Array.from(grouped.entries())
      .map(([name, items]) => ({ name, items, primaryLevel: items[0] }))
      .sort((a, b) => getLevelSortValue(a.name) - getLevelSortValue(b.name));
  }, [levels]);

  // ── Level handlers ──
  const handleAddLevel = async () => {
    try {
      await addNextLevelMutation.mutateAsync({ programId: program.id, schoolYearId });
    } catch (error) {
      console.error('Failed to add level:', error);
    }
  };

  const handleRemoveLevel = () => {
    if (visibleLevels.length === 0) return;
    const highestLevel = visibleLevels.reduce((highest, current) =>
      getLevelSortValue(current.name) > getLevelSortValue(highest.name)
        ? current
        : highest,
    );
    if (highestLevel.primaryLevel) setLevelToDelete(highestLevel.primaryLevel);
  };

  const confirmRemoveLevel = async () => {
    if (!levelToDelete) return;
    try {
      const matchingLevels = levels.filter((l) => l.name === levelToDelete.name);
      for (const level of matchingLevels) {
        await removeLevelMutation.mutateAsync(level.id);
      }
      setLevelToDelete(null);
    } catch (error) {
      console.error('Failed to remove level:', error);
    }
  };

  // ── Section handlers ──
  const handleAddSection = (levelId: string) => setSectionModal({ levelId });

  const handleEditSection = (levelId: string, section: Section) =>
    setSectionModal({ levelId, editTarget: section });

  const handleSectionFormSubmit = async (data: { name: string; capacity: number }) => {
    if (!sectionModal) return;
    try {
      if (sectionModal.editTarget) {
        await updateSectionMutation.mutateAsync({
          id: sectionModal.editTarget.id,
          data,
        });
      } else {
        await createSectionMutation.mutateAsync({
          levelId: sectionModal.levelId,
          schoolYearId,
          courseId,   // undefined for non-college programs
          strandId,   // undefined for non-shs programs
          ...data,
        });
      }
      setSectionModal(null);
    } catch (error) {
      console.error('Failed to save section:', error);
    }
  };

  const handleDeleteSection = (section: Section) => setSectionToDelete(section);

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return;
    try {
      await removeSectionMutation.mutateAsync(sectionToDelete.id);
      setSectionToDelete(null);
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  const isSectionFormLoading =
    createSectionMutation.isPending || updateSectionMutation.isPending;

  // Build the subtitle: "Program Name > Course/Strand Name" or just "Program Name"
  const subtitle = contextLabel
    ? `${program.name} › ${contextLabel}`
    : program.name;

  // Back button label changes based on context
  const backLabel = courseId
    ? 'Back to Courses'
    : strandId
      ? 'Back to Strands'
      : 'Back to Programs';

  return (
    <div className="view-container">
      <div className="view-header">
        <button onClick={onBackToPrograms} className="back-button">
          {backLabel}
        </button>
        <div className="header-title">
          <h2 className="dashboard-section-title">Levels</h2>
          <p className="dashboard-section-subtitle">{subtitle}</p>
        </div>
        <div className="header-actions">
          <button
            onClick={handleAddLevel}
            className="btn btn-primary create-program-btn"
            disabled={addNextLevelMutation.isPending}
            title="Add next level"
          >
            {addNextLevelMutation.isPending ? '...' : '+'}
          </button>
          {levels.length > 0 && (
            <button
              onClick={handleRemoveLevel}
              className="btn btn-secondary create-program-btn"
              disabled={removeLevelMutation.isPending}
              title="Remove highest level"
            >
              {removeLevelMutation.isPending ? '...' : '-'}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <span className="loading-text">Loading levels...</span>
        </div>
      ) : levels.length === 0 ? (
        <div className="empty-state">
          <h3>No Levels Found</h3>
          <p>Get started by adding your first level.</p>
          <button
            onClick={handleAddLevel}
            className="btn btn-primary"
            disabled={addNextLevelMutation.isPending}
          >
            {addNextLevelMutation.isPending ? '...' : '+'}
          </button>
        </div>
      ) : (
        <div className="academic-detail-grid">
          {visibleLevels.map(({ name, items }) => (
            <LevelCard
              key={name}
              levelName={name}
              levelItems={items}
              program={program}
              schoolYearId={schoolYearId}
              courseId={courseId}
              strandId={strandId}
              onAddSection={handleAddSection}
              onEditSection={handleEditSection}
              onDeleteSection={handleDeleteSection}
            />
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={!!levelToDelete}
        title="Remove Level"
        message={`This will remove "${levelToDelete?.name ?? 'this level'}" and its empty seeded sections/subjects. Levels already used by classes or enrollments cannot be removed.`}
        confirmLabel="Remove Level"
        isLoading={removeLevelMutation.isPending}
        onConfirm={confirmRemoveLevel}
        onClose={() => setLevelToDelete(null)}
      />

      <SectionFormModal
        isOpen={!!sectionModal}
        levelId={sectionModal?.levelId ?? ''}
        schoolYearId={schoolYearId}
        editTarget={sectionModal?.editTarget}
        isLoading={isSectionFormLoading}
        onSubmit={handleSectionFormSubmit}
        onClose={() => setSectionModal(null)}
      />

      <ConfirmationModal
        isOpen={!!sectionToDelete}
        title="Delete Section"
        message={`Delete "${sectionToDelete?.name ?? 'this section'}"? This cannot be undone if the section has no enrolled students.`}
        confirmLabel="Delete Section"
        isLoading={removeSectionMutation.isPending}
        onConfirm={confirmDeleteSection}
        onClose={() => setSectionToDelete(null)}
      />
    </div>
  );
};

export default AcademicLevelPage;