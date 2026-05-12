import type { ProgramWithStats } from '../../types/program.types';
import { useCreateCourse, useCoursesByProgram, useDeleteCourse } from '../../hooks/useCourses';
import { useAddNextLevel, useLevelsBySchoolYear, useRemoveLevel } from '../../hooks/useLevels';
import BaseCard from '../BaseCard';

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
  const { data: courses = [], isLoading: isCoursesLoading } = useCoursesByProgram(schoolYearId, program.id);
  const { data: schoolYearLevels = [], isLoading: isLevelsLoading } = useLevelsBySchoolYear(schoolYearId);
  const createCourseMutation = useCreateCourse();
  const deleteCourseMutation = useDeleteCourse();
  const addNextLevelMutation = useAddNextLevel();
  const removeLevelMutation = useRemoveLevel();

  const levels = schoolYearLevels.filter((level) => level.program_id === program.id);
  const isLoading = isCoursesLoading || isLevelsLoading;

  const handleAddCourse = async () => {
    const nextNumber = courses.length + 1;
    await createCourseMutation.mutateAsync({
      schoolYearId,
      programId: program.id,
      name: `${program.name} Course ${nextNumber}`,
      code: `C${nextNumber}`,
    });
  };

  const handleRemoveCourse = async () => {
    const course = courses[courses.length - 1];
    if (!course) return;
    if (confirm(`This will remove "${course.name}". Are you sure?`)) {
      await deleteCourseMutation.mutateAsync(course.id);
    }
  };

  const handleAddLevel = async () => {
    await addNextLevelMutation.mutateAsync({ programId: program.id, schoolYearId });
  };

  const handleRemoveLevel = async () => {
    const level = levels[levels.length - 1];
    if (!level) return;
    if (confirm(`This will remove "${level.name}". Are you sure?`)) {
      await removeLevelMutation.mutateAsync(level.id);
    }
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
            onClick={handleAddCourse}
            className="btn btn-primary"
            disabled={createCourseMutation.isPending}
            title="Add course"
          >
            {createCourseMutation.isPending ? '...' : '+ Course'}
          </button>
          {courses.length > 0 && (
            <button
              onClick={handleRemoveCourse}
              className="btn btn-secondary"
              disabled={deleteCourseMutation.isPending}
              title="Remove last course"
            >
              {deleteCourseMutation.isPending ? '...' : '- Course'}
            </button>
          )}
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
          <button onClick={handleAddCourse} className="btn btn-primary" disabled={createCourseMutation.isPending}>
            {createCourseMutation.isPending ? '...' : '+ Course'}
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
            </BaseCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcademicCoursePage;
