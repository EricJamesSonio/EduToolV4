import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button/Button';
import type { CreateStudentDto, Student, UpdateStudentDto } from '../types/student.types';

interface StudentFormModalProps {
  isOpen: boolean;
  student?: Student | null;
  emailExtension?: string | null;
  isLoading?: boolean;
  onSubmit: (data: CreateStudentDto | UpdateStudentDto) => Promise<void>;
  onClose: () => void;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  student = null,
  emailExtension,
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
  const normalizedExtension = emailExtension?.startsWith('@')
    ? emailExtension
    : emailExtension
      ? `@${emailExtension}`
      : '';

  useEffect(() => {
    if (isOpen) {
      setFullName(student?.fullName ?? '');
      if (isEdit && student?.email) {
        // Extract emailName from full email (remove domain part)
        const emailName = student.email.split('@')[0];
        setEmail(emailName);
      } else {
        setEmail('');
      }
      setStudentId(student?.studentId ?? '');
      setLevelId(student?.levelId ?? '');
      setSectionId(student?.sectionId ?? '');
      setErrors({});
    }
  }, [isOpen, student, isEdit]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = 'Full name is required.';
    if (!email.trim()) next.email = 'Email name is required.';
    if (email.includes('@')) next.email = 'Enter only the email name (without the @domain part).';
    if (!isEdit && !studentId.trim()) next.studentId = 'Student ID is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) return;

    const payload = {
      fullName: fullName.trim(),
      // Backend DTO expects `emailName` (not `email`)
      ...(isEdit ? { emailName: email.trim() } : { emailName: email.trim() }),
      ...(isEdit ? {} : { studentId: studentId.trim() }),
      // Level/Section are assigned later via enrollment workflow.
      // Only include them if the admin explicitly enters values.
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
            Email Name
          </label>
          <div className="people-email-field">
            <input
              id="student-email"
              type="text"
              className={`form-input${errors.email ? ' error' : ''}`}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
            />
            <span className="people-email-extension">{normalizedExtension}</span>
          </div>
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
