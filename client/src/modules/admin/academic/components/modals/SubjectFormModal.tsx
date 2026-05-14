import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button/Button';
import type { Subject } from '../../types/subject.types';
import type { Level } from '../../types/level.types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; subjectType?: 'major' | 'minor'; levelId?: string }) => Promise<void>;
  isLoading?: boolean;
  subject?: Subject | null;
  availableLevels?: Level[];
  currentLevelId?: string;
};

const SUBJECT_TYPES: Array<{ value: 'major' | 'minor'; label: string }> = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
];

const SubjectFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  subject = null,
  availableLevels = [],
  currentLevelId,
}) => {
  const isEdit = !!subject;

  const [name, setName] = useState('');
  const [subjectType, setSubjectType] = useState<'major' | 'minor'>('major');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (subject) {
      setName(subject.title);
      setSubjectType(subject.subjectType);
      setSelectedLevelId(subject.levelId || currentLevelId || '');
    } else {
      setName('');
      setSubjectType('major');
      setSelectedLevelId(currentLevelId || '');
    }

    setNameError('');
  }, [isOpen, subject, currentLevelId]);

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setNameError('Subject name is required.');
      return;
    }

    if (isEdit) {
      await onSubmit({
        name: name.trim(),
        levelId: selectedLevelId !== currentLevelId ? selectedLevelId : undefined,
      });
    } else {
      await onSubmit({ name: name.trim(), subjectType });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Subject' : 'Create Subject'}
      size="md"
      closeOnOverlayClick={!isLoading}
    >
      <form onSubmit={handleSubmit} className="school-year-form">

        <div className="form-group">
          <label htmlFor="subject-name" className="form-label">
            Subject Name *
          </label>
          <input
            id="subject-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError('');
            }}
            className={`form-input ${nameError ? 'input-error' : ''}`}
            placeholder="e.g., Mathematics, English"
            disabled={isLoading}
          />
          {nameError && <span className="error-message">{nameError}</span>}
        </div>

        {!isEdit && (
          <div className="form-group">
            <label htmlFor="subject-type" className="form-label">
              Subject Type
            </label>
            <select
              id="subject-type"
              value={subjectType}
              onChange={(e) => setSubjectType(e.target.value as 'major' | 'minor')}
              className="form-input"
              disabled={isLoading}
            >
              {SUBJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {isEdit && availableLevels.length > 0 && (
          <div className="form-group">
            <label htmlFor="level-select" className="form-label">
              Level
            </label>
            <select
              id="level-select"
              value={selectedLevelId}
              onChange={(e) => setSelectedLevelId(e.target.value)}
              className="form-input"
              disabled={isLoading}
            >
              {availableLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            {isEdit ? 'Update Subject' : 'Create Subject'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SubjectFormModal;