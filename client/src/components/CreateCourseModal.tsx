import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button/Button';
import type { CreateCourseDto } from '../types/course.types';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCourseDto) => Promise<void>;
  isLoading?: boolean;
  programId: string;
  schoolYearId: string;
  programName: string;
}

const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  programId,
  schoolYearId,
  programName,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [nameError, setNameError] = useState('');

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
      title="Create Course"
      size="md"
      closeOnOverlayClick={!isLoading}
    >
      <form onSubmit={handleSubmit} className="school-year-form">
        <div className="form-group">
          <label htmlFor="course-program" className="form-label">
            Program
          </label>
          <input
            id="course-program"
            type="text"
            value={programName}
            className="form-input"
            disabled
          />
        </div>

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
            Create Course
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCourseModal;
