// ===== File: client\src\modules\admin\academic\components\modals\SectionFormModal.tsx =====
import { useEffect, useState } from 'react';
import Modal from '@/components/Modal/Modal';
import Button from '@/components/Button/Button';
import type { Section } from '../../api/section.api';

interface SectionFormModalProps {
  isOpen: boolean;
  levelId: string;
  schoolYearId: string;
  editTarget?: Section | null;
  isLoading?: boolean;
  onSubmit: (data: { name: string; capacity: number }) => void | Promise<void>;
  onClose: () => void;
}

const SectionFormModal: React.FC<SectionFormModalProps> = ({
  isOpen,
  editTarget,
  isLoading = false,
  onSubmit,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [errors, setErrors] = useState<{ name?: string; capacity?: string }>({});

  const isEdit = !!editTarget;

  useEffect(() => {
    if (isOpen) {
      setName(editTarget?.name ?? '');
      setCapacity(editTarget?.capacity ?? '');
      setErrors({});
    }
  }, [isOpen, editTarget]);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Section name is required.';
    if (name.trim().length > 100) next.name = 'Max 100 characters.';
    if (capacity === '' || isNaN(Number(capacity))) {
      next.capacity = 'Capacity is required.';
    } else if (Number(capacity) < 1) {
      next.capacity = 'Capacity must be at least 1.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit({ name: name.trim(), capacity: Number(capacity) });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Section' : 'Add Section'}
      size="sm"
      closeOnOverlayClick={!isLoading}
    >
      <div className="form-group">
        <label className="form-label">Section Name</label>
        <input
          className={`form-input${errors.name ? ' input-error' : ''}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Section A"
          disabled={isLoading}
          maxLength={100}
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Capacity</label>
        <input
          className={`form-input${errors.capacity ? ' input-error' : ''}`}
          type="number"
          min={1}
          value={capacity}
          onChange={(e) =>
            setCapacity(e.target.value === '' ? '' : Number(e.target.value))
          }
          placeholder="e.g. 40"
          disabled={isLoading}
        />
        {errors.capacity && (
          <span className="form-error">{errors.capacity}</span>
        )}
      </div>

      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSubmit}
          loading={isLoading}
        >
          {isEdit ? 'Save Changes' : 'Add Section'}
        </Button>
      </div>
    </Modal>
  );
};

export default SectionFormModal;