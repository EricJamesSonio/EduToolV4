📊 ANALYTICS API (ADMIN)
1. Overview

GET /analytics/overview

Response
{
  totalStudents: number;
  activeStudents: number;
  pendingStudents: number;
  totalEducators: number;
  totalClasses: number;
}
2. Enrollment Breakdown

GET /analytics/enrollment

Response
{
  byStatus: {
    [status: string]: number;
  };
}
3. Grade Analytics

GET /analytics/grades?classId=&termId=

Response
{
  passingRate: number; // 0–1
  distribution: {
    [grade: string]: number;
  };
}
4. Educator Load

GET /analytics/educators

Response (inferred)
Array<{
  educatorId: string;
  classCount: number;
  studentCount: number;
}>
5. Alerts

GET /analytics/alerts

Response
{
  pendingStudents: number;
  unlockedClasses: number;
}