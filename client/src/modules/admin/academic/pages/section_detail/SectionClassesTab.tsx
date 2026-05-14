import BaseCard from '@/components/BaseCard';
import EmptyState from '@/components/EmptyState';
import type { AcademicClass } from '../../api/class.api';
import { getClassTitle } from '../../utils/section-details.utils';

type Props = {
  classes: AcademicClass[];
  isLoading: boolean;
  isError: boolean;
};

const SectionClassesTab: React.FC<Props> = ({ classes, isLoading, isError }) => (
  <BaseCard className="section-details-card" hover={false}>
    <div className="card-header">
      <h3 className="card-title">Class List</h3>
      <span className="status-badge status-default">{classes.length} found</span>
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
          description="Classes assigned to this section will appear here."
        />
      ) : (
        <div className="section-class-list">
          {classes.map((academicClass) => (
            <div key={academicClass.id} className="section-class-item">
              <div>
                <h4 className="section-class-title">{getClassTitle(academicClass)}</h4>
                <p className="section-class-meta">Capacity: {academicClass.capacity}</p>
              </div>
              <span className="status-badge status-default">
                {academicClass.schedules.length} schedule
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  </BaseCard>
);

export default SectionClassesTab;