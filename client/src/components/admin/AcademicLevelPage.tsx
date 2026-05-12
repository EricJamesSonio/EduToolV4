import type { ProgramWithStats } from '../../types/program.types';
import { useLevelsBySchoolYear, useAddNextLevel, useRemoveLevel } from '../../hooks/useLevels';
import AcademicDetailCard from './AcademicDetailCard';

interface AcademicLevelPageProps {
  program: ProgramWithStats;
  schoolYearId: string;
  onBackToPrograms: () => void;
}

const AcademicLevelPage: React.FC<AcademicLevelPageProps> = ({
  program,
  schoolYearId,
  onBackToPrograms,
}) => {
  const {
    data: schoolYearLevels = [],
    isLoading,
  } = useLevelsBySchoolYear(schoolYearId);

  const addNextLevelMutation = useAddNextLevel();
  const removeLevelMutation = useRemoveLevel();

  const levels = schoolYearLevels.filter((level) => level.program_id === program.id);

  const handleAddLevel = async () => {
    try {
      await addNextLevelMutation.mutateAsync({
        programId: program.id,
        schoolYearId,
      });
    } catch (error) {
      console.error('Failed to add level:', error);
    }
  };

  const handleRemoveLevel = async () => {
    // Find the highest level number
    const levelNumbers = levels
      .map(level => {
        const match = level.name.match(/Level (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => !isNaN(num));

    if (levelNumbers.length === 0) return;

    const highestLevelNumber = Math.max(...levelNumbers);
    const highestLevel = levels.find(level => {
      const match = level.name.match(/Level (\d+)$/);
      return match && parseInt(match[1], 10) === highestLevelNumber;
    });

    if (highestLevel && confirm(`This will remove "${highestLevel.name}". Are you sure?`)) {
      try {
        await removeLevelMutation.mutateAsync(highestLevel.id);
      } catch (error) {
        console.error('Failed to remove level:', error);
      }
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <button onClick={onBackToPrograms} className="back-button">
          Back to Programs
        </button>
        <div className="header-title">
          <h2 className="dashboard-section-title">Levels</h2>
          <p className="dashboard-section-subtitle">{program.name}</p>
        </div>
        <div className="header-actions">
          <button
            onClick={handleAddLevel}
            className="btn btn-primary create-program-btn"
            disabled={addNextLevelMutation.isPending}
            title="Add next level"
          >
            {addNextLevelMutation.isPending ? '...' : '+'}
          </button>
          {levels.length > 0 && (
            <button
              onClick={handleRemoveLevel}
              className="btn btn-secondary create-program-btn"
              disabled={removeLevelMutation.isPending}
              title="Remove highest level"
            >
              {removeLevelMutation.isPending ? '...' : '-'}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <span className="loading-text">Loading levels...</span>
        </div>
      ) : levels.length === 0 ? (
        <div className="empty-state">
          <h3>No Levels Found</h3>
          <p>Get started by adding your first level.</p>
          <button onClick={handleAddLevel} className="btn btn-primary" disabled={addNextLevelMutation.isPending}>
            {addNextLevelMutation.isPending ? '...' : '+'}
          </button>
        </div>
      ) : (
        <div className="academic-detail-grid">
          {levels.map((level) => (
            <AcademicDetailCard
              key={level.id}
              title={level.name}
              badge="Level"
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

export default AcademicLevelPage;
