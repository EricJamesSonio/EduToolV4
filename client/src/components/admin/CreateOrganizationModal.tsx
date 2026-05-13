import Modal from '../Modal';
import OrganizationForm from './OrganizationForm';
import type { CreateOrganizationDto } from '../../types/organization.types';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onSubmit: (data: CreateOrganizationDto) => void;
}

const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
  isOpen,
  isLoading,
  onSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => undefined}
      title="Create School Organization"
      size="md"
      showCloseButton={false}
      closeOnOverlayClick={false}
    >
      <p className="modal-text">
        Create your school organization first before using the admin system tools.
      </p>
      <OrganizationForm
        isLoading={isLoading}
        submitLabel="Create Organization"
        onSubmit={(data) => onSubmit(data as CreateOrganizationDto)}
      />
    </Modal>
  );
};

export default CreateOrganizationModal;
