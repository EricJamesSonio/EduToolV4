// Create School Year Modal Component
// Reusable modal for creating new school years

import React from 'react';
import Modal from './Modal';
import SchoolYearForm from './SchoolYearForm';
import type { CreateSchoolYearDto } from '../modules/admin/academic/types/school-year.types';

interface CreateSchoolYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSchoolYearDto) => void;
  isLoading: boolean;
  error: string | null;
}

const CreateSchoolYearModal: React.FC<CreateSchoolYearModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create School Year"
      size="md"
    >
      <SchoolYearForm
        onSubmit={onSubmit}
        onCancel={onClose}
        isLoading={isLoading}
        error={error}
      />
    </Modal>
  );
};

export default CreateSchoolYearModal;
