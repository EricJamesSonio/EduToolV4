import { useMemo } from 'react';
import EmptyState from '@/components/EmptyState';
import type { Level } from '../types/level.types';

// NOTE: UI scaffold for the Subjects drill-down.
// Backend hooks/APIs for level->subjects are not present in this repo.

type Props = {
  schoolYearId: string;
  level: Level;
  onBack: () => void;
};

const AcademicLevelSubjectsPage: React.FC<Props> = ({ level, onBack }) => {
  const hierarchyTitle = useMemo(() => {
    return `${level.name}`;
  }, [level.name]);

  return (
    <div className="view-container">
      <div className="view-header">
        <button onClick={onBack} className="back-button">
          Back
        </button>
        <div className="header-title">
          <h2 className="dashboard-section-title">Subjects</h2>
          <p className="dashboard-section-subtitle">{hierarchyTitle}</p>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Subject List</h3>
        <p className="panel-subtitle">
          TODO: Fetch subjects for level id <b>{level.id}</b>.
        </p>
        <EmptyState
          title="No Subjects Found"
          description="Subjects added to this level will appear here."
        />
      </div>
    </div>
  );
};

export default AcademicLevelSubjectsPage;

