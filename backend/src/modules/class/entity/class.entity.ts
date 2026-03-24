// src/modules/class/entity/class.entity.ts

export class ClassScheduleEntity {
  id: string;
  classId: string;
  weekday: number;
  startTime: Date;
  endTime: Date;
}

export class ClassEntity {
  id: string;
  orgId: string;
  subjectId: string;
  educatorId: string;
  sectionId: string | null;
  schoolYearId: string;
  semesterId: string;
  capacity: number; // 0 = unlimited
  createdAt: Date;
  schedules: ClassScheduleEntity[];
}

export class EnrollmentEntity {
  id: string;
  orgId: string;
  classId: string;
  studentId: string;
  status: 'active' | 'pending' | 'removed';
  createdAt: Date;
}