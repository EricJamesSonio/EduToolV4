import { useMemo, useState } from 'react';
import BaseCard from '@/components/BaseCard';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button/Button';
import ActionButtons from '@/components/ActionButtons/ActionButtons';
import { useErrorToast } from '@/components/ErrorDisplay/UnifiedError';
import { useSubjectsByLevel, useCreateSubject, useUpdateSubject } from '../hooks/useSubjects';
import { useSemesterTemplateAssignments } from '@/modules/admin/system/hooks/useSemesterTemplates';
import SubjectFormModal from '../components/modals/SubjectFormModal';
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

  const {
    data: subjects = [],
    isLoading,
    isError,
  } = useSubjectsByLevel(level.id, schoolYearId);

  const { data: assignments = [] } = useSemesterTemplateAssignments(schoolYearId);

  // Derive termLabel from the program's assigned semester template
  const termLabel = useMemo(() => {
    const assignment = assignments.find((a) => a.program_id === level.program_id);
    return assignment?.template.semesters[0]?.name ?? null;
  }, [assignments, level.program_id]);

  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();

  const isMutating = createSubject.isPending || updateSubject.isPending;

  const handleOpenCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditTarget(subject);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleSubmit = async (data: { name: string; subjectType?: 'major' | 'minor' }) => {
    try {
      if (editTarget) {
        await updateSubject.mutateAsync({
          id: editTarget.id,
          dto: { name: data.name },
        });
        showSuccess('Subject updated successfully.');
      } else {
        await createSubject.mutateAsync({
          name: data.name,
          subjectType: data.subjectType,
          programId: level.program_id,
          levelId: level.id,
          yearLevel: level.name,
          ...(termLabel ? { termLabel } : {}),
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
            <p className="dashboard-section-subtitle">{level.name}</p>
          </div>
        </div>

        <BaseCard className="section-details-card" hover={false}>
          <div className="card-header">
            <div className="card-header-left">
              <h3 className="card-title">Subject List</h3>
              <span className="status-badge status-default">{subjects.length} found</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              disabled={isMutating}
            >
              + Create Subject
            </Button>
          </div>

          <div className="card-body">
            {isLoading ? (
              <div className="sections-loading">
                <div className="loading-spinner loading-spinner-sm" />
                <span className="loading-text">Loading subjects...</span>
              </div>
            ) : isError ? (
              <EmptyState
                title="Unable to Load Subjects"
                description="Subjects for this level could not be loaded right now."
              />
            ) : subjects.length === 0 ? (
              <EmptyState
                title="No Subjects Found"
                description="Subjects added to this level will appear here."
              />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Year Level</th>
                      <th>Term</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => (
                      <tr key={subject.id}>
                        <td>{subject.title}</td>
                        <td>
                          <span className={`status-badge status-${subject.subjectType}`}>
                            {subject.subjectType}
                          </span>
                        </td>
                        <td>{subject.yearLevel ?? '—'}</td>
                        <td>{subject.termLabel ?? '—'}</td>
                        <td>
                          <span
                            className={`status-badge status-${subject.lockStatus === 'locked' ? 'warning' : 'default'}`}
                          >
                            {subject.lockStatus}
                          </span>
                        </td>
                        <td>
                          <ActionButtons
                            variant="compact"
                            size="sm"
                            onEdit={
                              subject.lockStatus === 'locked'
                                ? undefined
                                : () => handleOpenEdit(subject)
                            }
                            editLabel="Edit"
                            disabled={isMutating}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </BaseCard>
      </div>

      <SubjectFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isLoading={createSubject.isPending || updateSubject.isPending}
        subject={editTarget}
      />
    </>
  );
};

export default AcademicLevelSubjectsPage;