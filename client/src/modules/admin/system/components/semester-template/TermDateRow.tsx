// client/src/modules/admin/system/components/semester-template/TermDateRow.tsx

import React from 'react';
import CalendarPicker from '@/components/CalendarPicker/CalendarPicker';
import type { SemesterTemplateTerm } from '../../types/semester-template.types';

interface TermDateRowProps {
  term: SemesterTemplateTerm;
  semesterName: string;
  value: { startDate: string; endDate: string };
  onChange: (termId: string, field: 'startDate' | 'endDate', val: string) => void;
  disabled?: boolean;
  /** School year start date (yyyy-mm-dd) */
  dateMin?: string;
  /** School year end date (yyyy-mm-dd) */
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
    <CalendarPicker
      value={value.startDate}
      onChange={(val) => onChange(term.id, 'startDate', val)}
      dateMin={dateMin}
      dateMax={value.endDate || dateMax}
      disabled={disabled}
      placeholder="Start date"
      id={`term-start-${term.id}`}
    />
    <span className="range-dash">–</span>
    <CalendarPicker
      value={value.endDate}
      onChange={(val) => onChange(term.id, 'endDate', val)}
      dateMin={value.startDate || dateMin}
      dateMax={dateMax}
      disabled={disabled}
      placeholder="End date"
      id={`term-end-${term.id}`}
    />
  </div>
);

export default TermDateRow;