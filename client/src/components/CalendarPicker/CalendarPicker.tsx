// client/src/components/CalendarPicker/CalendarPicker.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CalendarPickerProps {
  value: string; // yyyy-mm-dd
  onChange: (date: string) => void;
  dateMin?: string; // yyyy-mm-dd (school year start)
  dateMax?: string; // yyyy-mm-dd (school year end)
  disablePastDates?: boolean; // Disable dates before today (default: true)
  defaultMonth?: Date; // Override initial calendar month for smart range selection
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  value,
  onChange,
  dateMin,
  dateMax,
  disablePastDates = true,
  defaultMonth,
  disabled = false,
  placeholder = 'Select date',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Use defaultMonth if provided (for smart range selection)
    if (defaultMonth) {
      return new Date(defaultMonth.getFullYear(), defaultMonth.getMonth(), 1);
    }
    // Otherwise use value if exists
    if (value) {
      const date = new Date(value);
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    // Default to today
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Parse date strings to Date objects for comparison
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDate = parseDate(dateMin || '');
  const maxDate = parseDate(dateMax || '');

  // Get today's date at midnight for accurate comparison
  const getTodayAtMidnight = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const todayAtMidnight = getTodayAtMidnight();

  // Check if a date is within the allowed range
  const isDateInRange = (date: Date): boolean => {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  };

  // Check if a date is in the past
  const isDateInPast = (date: Date): boolean => {
    const dateAtMidnight = new Date(date);
    dateAtMidnight.setHours(0, 0, 0, 0);
    return dateAtMidnight < todayAtMidnight;
  };

  // Check if a date is disabled
  const isDateDisabled = (date: Date): boolean => {
    if (!isDateInRange(date)) return true;
    if (disablePastDates && isDateInPast(date)) return true;
    return false;
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    onChange(formatDate(date));
    setIsOpen(false);
  };

  // Handle input change (manual typing)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Generate calendar grid
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const days: Date[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendar();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDate = parseDate(value);

  return (
    <div className="calendar-picker" ref={containerRef}>
      <input
        type="text"
        id={id}
        className="form-input calendar-picker-input"
        value={value}
        onChange={handleInputChange}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onFocus={() => !disabled && setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
      />

      {isOpen && !disabled && (
        <div className="calendar-picker-popover">
          <div className="calendar-picker-header">
            <button
              type="button"
              className="calendar-picker-nav"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="calendar-picker-month">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              className="calendar-picker-nav"
              onClick={goToNextMonth}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="calendar-picker-weekdays">
            {dayNames.map((day) => (
              <div key={day} className="calendar-picker-weekday">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-picker-days">
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isSelected = selectedDate && formatDate(date) === formatDate(selectedDate);
              const isDisabled = isDateDisabled(date);
              const isPast = disablePastDates && isDateInPast(date);

              return (
                <button
                  key={index}
                  type="button"
                  className={`calendar-picker-day ${isCurrentMonth ? 'calendar-picker-day--current' : 'calendar-picker-day--other'
                    } ${isSelected ? 'calendar-picker-day--selected' : ''
                    } ${isDisabled ? 'calendar-picker-day--disabled' : ''
                    } ${isPast ? 'calendar-picker-day--past' : ''
                    }`}
                  onClick={() => handleDateSelect(date)}
                  disabled={isDisabled}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {(dateMin || dateMax) && (
            <div className="calendar-picker-footer">
              <span className="calendar-picker-hint">
                Dates must be within school year range
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarPicker;
