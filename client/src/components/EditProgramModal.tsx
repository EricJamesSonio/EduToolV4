// Edit Program Modal Component
// Reusable modal for editing existing programs

import React from 'react';
import Modal from './Modal';
import ProgramForm from './admin/ProgramForm';
import type { Program, UpdateProgramDto } from '../types/program.types';

interface EditProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateProgramDto) => void;
  isLoading: boolean;
  program: Program | null;
}

const EditProgramModal: React.FC<EditProgramModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  program
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Program"
      size="md"
    >
      <ProgramForm
        program={program}
        schoolYearId={program?.schoolYearId || ''}
        onSubmit={onSubmit}
        onCancel={onClose}
        isLoading={isLoading}
      />
    </Modal>
  );
};

export default EditProgramModal;
