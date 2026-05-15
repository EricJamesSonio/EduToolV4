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
  /** School year start date (yyyy-mm-dd) — absolute lower bound */
  dateMin?: string;
  /** School year end date (yyyy-mm-dd) — absolute upper bound */
  dateMax?: string;
  /**
   * Smart chaining: the day after the previous term's end date.
   * When provided, this overrides dateMin for the start date picker
   * and pre-navigates the calendar to that month.
   */
  chainedStartMin?: string;
}

/** Returns yyyy-mm-dd of the day after a given yyyy-mm-dd string */
function nextDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Parses yyyy-mm-dd into a Date (local, no timezone shift) */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const TermDateRow: React.FC<TermDateRowProps> = ({
  term,
  semesterName,
  value,
  onChange,
  disabled,
  dateMin,
  dateMax,
  chainedStartMin,
}) => {
  // Effective start date lower bound:
  // chainedStartMin (previous term end + 1) takes priority over school year dateMin
  const effectiveStartMin = chainedStartMin ?? dateMin;

  // End date lower bound: day after this term's own start date
  const effectiveEndMin = value.startDate ? nextDay(value.startDate) : effectiveStartMin;

  // Default month for start picker: navigate to chainedStartMin's month if provided
  const startDefaultMonth = chainedStartMin
    ? parseLocalDate(chainedStartMin)
    : undefined;

  // Default month for end picker: navigate to day after start date
  const endDefaultMonth = value.startDate
    ? parseLocalDate(nextDay(value.startDate))
    : undefined;

  const handleStartChange = (val: string) => {
    onChange(term.id, 'startDate', val);
    // If existing end date is now before the new start+1, clear it
    if (value.endDate && val && value.endDate <= val) {
      onChange(term.id, 'endDate', '');
    }
  };

  const handleEndChange = (val: string) => {
    onChange(term.id, 'endDate', val);
  };

  return (
    <div className="term-date-row">
      <div className="term-date-label">
        <span className="term-date-semester">{semesterName}</span>
        <span className="term-date-name">{term.name}</span>
      </div>

      {/* Start date — min is chained from previous term's end */}
      <CalendarPicker
        value={value.startDate}
        onChange={handleStartChange}
        dateMin={effectiveStartMin}
        dateMax={value.endDate || dateMax}
       disablePastDates={true}
        defaultMonth={startDefaultMonth}
        disabled={disabled}
        placeholder="Start date"
        id={`term-start-${term.id}`}
      />

      <span className="range-dash">–</span>

      {/* End date — min is day after this term's start */}
      <CalendarPicker
        value={value.endDate}
        onChange={handleEndChange}
        dateMin={effectiveEndMin}
        dateMax={dateMax}
        disablePastDates={true}
        defaultMonth={endDefaultMonth}
        disabled={disabled || !value.startDate}
        placeholder="End date"
        id={`term-end-${term.id}`}
      />
    </div>
  );
};

export default TermDateRow;