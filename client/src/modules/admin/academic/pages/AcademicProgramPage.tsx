import type { SchoolYear } from '../../modules/admin/academic/types/school-year.types';
import type { ProgramWithStats } from '../../modules/admin/academic/types/program.types';
import ProgramCard from './ProgramCard';
import Button from '../../components/Button/Button';

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

        {/* Back Button (reusable component) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToSchoolYears}
          icon="←"
          iconPosition="left"
        >
          Back to School Years
        </Button>

        <div className="header-title">
          <h2 className="dashboard-section-title">Programs</h2>
          <p className="dashboard-section-subtitle">
            {schoolYear?.name}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={onCreateProgram}
          className="create-program-btn"
        >
          Create Program
        </Button>

      </div>

      {programs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <h3 className="empty-state-title">No Programs Found</h3>
            <p className="empty-state-text">
              Get started by creating your first academic program.
            </p>

            <Button
              variant="primary"
              onClick={onCreateProgram}
            >
              Create Program
            </Button>
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