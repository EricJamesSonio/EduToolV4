import Modal from '@/components/Modal';
import Button from '@/components/Button/Button';
import type { Educator } from '../types/educator.types';
import type { Student } from '../types/student.types';

type PeopleAccount = Student | Educator;

interface DetailItem {
  label: string;
  value: string | null | undefined;
}

interface PeopleDetailModalProps {
  account: PeopleAccount | null;
  accountType: 'student' | 'educator';
  onClose: () => void;
}

const formatDate = (value: string) => new Date(value).toLocaleString();

const PeopleDetailModal: React.FC<PeopleDetailModalProps> = ({
  account,
  accountType,
  onClose,
}) => {
  if (!account) return null;

  const title = accountType === 'student' ? 'Student Details' : 'Educator Details';
  const roleIdLabel = accountType === 'student' ? 'Student ID' : 'Educator ID';
  const roleId =
    accountType === 'student'
      ? (account as Student).studentId
      : (account as Educator).educatorId;

  const items: DetailItem[] = [
    { label: 'Full Name', value: account.fullName },
    { label: roleIdLabel, value: roleId },
    { label: 'Email', value: account.email },
    { label: 'Personal Email', value: account.personalEmail },
    { label: 'Status', value: account.status },
    { label: 'Account ID', value: account.id },
    { label: 'Organization ID', value: account.orgId },
    { label: 'Created At', value: formatDate(account.createdAt) },
  ];

  if (accountType === 'student') {
    const student = account as Student;
    items.splice(
      5,
      0,
      { label: 'Level ID', value: student.levelId },
      { label: 'Section ID', value: student.sectionId }
    );
  }

  return (
    <Modal isOpen={!!account} onClose={onClose} title={title} size="lg">
      <div className="people-detail-grid">
        {items.map((item) => (
          <div className="people-detail-item" key={item.label}>
            <span className="people-detail-label">{item.label}</span>
            <span className="people-detail-value">{item.value || '-'}</span>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default PeopleDetailModal;
