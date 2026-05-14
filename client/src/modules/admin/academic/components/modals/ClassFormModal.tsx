import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button/Button';
import { useSubjectsByLevel } from '../../hooks/useSubjects';
import { useEducators } from '@/modules/admin/people/hooks/useEducators';
import type {
  AcademicClass,
  CreateClassDto,
  UpdateClassDto,
  ScheduleSlotInput,
} from '../../api/class.api';

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

/** 30-minute interval time options, e.g. "07:00", "07:30", … "21:00" */
const TIME_OPTIONS: string[] = (() => {
  const opts: string[] = [];
  for (let h = 6; h <= 21; h++) {
    opts.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 21) opts.push(`${String(h).padStart(2, '0')}:30`);
  }
  return opts;
})();

const formatTime12 = (t: string): string => {
  if (!t) return '';
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${suffix}`;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleRow = {
  weekday: number;
  startTime: string;
  endTime: string;
};

const emptyScheduleRow = (): ScheduleRow => ({
  weekday: 1,
  startTime: '',
  endTime: '',
});

type FormErrors = {
  subjectId?: string;
  educatorId?: string;
  capacity?: string;
  schedules?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateClassDto | UpdateClassDto) => Promise<void>;
  isLoading?: boolean;
  schoolYearId: string;
  sectionId: string;
  levelId: string;
  academicClass?: AcademicClass | null;
};

// ─── TimeSelect ───────────────────────────────────────────────────────────────

interface TimeSelectProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  filterAfter?: string; // only show times strictly after this value
  filterBefore?: string; // only show times strictly before this value
  hasError?: boolean;
}

const TimeSelect: React.FC<TimeSelectProps> = ({
  value,
  onChange,
  disabled,
  placeholder = 'Select time',
  filterAfter,
  filterBefore,
  hasError,
}) => {
  const options = TIME_OPTIONS.filter((t) => {
    if (filterAfter && t <= filterAfter) return false;
    if (filterBefore && t >= filterBefore) return false;
    return true;
  });

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`form-input schedule-slot-time${hasError ? ' input-error' : ''}`}
    >
      <option value="">{placeholder}</option>
      {options.map((t) => (
        <option key={t} value={t}>
          {formatTime12(t)}
        </option>
      ))}
    </select>
  );
};

// ─── ClassFormModal ───────────────────────────────────────────────────────────

const ClassFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  schoolYearId,
  sectionId,
  levelId,
  academicClass = null,
}) => {
  const isEdit = !!academicClass;

  const [subjectId, setSubjectId] = useState('');
  const [educatorId, setEducatorId] = useState('');
  const [capacity, setCapacity] = useState('30');
  const [schedules, setSchedules] = useState<ScheduleRow[]>([emptyScheduleRow()]);
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: subjects = [], isLoading: subjectsLoading } = useSubjectsByLevel(
    levelId,
    schoolYearId,
  );
  const { data: educators = [], isLoading: educatorsLoading } = useEducators();

  // Reset form when modal opens/closes or target class changes
  useEffect(() => {
    if (!isOpen) return;

    if (academicClass) {
      setSubjectId(academicClass.subject_id);
      setEducatorId(academicClass.educator_id);
      setCapacity(String(academicClass.capacity));
      setSchedules(
        academicClass.schedules.length > 0
          ? academicClass.schedules.map((s) => ({
              weekday: s.weekday,
              startTime: s.start_time.slice(11, 16),
              endTime: s.end_time.slice(11, 16),
            }))
          : [emptyScheduleRow()],
      );
    } else {
      setSubjectId('');
      setEducatorId('');
      setCapacity('30');
      setSchedules([emptyScheduleRow()]);
    }

    setErrors({});
  }, [isOpen, academicClass]);

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!subjectId) next.subjectId = 'Subject is required.';
    if (!educatorId) next.educatorId = 'Educator is required.';

    const cap = Number(capacity);
    if (!capacity || isNaN(cap) || cap < 1) {
      next.capacity = 'Capacity must be at least 1.';
    }

    const hasEmptySlot = schedules.some((s) => !s.startTime || !s.endTime);
    if (hasEmptySlot) {
      next.schedules = 'All schedule rows must have a start and end time.';
    }

    const hasInvalidRange = schedules.some((s) => s.startTime >= s.endTime);
    if (!next.schedules && hasInvalidRange) {
      next.schedules = 'Start time must be before end time for each schedule.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const slots: ScheduleSlotInput[] = schedules.map((s) => ({
      weekday: s.weekday,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    if (isEdit) {
      await onSubmit({ educatorId, capacity: Number(capacity), schedules: slots } as UpdateClassDto);
    } else {
      await onSubmit({
        subjectId,
        educatorId,
        sectionId,
        schoolYearId,
        capacity: Number(capacity),
        schedules: slots,
      } as CreateClassDto);
    }
  };

  const updateScheduleRow = (index: number, field: keyof ScheduleRow, value: string | number) => {
    setSchedules((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
    setErrors((prev) => ({ ...prev, schedules: undefined }));
  };

  const addScheduleRow = () => setSchedules((prev) => [...prev, emptyScheduleRow()]);

  const removeScheduleRow = (index: number) =>
    setSchedules((prev) => prev.filter((_, i) => i !== index));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Class' : 'Create Class'}
      size="md"
      closeOnOverlayClick={!isLoading}
    >
      {/*
        KEY FIX: wrap the scrollable body and the sticky footer separately.
        The modal itself should be flex-column with a max-height so the footer
        is always visible regardless of how many schedule rows are added.

        Add these styles to your global CSS (or a <style> tag):

          .class-form-modal-body {
            overflow-y: auto;
            max-height: calc(80vh - 130px); // 130px ≈ modal header + footer height
            padding: 0 1.5rem 0.5rem;
          }
          .class-form-modal-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--color-border, #e5e7eb);
            background: var(--color-surface, #fff);
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            flex-shrink: 0;
          }
      */}
      <form onSubmit={handleSubmit} className="school-year-form class-form-modal">
        {/* ── Scrollable body ── */}
        <div className="class-form-modal-body">

          {/* Subject */}
          <div className="form-group">
            <label htmlFor="class-subject" className="form-label">
              Subject *
            </label>
            <select
              id="class-subject"
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setErrors((prev) => ({ ...prev, subjectId: undefined }));
              }}
              className={`form-input${errors.subjectId ? ' input-error' : ''}`}
              disabled={isLoading || isEdit || subjectsLoading}
            >
              <option value="">
                {subjectsLoading ? 'Loading subjects…' : 'Select a subject'}
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            {errors.subjectId && <span className="error-message">{errors.subjectId}</span>}
          </div>

          {/* Educator */}
          <div className="form-group">
            <label htmlFor="class-educator" className="form-label">
              Educator *
            </label>
            <select
              id="class-educator"
              value={educatorId}
              onChange={(e) => {
                setEducatorId(e.target.value);
                setErrors((prev) => ({ ...prev, educatorId: undefined }));
              }}
              className={`form-input${errors.educatorId ? ' input-error' : ''}`}
              disabled={isLoading || educatorsLoading}
            >
              <option value="">
                {educatorsLoading ? 'Loading educators…' : 'Select an educator'}
              </option>
              {educators.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.fullName ?? ed.email}
                </option>
              ))}
            </select>
            {errors.educatorId && <span className="error-message">{errors.educatorId}</span>}
          </div>

          {/* Capacity */}
          <div className="form-group">
            <label htmlFor="class-capacity" className="form-label">
              Capacity *
            </label>
            <input
              id="class-capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => {
                setCapacity(e.target.value);
                setErrors((prev) => ({ ...prev, capacity: undefined }));
              }}
              className={`form-input${errors.capacity ? ' input-error' : ''}`}
              disabled={isLoading}
            />
            {errors.capacity && <span className="error-message">{errors.capacity}</span>}
          </div>

          {/* Schedules */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Schedules *</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addScheduleRow}
                disabled={isLoading}
              >
                + Add Slot
              </button>
            </div>

            <div className="schedule-slot-list">
              {schedules.map((row, index) => (
                <div key={index} className="schedule-slot-row">
                  {/* Day */}
                  <select
                    value={row.weekday}
                    onChange={(e) =>
                      updateScheduleRow(index, 'weekday', Number(e.target.value))
                    }
                    className="form-input schedule-slot-day"
                    disabled={isLoading}
                  >
                    {WEEKDAY_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>

                  {/* Start time */}
                  <TimeSelect
                    value={row.startTime}
                    onChange={(v) => updateScheduleRow(index, 'startTime', v)}
                    disabled={isLoading}
                    placeholder="Start"
                    // end time must come after start, so filter times >= endTime away
                    filterBefore={row.endTime || undefined}
                    hasError={!!errors.schedules}
                  />

                  <span className="schedule-slot-sep">–</span>

                  {/* End time */}
                  <TimeSelect
                    value={row.endTime}
                    onChange={(v) => updateScheduleRow(index, 'endTime', v)}
                    disabled={isLoading}
                    placeholder="End"
                    // start time must come before end, so filter times <= startTime away
                    filterAfter={row.startTime || undefined}
                    hasError={!!errors.schedules}
                  />

                  {schedules.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm schedule-slot-remove"
                      onClick={() => removeScheduleRow(index)}
                      disabled={isLoading}
                      aria-label="Remove schedule slot"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {errors.schedules && (
              <span className="error-message">{errors.schedules}</span>
            )}
          </div>
        </div>

        {/* ── Sticky footer — always visible ── */}
        <div className="class-form-modal-footer">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            {isEdit ? 'Update Class' : 'Create Class'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ClassFormModal;