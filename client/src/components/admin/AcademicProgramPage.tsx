import type { SchoolYear } from '../../types/school-year.types';
import type { ProgramWithStats } from '../../types/program.types';
import ProgramCard from './ProgramCard';

interface AcademicProgramPageProps {
  schoolYear: SchoolYear | null;
  programs: ProgramWithStats[];
  onBackToSchoolYears: () => void;
  onCreateProgram: () => void;
  onEditProgram: (program: ProgramWithStats) => void;
  onDeleteProgram: (program: ProgramWithStats) => void;
  onViewProgram: (program: ProgramWithStats) => void;
}

const AcademicProgramPage: React.FC<AcademicProgramPageProps> = ({
  schoolYear,
  programs,
  onBackToSchoolYears,
  onCreateProgram,
  onEditProgram,
  onDeleteProgram,
  onViewProgram,
}) => {
  return (
    <div className="program-list">
      <div className="program-list-header">
        <button onClick={onBackToSchoolYears} className="back-button">
          Back to School Years
        </button>

        <div className="header-title">
          <h2 className="dashboard-section-title">Programs</h2>
          <p className="dashboard-section-subtitle">{schoolYear?.name}</p>
        </div>

        <button
          onClick={onCreateProgram}
          className="btn btn-primary create-program-btn"
        >
          Create Program
        </button>
      </div>

      {programs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <h3 className="empty-state-title">No Programs Found</h3>
            <p className="empty-state-text">
              Get started by creating your first academic program.
            </p>
            <button onClick={onCreateProgram} className="btn btn-primary">
              Create Program
            </button>
          </div>
        </div>
      ) : (
        <div className="program-cards">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onEdit={onEditProgram}
              onDelete={onDeleteProgram}
              onView={onViewProgram}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AcademicProgramPage;
