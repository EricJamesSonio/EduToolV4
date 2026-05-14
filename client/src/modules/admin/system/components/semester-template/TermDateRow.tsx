// client/src/modules/admin/system/components/semester-template/TermDateRow.tsx

import React from 'react';
import type { SemesterTemplateTerm } from '../../types/semester-template.types';

interface TermDateRowProps {
  term: SemesterTemplateTerm;
  semesterName: string;
  value: { startDate: string; endDate: string };
  onChange: (termId: string, field: 'startDate' | 'endDate', val: string) => void;
  disabled?: boolean;
  /** HTML date input min — school year start date (yyyy-mm-dd) */
  dateMin?: string;
  /** HTML date input max — school year end date (yyyy-mm-dd) */
  dateMax?: string;
}

const TermDateRow: React.FC<TermDateRowProps> = ({
  term,
  semesterName,
  value,
  onChange,
  disabled,
  dateMin,
  dateMax,
}) => (
  <div className="term-date-row">
    <div className="term-date-label">
      <span className="term-date-semester">{semesterName}</span>
      <span className="term-date-name">{term.name}</span>
    </div>
    <input
      type="date"
      className="form-input term-date-input"
      value={value.startDate}
      min={dateMin || undefined}
      max={value.endDate || dateMax || undefined}
      onChange={(e) => onChange(term.id, 'startDate', e.target.value)}
      disabled={disabled}
    />
    <span className="range-dash">–</span>
    <input
      type="date"
      className="form-input term-date-input"
      value={value.endDate}
      min={value.startDate || dateMin || undefined}
      max={dateMax || undefined}
      onChange={(e) => onChange(term.id, 'endDate', e.target.value)}
      disabled={disabled}
    />
  </div>
);

export default TermDateRow;