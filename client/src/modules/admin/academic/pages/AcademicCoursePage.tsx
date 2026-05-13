import { useState } from 'react';
import type { ProgramWithStats } from '../types/program.types';
import { useCreateCourse, useCoursesByProgram, useDeleteCourse, useUpdateCourse } from '../hooks/useCourses';
import { useAddNextLevel, useLevelsBySchoolYear, useRemoveLevel } from '../hooks/useLevels';
import BaseCard from '@/components/BaseCard';
import CreateCourseModal from '../components/modals/CreateCourseModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import type { Course, CreateCourseDto } from '../types/course.types';
import type { Level } from '../types/level.types';

interface AcademicCoursePageProps {
  program: ProgramWithStats;
  schoolYearId: string;
  onBackToPrograms: () => void;
}

const AcademicCoursePage: React.FC<AcademicCoursePageProps> = ({
  program,
  schoolYearId,
  onBackToPrograms,
}) => {
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [levelToDelete, setLevelToDelete] = useState<Level | null>(null);
  const { data: courses = [], isLoading: isCoursesLoading } = useCoursesByProgram(schoolYearId, program.id);
  const { data: schoolYearLevels = [], isLoading: isLevelsLoading } = useLevelsBySchoolYear(schoolYearId);
  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();
  const addNextLevelMutation = useAddNextLevel();
  const removeLevelMutation = useRemoveLevel();

  const levels = schoolYearLevels.filter((level) => level.program_id === program.id);
  const isLoading = isCoursesLoading || isLevelsLoading;

  const handleCreateCourse = async (data: CreateCourseDto) => {
    if (editingCourse) {
      await updateCourseMutation.mutateAsync({
        id: editingCourse.id,
        data: {
          name: data.name,
          code: data.code,
        },
      });
      setEditingCourse(null);
      setIsCreateCourseModalOpen(false);
      return;
    }

    await createCourseMutation.mutateAsync(data);
    setIsCreateCourseModalOpen(false);
  };

  const handleDeleteCourse = async (course: Course) => {
    setCourseToDelete(course);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsCreateCourseModalOpen(true);
  };

  const handleCloseCourseModal = () => {
    setEditingCourse(null);
    setIsCreateCourseModalOpen(false);
  };

  const handleAddLevel = async () => {
    await addNextLevelMutation.mutateAsync({ programId: program.id, schoolYearId });
  };

  const handleRemoveLevel = async () => {
    const level = levels[levels.length - 1];
    if (!level) return;
    setLevelToDelete(level);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    await deleteCourseMutation.mutateAsync(courseToDelete.id);
    setCourseToDelete(null);
  };

  const confirmDeleteLevel = async () => {
    if (!levelToDelete) return;
    await removeLevelMutation.mutateAsync(levelToDelete.id);
    setLevelToDelete(null);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <button onClick={onBackToPrograms} className="back-button">
          Back to Programs
        </button>
        <div className="header-title">
          <h2 className="dashboard-section-title">Courses</h2>
          <p className="dashboard-section-subtitle">{program.name}</p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setIsCreateCourseModalOpen(true)}
            className="btn btn-primary"
            disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
            title="Add course"
          >
            Create Course
          </button>
          <button
            onClick={handleAddLevel}
            className="btn btn-primary"
            disabled={addNextLevelMutation.isPending}
            title="Add level"
          >
            {addNextLevelMutation.isPending ? '...' : '+ Level'}
          </button>
          {levels.length > 0 && (
            <button
              onClick={handleRemoveLevel}
              className="btn btn-secondary"
              disabled={removeLevelMutation.isPending}
              title="Remove last level"
            >
              {removeLevelMutation.isPending ? '...' : '- Level'}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <span className="loading-text">Loading courses...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <h3>No Courses Found</h3>
          <p>Get started by creating your first course.</p>
          <button onClick={() => setIsCreateCourseModalOpen(true)} className="btn btn-primary">
            Create Course
          </button>
        </div>
      ) : (
        <div className="academic-detail-grid">
          {courses.map((course) => (
            <BaseCard key={course.id} className="academic-detail-card">
              <div className="card-header">
                <div className="academic-detail-card-header">
                  <h3 className="card-title">{course.name}</h3>
                  <span className="status-badge status-default">Course</span>
                </div>
              </div>
              <div className="card-body">
                <div className="academic-detail-list">
                  <div className="academic-detail-row">
                    <span className="detail-label">Code</span>
                    <span className="detail-value">{course.code || 'No code'}</span>
                  </div>
                  <div className="academic-detail-row">
                    <span className="detail-label">Program</span>
                    <span className="detail-value">{program.name}</span>
                  </div>
                </div>

                <div className="nested-levels">
                  <div className="nested-levels-title">Levels</div>
                  {levels.length === 0 ? (
                    <p className="nested-empty">No levels added yet.</p>
                  ) : (
                    <div className="nested-level-list">
                      {levels.map((level) => (
                        <span key={level.id} className="nested-level-chip">
                          {level.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="card-footer">
                <div className="footer-actions">
                  <button
                    type="button"
                    onClick={() => handleEditCourse(course)}
                    className="btn btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(course)}
                    className="btn btn-danger btn-sm"
                    disabled={deleteCourseMutation.isPending}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </BaseCard>
          ))}
        </div>
      )}

      <CreateCourseModal
        isOpen={isCreateCourseModalOpen}
        onClose={handleCloseCourseModal}
        onSubmit={handleCreateCourse}
        isLoading={createCourseMutation.isPending || updateCourseMutation.isPending}
        programId={program.id}
        schoolYearId={schoolYearId}
        course={editingCourse}
      />

      <ConfirmationModal
        isOpen={!!courseToDelete}
        title="Delete Course"
        message={`This will remove "${courseToDelete?.name ?? 'this course'}".`}
        confirmLabel="Delete Course"
        isLoading={deleteCourseMutation.isPending}
        onConfirm={confirmDeleteCourse}
        onClose={() => setCourseToDelete(null)}
      />

      <ConfirmationModal
        isOpen={!!levelToDelete}
        title="Remove Level"
        message={`This will remove "${levelToDelete?.name ?? 'this level'}".`}
        confirmLabel="Remove Level"
        isLoading={removeLevelMutation.isPending}
        onConfirm={confirmDeleteLevel}
        onClose={() => setLevelToDelete(null)}
      />
    </div>
  );
};

export default AcademicCoursePage;
