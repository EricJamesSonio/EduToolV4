// ===== client/src/components/shared/SchoolYearSelector.tsx =====

import { useEffect } from 'react';
import type { SchoolYear } from '../../modules/admin/academic/types/school-year.types';

export interface SchoolYearSelectorProps {
  schoolYears: SchoolYear[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

const SchoolYearSelector: React.FC<SchoolYearSelectorProps> = ({
  schoolYears,
  isLoading,
  selectedId,
  onSelect,
  className,
}) => {
  useEffect(() => {
    if (!selectedId && schoolYears.length > 0) {
      const defaultId =
        schoolYears.find((sy) => sy.status === 'active')?.id ?? schoolYears[0].id;
      onSelect(defaultId);
    }
  }, [schoolYears, selectedId, onSelect]);

  if (isLoading) {
    return (
      <div className={`school-year-selector__skeleton ${className ?? ''}`}>
        <div className="school-year-selector__skeleton-icon" />
        <div className="school-year-selector__skeleton-select" />
      </div>
    );
  }

  if (schoolYears.length === 0) {
    return <p className="form-hint">No school years found.</p>;
  }

  const selected = schoolYears.find((sy) => sy.id === selectedId);

  return (
    <div className={`school-year-selector ${className ?? ''}`}>
      <svg
        className="school-year-selector__icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>

      <div className="school-year-selector__select-wrapper">
        <select
          value={selectedId ?? ''}
          onChange={(e) => { if (e.target.value) onSelect(e.target.value); }}
          className="school-year-selector__select"
        >
          <option value="" disabled>Select school year</option>
          {schoolYears.map((sy) => (
            <option key={sy.id} value={sy.id}>
              {sy.name}
            </option>
          ))}
        </select>

        <div className="school-year-selector__chevron" aria-hidden="true">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {selected?.status === 'active' && (
        <span className="school-year-selector__active-badge">Active</span>
      )}
    </div>
  );
};

export default SchoolYearSelector;