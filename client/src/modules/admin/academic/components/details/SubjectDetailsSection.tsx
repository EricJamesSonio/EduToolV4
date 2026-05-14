import BaseCard from '@/components/BaseCard';
import SubjectCreateButton from '../buttons/SubjectCreateButton';
import SubjectListSection from '../lists/SubjectListSection';
import type { Subject } from '../../types/subject.types';

interface SubjectDetailsSectionProps {
  subjects: Subject[];
  isLoading: boolean;
  isError: boolean;
  isMutating: boolean;
  onCreateClick: () => void;
  onView: (subject: Subject) => void;
  onEdit: (subject: Subject) => void;
}

const SubjectDetailsSection: React.FC<SubjectDetailsSectionProps> = ({
  subjects,
  isLoading,
  isError,
  isMutating,
  onCreateClick,
  onView,
  onEdit,
}) => {
  return (
    <BaseCard className="section-details-card" hover={false}>
      <div className="card-header">
        <div className="card-header-left">
          <h3 className="card-title">Subject List</h3>
          <span className="status-badge status-default">{subjects.length} found</span>
        </div>
        <SubjectCreateButton onClick={onCreateClick} loading={isMutating} />
      </div>

      <SubjectListSection
        subjects={subjects}
        isLoading={isLoading}
        isError={isError}
        isMutating={isMutating}
        onView={onView}
        onEdit={onEdit}
      />
    </BaseCard>
  );
};

export default SubjectDetailsSection;