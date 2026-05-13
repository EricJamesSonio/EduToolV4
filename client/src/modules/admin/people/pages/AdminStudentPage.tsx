import { useMemo, useState } from 'react';
import { useStudents } from '../hooks/useStudents';
import type { StudentStatus } from '../types/student.types';

interface AdminStudentPageProps {
  onBack: () => void;
}

const studentStatuses: Array<{ value: StudentStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'graduated', label: 'Graduated' },
];

const AdminStudentPage: React.FC<AdminStudentPageProps> = ({ onBack }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StudentStatus | ''>('');

  const queryParams = useMemo(
    () => ({
      search,
      status: status || undefined,
    }),
    [search, status]
  );

  const { data: students = [], isLoading, isError } = useStudents(queryParams);

  return (
    <div className="people-list-page">
      <div className="view-container">
        <div className="view-header">
          <button type="button" onClick={onBack} className="back-button">
            Back to People
          </button>

          <div className="header-title">
            <h2 className="dashboard-section-title">Students</h2>
            <p className="dashboard-section-subtitle">
              Manage learner accounts and academic profile metadata.
            </p>
          </div>
        </div>
      </div>

      <div className="people-toolbar">
        <div className="search-form people-search">
          <input
            type="search"
            className="search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search students"
            aria-label="Search students"
          />
        </div>

        <select
          className="form-select people-filter"
          value={status}
          onChange={(event) => setStatus(event.target.value as StudentStatus | '')}
          aria-label="Filter students by status"
        >
          {studentStatuses.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="people-loading">
          <div className="loading-spinner"></div>
          <span className="loading-text">Loading students...</span>
        </div>
      ) : isError ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <h3 className="empty-state-title">Unable to Load Students</h3>
            <p className="empty-state-text">
              The students list could not be loaded right now.
            </p>
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <h3 className="empty-state-title">No Students Found</h3>
            <p className="empty-state-text">
              Students matching the current filters will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="table-card people-table-card">
          <div className="card-header">
            <h3 className="card-title">Student Accounts</h3>
            <span className="people-result-count">{students.length} found</span>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Student ID</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Level</th>
                    <th>Section</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.fullName ?? 'Unnamed student'}</td>
                      <td>{student.studentId ?? '-'}</td>
                      <td>{student.email}</td>
                      <td>
                        <span className={`status-badge status-${student.status}`}>
                          {student.status}
                        </span>
                      </td>
                      <td>{student.levelId ?? '-'}</td>
                      <td>{student.sectionId ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentPage;
