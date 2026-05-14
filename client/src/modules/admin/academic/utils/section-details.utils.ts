import type { AcademicClass, ClassSchedule } from '../api/class.api';
import type { Student } from '../../people/types/student.types';

export const weekdayLabels: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export const formatTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export const getStudentName = (student: Student): string =>
  student.fullName ?? 'Unnamed student';

export const getClassTitle = (academicClass: AcademicClass): string =>
  academicClass.subject_name ?? academicClass.subject_id;

export type ScheduleItem = {
  classId: string;
  subjectName: string;
  capacity: number;
  schedule: ClassSchedule;
};

export const getScheduleItems = (classes: AcademicClass[]): ScheduleItem[] =>
  classes.flatMap((academicClass) =>
    academicClass.schedules.map((schedule) => ({
      classId: academicClass.id,
      subjectName: getClassTitle(academicClass),
      capacity: academicClass.capacity,
      schedule,
    })),
  );