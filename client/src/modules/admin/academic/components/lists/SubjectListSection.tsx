import EmptyState from '@/components/EmptyState';
import ActionButtons from '@/components/ActionButtons/ActionButtons';
import type { Subject } from '../../types/subject.types';

interface SubjectListSectionProps {
  subjects: Subject[];
  isLoading: boolean;
  isError: boolean;
  isMutating: boolean;
  onView: (subject: Subject) => void;
  onEdit: (subject: Subject) => void;
}

const SubjectListSection: React.FC<SubjectListSectionProps> = ({
  subjects,
  isLoading,
  isError,
  isMutating,
  onView,
  onEdit,
}) => {
  return (
    <div className="card-body">
      {isLoading ? (
        <div className="sections-loading">
          <div className="loading-spinner loading-spinner-sm" />
          <span className="loading-text">Loading subjects...</span>
        </div>
      ) : isError ? (
        <EmptyState
          title="Unable to Load Subjects"
          description="Subjects for this level could not be loaded right now."
        />
      ) : subjects.length === 0 ? (
        <EmptyState
          title="No Subjects Found"
          description="Subjects added to this level will appear here."
        />
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Year Level</th>
                <th>Term</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <td>{subject.title}</td>
                  <td>
                    <span className={`status-badge status-${subject.subjectType}`}>
                      {subject.subjectType}
                    </span>
                  </td>
                  <td>{subject.yearLevel ?? '—'}</td>
                  <td>{subject.termLabel ?? '—'}</td>
                  <td>
                    <span
                      className={`status-badge status-${
                        subject.lockStatus === 'locked' ? 'warning' : 'default'
                      }`}
                    >
                      {subject.lockStatus}
                    </span>
                  </td>
                  <td>
                    <ActionButtons
                      variant="compact"
                      size="sm"
                      onView={() => onView(subject)}
                      onEdit={
                        subject.lockStatus === 'locked'
                          ? undefined
                          : () => onEdit(subject)
                      }
                      editLabel="Edit"
                      disabled={isMutating}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubjectListSection;