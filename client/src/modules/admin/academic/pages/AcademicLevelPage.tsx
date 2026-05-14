// client/src/modules/admin/academic/pages/AcademicLevelPage.tsx

import { useMemo, useState } from 'react';
import type { ProgramWithStats } from '../types/program.types';
import type { Level } from '../types/level.types';
import type { Section } from '../api/section.api';
import {
  useLevelsBySchoolYear,
  useAddNextLevel,
  useRemoveLevel,
} from '../hooks/useLevels';
import {
  useCreateSection,
  useUpdateSection,
  useRemoveSection,
} from '../hooks/useSections';
import ConfirmationModal from '@/components/ConfirmationModal';
import SectionFormModal from '../components/modals/SectionFormModal';
import EmptyState from '@/components/EmptyState';
import LevelCard from '../components/cards/LevelCard';
import { getLevelSortValue } from '../utils/getLevelSortValue';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AcademicLevelPageProps {
  program: ProgramWithStats;
  schoolYearId: string;
  courseId?: string;
  strandId?: string;
  contextLabel?: string;
  onBackToPrograms: () => void;
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

interface SectionModalState {
  levelId: string;
  editTarget?: Section;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const AcademicLevelPage: React.FC<AcademicLevelPageProps> = ({
  program,
  schoolYearId,
  courseId,
  strandId,
  contextLabel,
  onBackToPrograms,
  onViewSectionDetails,
  onViewLevelSubjects,
}) => {
  const [levelToDelete, setLevelToDelete] = useState<Level | null>(null);
  const [sectionModal, setSectionModal] = useState<SectionModalState | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);

  const { data: schoolYearLevels = [], isLoading } = useLevelsBySchoolYear(schoolYearId);
  const addNextLevelMutation = useAddNextLevel();
  const removeLevelMutation = useRemoveLevel();
  const createSectionMutation = useCreateSection();
  const updateSectionMutation = useUpdateSection();
  const removeSectionMutation = useRemoveSection();

  const levels = schoolYearLevels.filter((l) => l.program_id === program.id);

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
    const highest = visibleLevels.reduce((acc, cur) =>
      getLevelSortValue(cur.name) > getLevelSortValue(acc.name) ? cur : acc,
    );
    if (highest.primaryLevel) setLevelToDelete(highest.primaryLevel);
  };

  const confirmRemoveLevel = async () => {
    if (!levelToDelete) return;
    try {
      const targets = levels.filter((l) => l.name === levelToDelete.name);
      for (const level of targets) {
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
        await updateSectionMutation.mutateAsync({ id: sectionModal.editTarget.id, data });
      } else {
        await createSectionMutation.mutateAsync({
          levelId: sectionModal.levelId,
          schoolYearId,
          courseId,
          strandId,
          ...data,
        });
      }
      setSectionModal(null);
    } catch (error) {
      console.error('Failed to save section:', error);
    }
  };

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return;
    try {
      await removeSectionMutation.mutateAsync(sectionToDelete.id);
      setSectionToDelete(null);
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  const subtitle = contextLabel ? `${program.name} › ${contextLabel}` : program.name;
  const backLabel = courseId ? 'Back to Courses' : strandId ? 'Back to Strands' : 'Back to Programs';
  const isSectionFormLoading = createSectionMutation.isPending || updateSectionMutation.isPending;

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
        <EmptyState
          title="No Levels Found"
          description="Get started by adding your first level."
          action={
            <button
              type="button"
              onClick={handleAddLevel}
              className="btn btn-primary"
              disabled={addNextLevelMutation.isPending}
            >
              {addNextLevelMutation.isPending ? '...' : '+'}
            </button>
          }
        />
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
              onDeleteSection={setSectionToDelete}
              onViewSectionDetails={onViewSectionDetails}
              onViewLevelSubjects={onViewLevelSubjects}
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