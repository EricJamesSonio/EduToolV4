import type { ProgramWithStats } from '../../types/program.types';
import AcademicDetailCard from './AcademicDetailCard';

interface AcademicCoursePageProps {
  program: ProgramWithStats;
  onBackToPrograms: () => void;
  onCreateCourse: () => void;
}

const AcademicCoursePage: React.FC<AcademicCoursePageProps> = ({
  program,
  onBackToPrograms,
  onCreateCourse,
}) => {
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
        <button onClick={onCreateCourse} className="btn btn-primary create-program-btn">
          Create Course
        </button>
      </div>

      {program.courses.length === 0 ? (
        <div className="empty-state">
          <h3>No Courses Found</h3>
          <p>Get started by creating your first course.</p>
          <button onClick={onCreateCourse} className="btn btn-primary">
            Create Course
          </button>
        </div>
      ) : (
        <div className="academic-detail-grid">
          {program.courses.map((course) => (
            <AcademicDetailCard
              key={course.id}
              title={course.name}
              badge="Course"
              details={[
                { label: 'Code', value: course.code || 'No code' },
                { label: 'Program', value: program.name },
              ]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AcademicCoursePage;
