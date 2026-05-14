import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button/Button';
import type {
  CreateEducatorDto,
  Educator,
  UpdateEducatorDto,
} from '../types/educator.types';

interface EducatorFormModalProps {
  isOpen: boolean;
  educator?: Educator | null;
  emailExtension?: string | null;
  isLoading?: boolean;
  onSubmit: (data: CreateEducatorDto | UpdateEducatorDto) => Promise<void>;
  onClose: () => void;
}

const EducatorFormModal: React.FC<EducatorFormModalProps> = ({
  isOpen,
  educator = null,
  emailExtension,
  isLoading = false,
  onSubmit,
  onClose,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!educator;
  const normalizedExtension = emailExtension?.startsWith('@')
    ? emailExtension
    : emailExtension
      ? `@${emailExtension}`
      : '';

  useEffect(() => {
    if (isOpen) {
      setFullName(educator?.fullName ?? '');
      if (isEdit && educator?.email) {
        // Extract emailName from full email (remove domain part)
        const emailName = educator.email.split('@')[0];
        setEmail(emailName);
      } else {
        setEmail('');
      }
      setErrors({});
    }
  }, [educator, isOpen, isEdit]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = 'Full name is required.';
    if (!email.trim()) next.email = 'Email name is required.';
    if (email.includes('@')) next.email = 'Enter only the email name (without the @domain part).';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    await onSubmit({
      fullName: fullName.trim(),
      // Backend DTO expects `emailName` (not `email`). For edit, send `emailName` too.
      ...(isEdit ? { emailName: email.trim() } : { emailName: email.trim() }),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Educator' : 'Create Educator'}
      size="sm"
      closeOnOverlayClick={!isLoading}
    >
      <form className="form people-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="educator-full-name">
            Full Name
          </label>
          <input
            id="educator-full-name"
            className={`form-input${errors.fullName ? ' error' : ''}`}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={isLoading}
          />
          {errors.fullName && <span className="form-error">{errors.fullName}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="educator-email">
            Email Name
          </label>
          <div className="people-email-field">
            <input
              id="educator-email"
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

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            {isEdit ? 'Save Changes' : 'Create Educator'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EducatorFormModal;
