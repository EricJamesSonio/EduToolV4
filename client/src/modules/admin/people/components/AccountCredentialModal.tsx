import Modal from '@/components/Modal';
import Button from '@/components/Button/Button';

interface AccountCredentialModalProps {
  isOpen: boolean;
  title: string;
  email?: string;
  plainPassword?: string;
  onClose: () => void;
}

const AccountCredentialModal: React.FC<AccountCredentialModalProps> = ({
  isOpen,
  title,
  email,
  plainPassword,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="people-credential-panel">
        <div className="people-detail-item">
          <span className="people-detail-label">Email</span>
          <span className="people-detail-value">{email || '-'}</span>
        </div>
        <div className="people-detail-item">
          <span className="people-detail-label">Temporary Password</span>
          <span className="people-detail-value people-password-value">
            {plainPassword || '-'}
          </span>
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
};

export default AccountCredentialModal;
