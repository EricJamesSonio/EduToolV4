import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button/Button';
import type { CreateLevelDto } from '../modules/admin/academic/types/level.types';

interface CreateLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLevelDto) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  programId: string;
  schoolYearId: string;
  programName?: string;
}

const CreateLevelModal: React.FC<CreateLevelModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  error = null,
  programId,
  schoolYearId,
  programName = '',
}) => {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const resetForm = () => {
    setName('');
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
      setNameError('Level name is required');
      return;
    }

    await onSubmit({
      programId,
      schoolYearId,
      name: name.trim(),
    });

    resetForm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Level"
      size="md"
      closeOnOverlayClick={!isLoading}
    >
      <form onSubmit={handleSubmit} className="school-year-form">
        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="level-program" className="form-label">
            Program
          </label>
          <input
            id="level-program"
            type="text"
            value={programName}
            className="form-input"
            disabled
          />
        </div>

        <div className="form-group">
          <label htmlFor="level-name" className="form-label">
            Level Name *
          </label>
          <input
            id="level-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError('');
            }}
            className={`form-input ${nameError ? 'input-error' : ''}`}
            placeholder="e.g., Grade 1, First Year"
            disabled={isLoading}
          />
          {nameError && (
            <span className="error-message">{nameError}</span>
          )}
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
            Create Level
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateLevelModal;
