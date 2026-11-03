import { scheduleDateToMinutes } from '@/commons/utils/schedule-time.util';

export interface SlotView {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface ClassView {
  classId: string;
  subjectId: string;
  subjectName: string;
  semesterId: string;
  semesterName: string | null;
  sectionId: string | null;
  sectionName: string | null;
  levelName: string | null;
  educatorName: string | null;
  capacity: number;
  enrolledCount: number;
  schedules: SlotView[];
}

export type ClassScope = 'current' | 'lower';
export type RequestDecision = 'pending' | 'approved' | 'denied';

export interface RequestableClassView extends ClassView {
  scope: ClassScope;
  isFull: boolean;
}

export interface BlockedClassView extends ClassView {
  scope: ClassScope;
  missing: Array<{ subject_id: string; subject_name: string; reason: string }>;
}

export interface LatestRequestView {
  id: string;
  status: string;
  origin: string;
  requestedAt: Date;
  classes: Array<ClassView & { decision: RequestDecision }>;
}

export interface StudentClassAvailability {
  placement: {
    studentSchoolYearId: string;
    programEnrollmentId: string;
    schoolYearId: string;
    schoolYearName: string;
    programName: string;
    levelName: string | null;
    levelRank: number | null;
    sectionId: string | null;
    sectionName: string | null;
    isIrregular: boolean;
  } | null;
  semesters: Array<{
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
  }>;
  classes: RequestableClassView[];
  blocked: BlockedClassView[];
  enrolled: ClassView[];
  latestRequest: LatestRequestView | null;
}

export interface ConflictItem {
  classId: string;
  subjectName: string;
  semesterId: string;
  schedules: SlotView[];
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

export function minutesToHHmm(min: number): string {
  const total = ((min % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

export function hhmmToMin(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export function slotFromRow(s: {
  weekday: number;
  start_time: Date;
  end_time: Date;
}): SlotView {
  return {
    weekday: s.weekday,
    startTime: minutesToHHmm(scheduleDateToMinutes(s.start_time)),
    endTime: minutesToHHmm(scheduleDateToMinutes(s.end_time)),
  };
}

function slotsOverlap(a: SlotView, b: SlotView): boolean {
  if (a.weekday !== b.weekday) return false;
  return (
    hhmmToMin(a.startTime) < hhmmToMin(b.endTime) &&
    hhmmToMin(a.endTime) > hhmmToMin(b.startTime)
  );
}

export function classesConflict(a: ConflictItem, b: ConflictItem): boolean {
  if (a.classId === b.classId) return false;
  if (a.semesterId !== b.semesterId) return false;
  return a.schedules.some((sa) => b.schedules.some((sb) => slotsOverlap(sa, sb)));
}

export function findClassConflicts<T extends ConflictItem>(
  items: T[],
): Array<[T, T]> {
  const pairs: Array<[T, T]> = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (classesConflict(items[i], items[j])) pairs.push([items[i], items[j]]);
    }
  }
  return pairs;
}