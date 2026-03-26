🎓 ATTENDANCE (STUDENT)

Base: /student/classes/:classId/attendance

1. Get My Attendance

GET /

Response
{
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    unrecorded: number;
  };

  sessions: Array<{
    sessionId: string;
    date: string;
    weekNumber: number;
    subIndex: number;

    status: 'present' | 'absent' | 'late' | 'excused' | null;
    // null = not yet recorded
  }>;
}