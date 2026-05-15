// client/src/components/CalendarPicker/CalendarPicker.tsx

import React, { useState, useRef, useEffect } from 'react';

interface CalendarPickerProps {
  value: string; // yyyy-mm-dd
  onChange: (date: string) => void;
  dateMin?: string;
  dateMax?: string;
  disablePastDates?: boolean;
  defaultMonth?: Date;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

interface PopoverPosition {
  top: number;
  left: number;
  width: number;
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
  const [popoverPos, setPopoverPos] = useState<PopoverPosition | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (defaultMonth) {
      return new Date(defaultMonth.getFullYear(), defaultMonth.getMonth(), 1);
    }
    if (value) {
      const date = new Date(value);
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    return new Date();
  });

  const inputRef  = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate fixed position from input's bounding rect
  const calculatePosition = (): PopoverPosition | null => {
    if (!inputRef.current) return null;
    const rect = inputRef.current.getBoundingClientRect();
    const popoverHeight = 320; // approx calendar height
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Flip upward if not enough space below
    const top = spaceBelow >= popoverHeight || spaceBelow >= spaceAbove
      ? rect.bottom + 4
      : rect.top - popoverHeight - 4;

    return {
      top,
      left: rect.left,
      width: Math.max(rect.width, 280),
    };
  };

  const openCalendar = () => {
    if (disabled) return;
    const pos = calculatePosition();
    setPopoverPos(pos);
    setIsOpen(true);
  };

  const closeCalendar = () => setIsOpen(false);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        inputRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) return;
      closeCalendar();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Reposition on scroll or resize while open
  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => {
      const pos = calculatePosition();
      setPopoverPos(pos);
    };

    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen]);

  // ── Date utils ─────────────────────────────────────────────────────────────

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (date: Date): string => {
    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day   = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDate = parseDate(dateMin || '');
  const maxDate = parseDate(dateMax || '');

  const todayAtMidnight = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const isDateInRange = (date: Date): boolean => {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  };

  const isDateInPast = (date: Date): boolean => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < todayAtMidnight;
  };

  const isDateDisabled = (date: Date): boolean => {
    if (!isDateInRange(date)) return true;
    if (disablePastDates && isDateInPast(date)) return true;
    return false;
  };

  // ── Calendar grid ──────────────────────────────────────────────────────────

  const generateCalendar = (): Date[] => {
    const year  = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = new Date(firstDay);
    start.setDate(start.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const cur = new Date(start);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  };

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    onChange(formatDate(date));
    closeCalendar();
  };

  const selectedDate  = parseDate(value);
  const calendarDays  = generateCalendar();
  const monthNames    = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="calendar-picker">
      <input
        ref={inputRef}
        type="text"
        id={id}
        className="form-input calendar-picker-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={openCalendar}
        onFocus={openCalendar}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
      />

      {isOpen && !disabled && popoverPos && (
        <div
          ref={popoverRef}
          className="calendar-picker-popover"
          style={{
            position: 'fixed',
            top:      popoverPos.top,
            left:     popoverPos.left,
            minWidth: popoverPos.width,
            zIndex:   1300,
          }}
        >
          <div className="calendar-picker-header">
            <button
              type="button"
              className="calendar-picker-nav"
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
                )
              }
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
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
                )
              }
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="calendar-picker-weekdays">
            {dayNames.map((day) => (
              <div key={day} className="calendar-picker-weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-picker-days">
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isSelected     = selectedDate && formatDate(date) === formatDate(selectedDate);
              const isDisabled     = isDateDisabled(date);
              const isPast         = disablePastDates && isDateInPast(date);

              return (
                <button
                  key={index}
                  type="button"
                  className={[
                    'calendar-picker-day',
                    isCurrentMonth ? 'calendar-picker-day--current' : 'calendar-picker-day--other',
                    isSelected     ? 'calendar-picker-day--selected' : '',
                    isDisabled     ? 'calendar-picker-day--disabled' : '',
                    isPast         ? 'calendar-picker-day--past'     : '',
                  ].join(' ')}
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