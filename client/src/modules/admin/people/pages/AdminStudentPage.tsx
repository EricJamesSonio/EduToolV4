import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import AccountCredentialModal from '../components/AccountCredentialModal';
import PeopleDetailModal from '../components/PeopleDetailModal';
import StatusModal from '../components/StatusModal';
import StudentFormModal from '../components/StudentFormModal';
import { useOrganization } from '../../system/hooks/useOrganization';
import {
  useCreateStudent,
  useResetStudentPassword,
  useStudents,
  useUpdateStudent,
  useUpdateStudentStatus,
} from '../hooks/useStudents';
import type {
  CreateStudentDto,
  Student,
  StudentStatus,
  StudentWithPassword,
  UpdateStudentDto,
} from '../types/student.types';

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

const studentStatusOptions: Array<{ value: StudentStatus; label: string }> =
  studentStatuses.filter(
    (option): option is { value: StudentStatus; label: string } => !!option.value
  );

const AdminStudentPage: React.FC<AdminStudentPageProps> = ({ onBack }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StudentStatus | ''>('');
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [formStudent, setFormStudent] = useState<Student | null | undefined>(undefined);
  const [statusStudent, setStatusStudent] = useState<Student | null>(null);
  const [credential, setCredential] = useState<StudentWithPassword | null>(null);

  const queryParams = useMemo(
    () => ({
      search,
      status: status || undefined,
    }),
    [search, status]
  );

  const { data: students = [], isLoading, isError } = useStudents(queryParams);
  const { data: organization } = useOrganization();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const updateStatus = useUpdateStudentStatus();
  const resetPassword = useResetStudentPassword();

  const handleSaveStudent = async (data: CreateStudentDto | UpdateStudentDto) => {
    if (formStudent) {
      await updateStudent.mutateAsync({
        id: formStudent.id,
        data: data as UpdateStudentDto,
      });
      toast.success('Student updated.');
    } else {
      const created = await createStudent.mutateAsync(data as CreateStudentDto);
      setCredential(created);
      toast.success('Student created.');
    }
    setFormStudent(undefined);
  };

  const handleStatusSubmit = async (nextStatus: StudentStatus, reason?: string) => {
    if (!statusStudent) return;
    await updateStatus.mutateAsync({
      id: statusStudent.id,
      data: { status: nextStatus, ...(reason ? { reason } : {}) },
    });
    toast.success('Student status updated.');
    setStatusStudent(null);
  };

  const handleToggleBlock = async (student: Student) => {
    const nextStatus: StudentStatus = student.status === 'suspended' ? 'active' : 'suspended';
    await updateStatus.mutateAsync({
      id: student.id,
      data: { status: nextStatus },
    });
    toast.success(nextStatus === 'suspended' ? 'Student blocked.' : 'Student unblocked.');
  };

  const handleResetPassword = async (student: Student) => {
    const result = await resetPassword.mutateAsync(student.id);
    setCredential({ ...student, plainPassword: result.plainPassword });
    toast.success('Student password reset.');
  };

  const isSaving = createStudent.isPending || updateStudent.isPending;
  const emailExtension = organization?.emailExtension?.trim() || '';
  const canCreateAccount = !!emailExtension;
  const requiresStatusReason =
    statusStudent?.status === 'dropped' ||
    statusStudent?.status === 'transferred' ||
    statusStudent?.status === 'graduated';

  const handleOpenCreateStudent = () => {
    if (!canCreateAccount) {
      toast.error('Set the organization email extension before creating student accounts.');
      return;
    }
    setFormStudent(null);
  };

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

          <button
            type="button"
            className="btn btn-primary people-header-action"
            onClick={handleOpenCreateStudent}
          >
            Create Student
          </button>
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
                    <th>Actions</th>
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
                      <td className="action-cell">
                        <div className="action-buttons action-buttons-compact people-row-actions">
                          <button
                            type="button"
                            className="action-button"
                            onClick={() => setDetailStudent(student)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="action-button action-button-edit"
                            onClick={() => setFormStudent(student)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="action-button action-button-edit"
                            onClick={() => setStatusStudent(student)}
                          >
                            Status
                          </button>
                          <button
                            type="button"
                            className={
                              student.status === 'suspended'
                                ? 'action-button action-button-edit'
                                : 'action-button action-button-delete'
                            }
                            onClick={() => handleToggleBlock(student)}
                            disabled={updateStatus.isPending}
                          >
                            {student.status === 'suspended' ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            type="button"
                            className="action-button"
                            onClick={() => handleResetPassword(student)}
                            disabled={resetPassword.isPending}
                          >
                            Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <PeopleDetailModal
        account={detailStudent}
        accountType="student"
        onClose={() => setDetailStudent(null)}
      />
      <StudentFormModal
        isOpen={formStudent !== undefined}
        student={formStudent}
        emailExtension={emailExtension}
        isLoading={isSaving}
        onSubmit={handleSaveStudent}
        onClose={() => setFormStudent(undefined)}
      />
      <StatusModal
        isOpen={!!statusStudent}
        title="Manage Student Status"
        currentStatus={statusStudent?.status}
        options={studentStatusOptions}
        requiresReason={requiresStatusReason}
        isLoading={updateStatus.isPending}
        onSubmit={(nextStatus, reason) =>
          handleStatusSubmit(nextStatus as StudentStatus, reason)
        }
        onClose={() => setStatusStudent(null)}
      />
      <AccountCredentialModal
        isOpen={!!credential}
        title="Student Credentials"
        email={credential?.email}
        plainPassword={credential?.plainPassword}
        onClose={() => setCredential(null)}
      />
    </div>
  );
};

export default AdminStudentPage;
