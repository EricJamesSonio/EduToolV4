// School Year Card Component
// Individual school year card with consistent styling

import React from 'react';
import type { SchoolYear } from '../types/school-year.types';
import BaseCard from './BaseCard';

interface SchoolYearCardProps {
  schoolYear: SchoolYear;
  onSelect: (schoolYear: SchoolYear) => void;
}

const SchoolYearCard: React.FC<SchoolYearCardProps> = ({ schoolYear, onSelect }) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      default:
        return 'status-default';
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <BaseCard
      className="school-year-card"
      onClick={() => onSelect(schoolYear)}
    >
      <div className="card-header">
        <div className="school-year-header">
          <h3 className="card-title">{schoolYear.name}</h3>
          <span className={`status-badge ${getStatusBadgeClass(schoolYear.status)}`}>
            {schoolYear.status}
          </span>
        </div>
      </div>
      <div className="card-body">
        <div className="school-year-details">
          <div className="school-year-date">
            <span className="date-label">Starts:</span>
            <span className="date-value">
              {formatDate(schoolYear.start_date)}
            </span>
          </div>
          <div className="school-year-date">
            <span className="date-label">Ends:</span>
            <span className="date-value">
              {formatDate(schoolYear.end_date)}
            </span>
          </div>
        </div>
      </div>
      <div className="card-footer">
        <div className="footer-actions">
          <button
            onClick={() => onSelect(schoolYear)}
            className="btn btn-primary"
          >
            View Programs
          </button>
        </div>
      </div>
    </BaseCard>
  );
};

export default SchoolYearCard;
