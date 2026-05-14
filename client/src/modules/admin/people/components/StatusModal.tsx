import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button/Button';
import type { EducatorStatus } from '../types/educator.types';
import type { StudentStatus } from '../types/student.types';

type AccountStatus = StudentStatus | EducatorStatus;

interface StatusOption {
  value: AccountStatus;
  label: string;
}

interface StatusModalProps {
  isOpen: boolean;
  title: string;
  currentStatus?: AccountStatus;
  options: StatusOption[];
  requiresReason?: boolean;
  isLoading?: boolean;
  onSubmit: (status: AccountStatus, reason?: string) => Promise<void>;
  onClose: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  title,
  currentStatus,
  options,
  requiresReason = false,
  isLoading = false,
  onSubmit,
  onClose,
}) => {
  const [status, setStatus] = useState<AccountStatus>(currentStatus ?? options[0].value);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStatus(currentStatus ?? options[0].value);
      setReason('');
      setError('');
    }
  }, [currentStatus, isOpen, options]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (requiresReason && status === 'active' && !reason.trim()) {
      setError('Reason is required for this status change.');
      return;
    }

    await onSubmit(status, reason.trim() || undefined);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!isLoading}
    >
      <form className="form people-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="people-status">
            Status
          </label>
          <select
            id="people-status"
            className="form-select"
            value={status}
            onChange={(event) => setStatus(event.target.value as AccountStatus)}
            disabled={isLoading}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {requiresReason && status === 'active' && (
          <div className="form-group">
            <label className="form-label" htmlFor="people-status-reason">
              Reason
            </label>
            <textarea
              id="people-status-reason"
              className={`form-textarea${error ? ' error' : ''}`}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError('');
              }}
              disabled={isLoading}
              maxLength={500}
            />
            {error && <span className="form-error">{error}</span>}
          </div>
        )}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Update Status
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StatusModal;
