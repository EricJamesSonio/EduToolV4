import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button/Button';
import type { CreateStudentDto, Student, UpdateStudentDto } from '../types/student.types';

interface StudentFormModalProps {
  isOpen: boolean;
  student?: Student | null;
  isLoading?: boolean;
  onSubmit: (data: CreateStudentDto | UpdateStudentDto) => Promise<void>;
  onClose: () => void;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  student = null,
  isLoading = false,
  onSubmit,
  onClose,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!student;

  useEffect(() => {
    if (isOpen) {
      setFullName(student?.fullName ?? '');
      setEmail(student?.email ?? '');
      setStudentId(student?.studentId ?? '');
      setLevelId(student?.levelId ?? '');
      setSectionId(student?.sectionId ?? '');
      setErrors({});
    }
  }, [isOpen, student]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = 'Full name is required.';
    if (!email.trim()) next.email = 'Email is required.';
    if (!isEdit && !studentId.trim()) next.studentId = 'Student ID is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      ...(isEdit ? {} : { studentId: studentId.trim() }),
      ...(levelId.trim() ? { levelId: levelId.trim() } : {}),
      ...(sectionId.trim() ? { sectionId: sectionId.trim() } : {}),
    };

    await onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Student' : 'Create Student'}
      size="md"
      closeOnOverlayClick={!isLoading}
    >
      <form className="form people-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="student-full-name">
            Full Name
          </label>
          <input
            id="student-full-name"
            className={`form-input${errors.fullName ? ' error' : ''}`}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={isLoading}
          />
          {errors.fullName && <span className="form-error">{errors.fullName}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="student-email">
            Email
          </label>
          <input
            id="student-email"
            type="email"
            className={`form-input${errors.email ? ' error' : ''}`}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="student-id">
            Student ID
          </label>
          <input
            id="student-id"
            className={`form-input${errors.studentId ? ' error' : ''}`}
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            disabled={isLoading || isEdit}
          />
          {errors.studentId && <span className="form-error">{errors.studentId}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="student-level-id">
              Level ID
            </label>
            <input
              id="student-level-id"
              className="form-input"
              value={levelId}
              onChange={(event) => setLevelId(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="student-section-id">
              Section ID
            </label>
            <input
              id="student-section-id"
              className="form-input"
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            {isEdit ? 'Save Changes' : 'Create Student'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StudentFormModal;
