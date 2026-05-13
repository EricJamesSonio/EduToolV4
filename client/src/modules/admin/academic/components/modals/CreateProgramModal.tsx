// Create Program Modal Component
// Reusable modal for creating new programs

import React from 'react';
import Modal from '@/components/Modal';
import ProgramForm from '../forms/ProgramForm';
import type { CreateProgramDto, UpdateProgramDto } from '../../types/program.types';

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProgramDto) => void;
  isLoading: boolean;
  schoolYearId: string;
}

const CreateProgramModal: React.FC<CreateProgramModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  schoolYearId
}) => {
  const handleSubmit = (data: CreateProgramDto | UpdateProgramDto) => {
    onSubmit(data as CreateProgramDto);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Program"
      size="md"
    >
      <ProgramForm
        schoolYearId={schoolYearId}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={isLoading}
      />
    </Modal>
  );
};

export default CreateProgramModal;
