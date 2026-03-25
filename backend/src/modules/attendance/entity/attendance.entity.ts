// @/modules/attendance/entity/attendance.entity.ts

export class AttendanceSessionEntity {
  id: string;
  org_id: string;
  class_id: string;
  date: Date;
  week_number: number;
  sub_index: number;
}

export class AttendanceRecordEntity {
  id: string;
  org_id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export class AttendanceSessionWithRecordsEntity extends AttendanceSessionEntity {
  records: AttendanceRecordEntity[];
}