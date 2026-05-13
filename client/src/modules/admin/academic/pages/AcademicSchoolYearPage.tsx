import type { SchoolYear } from '../types/school-year.types';
import SchoolYearCard from '../components/cards/SchoolYearCard';
import Button from '@/components/Button/Button';

interface AcademicSchoolYearPageProps {
  schoolYears: SchoolYear[];
  onCreateSchoolYear: () => void;
  onSelectSchoolYear: (schoolYear: SchoolYear) => void;
}

const AcademicSchoolYearPage: React.FC<AcademicSchoolYearPageProps> = ({
  schoolYears,
  onCreateSchoolYear,
  onSelectSchoolYear,
}) => {
  return (
    <div className="school-year-selection">
      <div className="dashboard-section-header">
        <div className="header-title">
          <h2 className="dashboard-section-title">Select School Year</h2>
          <p className="dashboard-section-subtitle">
            Choose a school year to manage its academic programs.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={onCreateSchoolYear}
          className="create-school-year-btn"
        >
          Create School Year
        </Button>
      </div>

      <div className="school-year-grid">
        {schoolYears.map((schoolYear) => (
          <SchoolYearCard
            key={schoolYear.id}
            schoolYear={schoolYear}
            onSelect={onSelectSchoolYear}
          />
        ))}
      </div>
    </div>
  );
};

export default AcademicSchoolYearPage;
