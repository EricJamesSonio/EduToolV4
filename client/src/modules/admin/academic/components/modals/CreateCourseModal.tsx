import React, { useState } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button/Button';
import type { Course } from '../../types/course.types';
import type { CreateCourseDto } from '../../types/course.types';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCourseDto) => Promise<void>;
  isLoading?: boolean;
  programId: string;
  schoolYearId: string;
  course?: Course | null;
}

const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  programId,
  schoolYearId,
  course = null,
}) => {
  const [name, setName] = useState(course?.name ?? '');
  const [code, setCode] = useState(course?.code ?? '');
  const [nameError, setNameError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setName(course?.name ?? '');
      setCode(course?.code ?? '');
      setNameError('');
    }
  }, [course, isOpen]);

  const resetForm = () => {
    setName('');
    setCode('');
    setNameError('');
  };

  const handleClose = () => {
    if (isLoading) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setNameError('Course name is required');
      return;
    }

    await onSubmit({
      schoolYearId,
      programId,
      name: name.trim(),
      ...(code.trim() ? { code: code.trim() } : {}),
    });

    resetForm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={course ? 'Edit Course' : 'Create Course'}
      size="md"
      closeOnOverlayClick={!isLoading}
    >
      <form onSubmit={handleSubmit} className="school-year-form">
        <div className="form-group">
          <label htmlFor="course-name" className="form-label">
            Course Name *
          </label>
          <input
            id="course-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError('');
            }}
            className={`form-input ${nameError ? 'input-error' : ''}`}
            placeholder="e.g., Bachelor of Science in Computer Science"
            disabled={isLoading}
          />
          {nameError && (
            <span className="error-message">{nameError}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="course-code" className="form-label">
            Course Code
          </label>
          <input
            id="course-code"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="form-input"
            placeholder="e.g., BSCS, BSBA"
            disabled={isLoading}
          />
        </div>

        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
          >
            {course ? 'Update Course' : 'Create Course'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCourseModal;
