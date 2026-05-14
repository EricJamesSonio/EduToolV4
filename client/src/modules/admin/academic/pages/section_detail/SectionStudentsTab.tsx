import BaseCard from '@/components/BaseCard';
import EmptyState from '@/components/EmptyState';
import type { Student } from '../../../people/types/student.types';
import { getStudentName } from '../../utils/section-details.utils';

type Props = {
  students: Student[];
  isLoading: boolean;
  isError: boolean;
};

const SectionStudentsTab: React.FC<Props> = ({ students, isLoading, isError }) => (
  <BaseCard className="section-details-card" hover={false}>
    <div className="card-header">
      <h3 className="card-title">Student List</h3>
      <span className="status-badge status-default">{students.length} found</span>
    </div>
    <div className="card-body">
      {isLoading ? (
        <div className="sections-loading">
          <div className="loading-spinner loading-spinner-sm" />
          <span className="loading-text">Loading students...</span>
        </div>
      ) : isError ? (
        <EmptyState
          title="Unable to Load Students"
          description="The students for this section could not be loaded right now."
        />
      ) : students.length === 0 ? (
        <EmptyState
          title="No Students Found"
          description="Students assigned to this section will appear here."
        />
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Student ID</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{getStudentName(student)}</td>
                  <td>{student.studentId ?? '-'}</td>
                  <td>{student.email}</td>
                  <td>
                    <span className={`status-badge status-${student.status}`}>
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </BaseCard>
);

export default SectionStudentsTab;