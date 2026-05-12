import type { ProgramWithStats } from '../../types/program.types';
import AcademicDetailCard from './AcademicDetailCard';

interface AcademicStrandPageProps {
  program: ProgramWithStats;
  onBackToPrograms: () => void;
  onCreateStrand: () => void;
}

const AcademicStrandPage: React.FC<AcademicStrandPageProps> = ({
  program,
  onBackToPrograms,
  onCreateStrand,
}) => {
  return (
    <div className="view-container">
      <div className="view-header">
        <button onClick={onBackToPrograms} className="back-button">
          Back to Programs
        </button>
        <div className="header-title">
          <h2 className="dashboard-section-title">Strands</h2>
          <p className="dashboard-section-subtitle">{program.name}</p>
        </div>
        <button onClick={onCreateStrand} className="btn btn-primary create-program-btn">
          Create Strand
        </button>
      </div>

      {program.strands.length === 0 ? (
        <div className="empty-state">
          <h3>No Strands Found</h3>
          <p>Get started by creating your first strand.</p>
          <button onClick={onCreateStrand} className="btn btn-primary">
            Create Strand
          </button>
        </div>
      ) : (
        <div className="academic-detail-grid">
          {program.strands.map((strand) => (
            <AcademicDetailCard
              key={strand.id}
              title={strand.name}
              badge="Strand"
              details={[
                { label: 'Program', value: program.name },
                { label: 'Type', value: program.type },
              ]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AcademicStrandPage;
