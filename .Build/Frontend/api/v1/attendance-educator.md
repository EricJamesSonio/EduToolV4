📚 ATTENDANCE API (ADMIN / EDUCATOR)

Base: /classes/:classId/attendance

1. Get Sessions

GET /sessions?weekNumber=

Query
{
  weekNumber?: number;
}
Response
Array<{
  week_number: number;

  sessions: Array<{
    id: string;
    class_id: string;
    date: string;
    week_number: number;
    sub_index: number;
  }>;
}>

👉 grouped by week (important for UI calendar/table)

2. Get Single Session (with records)

GET /sessions/:sessionId

Response
{
  id: string;
  class_id: string;
  date: string;
  week_number: number;
  sub_index: number;

  records: Array<{
    id: string;
    student_id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
  }>;
}
3. Bulk Set Attendance

POST /sessions/:sessionId/records

Request
{
  records: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
  }>;
}
Response
{
  message: string; // "Attendance saved."
  count: number;   // number of records processed
}
4. Update Single Record

PATCH /sessions/:sessionId/records/:recordId

Request
{
  status: 'present' | 'absent' | 'late' | 'excused';
}
Response
{
  id: string;
  student_id: string;
  status: string;
}