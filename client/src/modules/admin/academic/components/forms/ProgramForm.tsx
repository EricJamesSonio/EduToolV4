// ProgramForm Component
// Form for creating and editing programs

import React, { useState, useEffect } from 'react';
import type { Program, CreateProgramDto, UpdateProgramDto, ProgramType } from '../../types/program.types';
import { PROGRAM_TYPES } from '../../api/constants/programTypes';

export interface ProgramFormProps {
  program?: Program | null;
  schoolYearId: string;
  onSubmit: (data: CreateProgramDto | UpdateProgramDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

const ProgramForm: React.FC<ProgramFormProps> = ({
  program,
  schoolYearId,
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name,
        type: program.type,
      });
    } else {
      setFormData({
        name: '',
        type: '',
      });
    }
    setErrors({});
  }, [program]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Program name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Program name must be at least 2 characters';
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Program type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      type: formData.type.trim() as ProgramType,
      ...(program ? {} : { schoolYearId }),
    };

    onSubmit(submitData);
  };

  const programTypes = PROGRAM_TYPES;

  return (
    <div className={`program-form ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {program ? 'Edit Program' : 'Create New Program'}
          </h3>
          <p className="text-gray-600 mt-1">
            {program
              ? 'Update the program information below.'
              : 'Fill in the details to create a new academic program.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Program Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Program Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="e.g., Bachelor of Science in Computer Science"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Program Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Program Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={`form-select ${errors.type ? 'error' : ''}`}
              disabled={isLoading}
            >
              <option value="">Select program type</option>
              {programTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-2 text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {program ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                program ? 'Update Program' : 'Create Program'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgramForm;
