import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button/Button';
import { useSubjectsByLevel } from '../../hooks/useSubjects';
import { useEducators } from '@/modules/admin/people/hooks/useEducators';
import type { AcademicClass, CreateClassDto, UpdateClassDto, ScheduleSlotInput } from '../../api/class.api';

const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

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
              startTime: s.start_time.slice(11, 16), // extract HH:MM from ISO string
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
      const dto: UpdateClassDto = {
        educatorId,
        capacity: Number(capacity),
        schedules: slots,
      };
      await onSubmit(dto);
    } else {
      const dto: CreateClassDto = {
        subjectId,
        educatorId,
        sectionId,
        schoolYearId,
        capacity: Number(capacity),
        schedules: slots,
      };
      await onSubmit(dto);
    }
  };

  const updateScheduleRow = (index: number, field: keyof ScheduleRow, value: string | number) => {
    setSchedules((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
    setErrors((prev) => ({ ...prev, schedules: undefined }));
  };

  const addScheduleRow = () => {
    setSchedules((prev) => [...prev, emptyScheduleRow()]);
  };

  const removeScheduleRow = (index: number) => {
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Class' : 'Create Class'}
      size="md"
      closeOnOverlayClick={!isLoading}
    >
      <form onSubmit={handleSubmit} className="school-year-form">

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
            className={`form-input ${errors.subjectId ? 'input-error' : ''}`}
            disabled={isLoading || isEdit || subjectsLoading}
          >
            <option value="">
              {subjectsLoading ? 'Loading subjects...' : 'Select a subject'}
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
            className={`form-input ${errors.educatorId ? 'input-error' : ''}`}
            disabled={isLoading || educatorsLoading}
          >
            <option value="">
              {educatorsLoading ? 'Loading educators...' : 'Select an educator'}
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
            className={`form-input ${errors.capacity ? 'input-error' : ''}`}
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
                <select
                  value={row.weekday}
                  onChange={(e) => updateScheduleRow(index, 'weekday', Number(e.target.value))}
                  className="form-input schedule-slot-day"
                  disabled={isLoading}
                >
                  {WEEKDAY_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  value={row.startTime}
                  onChange={(e) => updateScheduleRow(index, 'startTime', e.target.value)}
                  className="form-input schedule-slot-time"
                  disabled={isLoading}
                />

                <span className="schedule-slot-sep">–</span>

                <input
                  type="time"
                  value={row.endTime}
                  onChange={(e) => updateScheduleRow(index, 'endTime', e.target.value)}
                  className="form-input schedule-slot-time"
                  disabled={isLoading}
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

          {errors.schedules && <span className="error-message">{errors.schedules}</span>}
        </div>

        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
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