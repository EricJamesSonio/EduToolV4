import { useMemo, useState } from 'react';
import { useErrorToast } from '@/components/ErrorDisplay/UnifiedError';
import { useSubjectsByLevel, useCreateSubject, useUpdateSubject } from '../hooks/useSubjects';
import { useLevelsBySchoolYear } from '../hooks/useLevels';
import SubjectFormModal from '../components/modals/SubjectFormModal';
import SubjectDetailsModal from '../components/modals/SubjectDetailsModal';
import SubjectDetailsSection from '../components/details/SubjectDetailsSection';
import type { Level } from '../types/level.types';
import type { Subject } from '../types/subject.types';

type Props = {
  schoolYearId: string;
  level: Level;
  context: { courseId?: string; strandId?: string };
  onBack: () => void;
};

const AcademicLevelSubjectsPage: React.FC<Props> = ({
  schoolYearId,
  level,
  context,
  onBack,
}) => {
  const { showError, showSuccess } = useErrorToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subject | null>(null);
  const [viewTarget, setViewTarget] = useState<Subject | null>(null);

  const {
    data: subjects = [],
    isLoading,
    isError,
  } = useSubjectsByLevel(level.id, schoolYearId);

  const { data: schoolYearLevels = [] } = useLevelsBySchoolYear(schoolYearId);
  const programLevels = schoolYearLevels.filter((l) => l.program_id === level.program_id);

  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();

  const isMutating = createSubject.isPending || updateSubject.isPending;

  const hierarchyTitle = useMemo(() => level.name, [level.name]);

  const handleOpenCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditTarget(subject);
    setModalOpen(true);
  };

  const handleOpenView = (subject: Subject) => {
    setViewTarget(subject);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleSubmit = async (data: {
    name: string;
    subjectType?: 'major' | 'minor';
    levelId?: string;
  }) => {
    try {
      if (editTarget) {
        await updateSubject.mutateAsync({
          id: editTarget.id,
          dto: {
            name: data.name,
            levelId: data.levelId,
          },
        });
        showSuccess('Subject updated successfully.');
      } else {
        await createSubject.mutateAsync({
          name: data.name,
          subjectType: data.subjectType,
          programId: level.program_id,
          levelId: level.id,
          yearLevel: level.name,
          ...(context.courseId ? { courseId: context.courseId } : {}),
          ...(context.strandId ? { strandId: context.strandId } : {}),
        });
        showSuccess('Subject created successfully.');
      }
      handleCloseModal();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      showError(message);
    }
  };

  return (
    <>
      <div className="view-container">
        <div className="view-header">
          <button type="button" onClick={onBack} className="back-button">
            Back
          </button>
          <div className="header-title">
            <h2 className="dashboard-section-title">Subjects</h2>
            <p className="dashboard-section-subtitle">{hierarchyTitle}</p>
          </div>
        </div>

        <SubjectDetailsSection
          subjects={subjects}
          isLoading={isLoading}
          isError={isError}
          isMutating={isMutating}
          onCreateClick={handleOpenCreate}
          onView={handleOpenView}
          onEdit={handleOpenEdit}
        />
      </div>

      <SubjectFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isLoading={createSubject.isPending || updateSubject.isPending}
        subject={editTarget}
        availableLevels={programLevels}
        currentLevelId={level.id}
      />

      <SubjectDetailsModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        subject={viewTarget}
      />
    </>
  );
};

export default AcademicLevelSubjectsPage;