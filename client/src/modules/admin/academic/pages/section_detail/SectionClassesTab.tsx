import { useState } from 'react';
import BaseCard from '@/components/BaseCard';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button/Button';
import ActionButtons from '@/components/ActionButtons/ActionButtons';
import { useErrorToast } from '@/components/ErrorDisplay/UnifiedError';
import { useCreateClass, useUpdateClass, useDeleteClass } from '../../hooks/useClasses';
import { useSemesterTemplateAssignments } from '../../../system/hooks/useSemesterTemplates';
import ClassFormModal from '../../components/modals/ClassFormModal';
import { getClassTitle } from '../../utils/section-details.utils';
import type { AcademicClass, CreateClassDto, UpdateClassDto } from '../../api/class.api';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date);
};

type Props = {
  classes: AcademicClass[];
  isLoading: boolean;
  isError: boolean;
  schoolYearId: string;
  sectionId: string;
  levelId: string;
  programId: string;
  onView?: (academicClass: AcademicClass) => void;
};

const SectionClassesTab: React.FC<Props> = ({
  classes,
  isLoading,
  isError,
  schoolYearId,
  sectionId,
  levelId,
  programId,
  onView,
}) => {
  const { showError, showSuccess } = useErrorToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AcademicClass | null>(null);

  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const { data: assignments = [], isLoading: assignmentsLoading } =
    useSemesterTemplateAssignments(schoolYearId);

  const hasSemesterTemplate = assignments.some((a) => a.program_id === programId);

  const isMutating =
    createClass.isPending || updateClass.isPending || deleteClass.isPending;

  const handleOpenCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (academicClass: AcademicClass) => {
    setEditTarget(academicClass);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleSubmit = async (dto: CreateClassDto | UpdateClassDto) => {
    try {
      if (editTarget) {
        await updateClass.mutateAsync({ id: editTarget.id, dto: dto as UpdateClassDto });
        showSuccess('Class updated successfully.');
      } else {
        await createClass.mutateAsync(dto as CreateClassDto);
        showSuccess('Class created successfully.');
      }
      handleCloseModal();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      showError(message);
    }
  };

  const handleDelete = async (academicClass: AcademicClass) => {
    const confirmed = window.confirm(
      `Delete class "${getClassTitle(academicClass)}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteClass.mutateAsync(academicClass.id);
      showSuccess('Class deleted.');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete class.';
      showError(message);
    }
  };

  return (
    <>
      <BaseCard className="section-details-card" hover={false}>
        <div className="card-header">
          <div className="card-header-left">
            <h3 className="card-title">Class List</h3>
            <span className="status-badge status-default">{classes.length} found</span>
          </div>
          <div className="card-header-right">
            {!assignmentsLoading && !hasSemesterTemplate && (
              <span className="status-badge status-inactive">
                No semester template assigned
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              disabled={isMutating || !hasSemesterTemplate || assignmentsLoading}
              title={
                !hasSemesterTemplate
                  ? 'Assign a semester template to this program before creating classes.'
                  : undefined
              }
            >
              + Create Class
            </Button>
          </div>
        </div>

        <div className="card-body">
          {isLoading ? (
            <div className="sections-loading">
              <div className="loading-spinner loading-spinner-sm" />
              <span className="loading-text">Loading classes...</span>
            </div>
          ) : isError ? (
            <EmptyState
              title="Unable to Load Classes"
              description="The classes for this section could not be loaded right now."
            />
          ) : classes.length === 0 ? (
            <EmptyState
              title="No Classes Found"
              description={
                hasSemesterTemplate
                  ? 'Classes assigned to this section will appear here.'
                  : 'Assign a semester template to this program first, then create classes here.'
              }
            />
          ) : (
            <div className="section-class-list">
              {classes.map((academicClass) => (
                <div key={academicClass.id} className="section-class-item">
                  <div className="section-class-info">
                    <h4 className="section-class-title">{getClassTitle(academicClass)}</h4>
                    <p className="section-class-meta">
                      Capacity: {academicClass.capacity}
                    </p>
                    {academicClass.schedules.length > 0 && (
                      <div className="section-class-schedules">
                        {academicClass.schedules.map((s) => (
                          <span
                            key={`${s.weekday}-${s.start_time}`}
                            className="section-class-schedule-badge"
                          >
                            {WEEKDAY_SHORT[s.weekday]}{' '}
                            {formatTime(s.start_time)}–{formatTime(s.end_time)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="section-class-actions">
                    {onView && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onView(academicClass)}
                        disabled={isMutating}
                      >
                        View
                      </button>
                    )}
                    <ActionButtons
                      variant="compact"
                      size="sm"
                      onEdit={() => handleOpenEdit(academicClass)}
                      onDelete={() => handleDelete(academicClass)}
                      disabled={isMutating}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </BaseCard>

      <ClassFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isLoading={createClass.isPending || updateClass.isPending}
        schoolYearId={schoolYearId}
        sectionId={sectionId}
        levelId={levelId}
        academicClass={editTarget}
      />
    </>
  );
};

export default SectionClassesTab;