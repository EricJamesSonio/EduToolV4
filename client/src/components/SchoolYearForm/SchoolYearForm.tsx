// SchoolYearForm Component
// Form for creating new school years with validation

import React, { useState } from 'react';
import Button from '../Button/Button';
import type { CreateSchoolYearDto } from '../../types/school-year.types';

interface SchoolYearFormProps {
  onSubmit: (data: CreateSchoolYearDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const SchoolYearForm: React.FC<SchoolYearFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}) => {
  const [formData, setFormData] = useState<CreateSchoolYearDto>({
    name: '',
    start_date: '',
    end_date: '',
    confirm_short_duration: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors['name'] = 'School year name is required';
    }

    if (!formData.start_date) {
      newErrors['start_date'] = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors['end_date'] = 'End date is required';
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);

      if (end <= start) {
        newErrors['end_date'] = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof CreateSchoolYearDto, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="school-year-form">
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="name" className="form-label">
          School Year Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`form-input ${errors['name'] ? 'input-error' : ''}`}
          placeholder="e.g., 2024-2025 Academic Year"
          disabled={isLoading}
        />
        {errors['name'] && (
          <span className="error-message">{errors['name']}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="start_date" className="form-label">
            Start Date *
          </label>
          <input
            type="date"
            id="start_date"
            value={formData.start_date}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
            className={`form-input ${errors['start_date'] ? 'input-error' : ''}`}
            disabled={isLoading}
          />
          {errors['start_date'] && (
            <span className="error-message">{errors['start_date']}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="end_date" className="form-label">
            End Date *
          </label>
          <input
            type="date"
            id="end_date"
            value={formData.end_date}
            onChange={(e) => handleInputChange('end_date', e.target.value)}
            className={`form-input ${errors['end_date'] ? 'input-error' : ''}`}
            disabled={isLoading}
          />
          {errors['end_date'] && (
            <span className="error-message">{errors['end_date']}</span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.confirm_short_duration}
            onChange={(e) => handleInputChange('confirm_short_duration', e.target.checked)}
            disabled={isLoading}
          />
          I understand this school year is shorter than 10 months
        </label>
      </div>

      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
        >
          Create School Year
        </Button>
      </div>
    </form>
  );
};

export default SchoolYearForm;
