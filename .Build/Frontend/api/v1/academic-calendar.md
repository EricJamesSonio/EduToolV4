📦 ACADEMIC CALENDAR API
1. Create Event

POST /academic-calendar
🔒 admin only

Request
{
  schoolYearId: string;
  title: string;
  type: 'holiday' | 'no_class_day' | 'exam_week' | 'special_event';
  startDate: string; // ISO
  endDate: string;   // ISO
  description?: string;
}
Response
{
  id: string;
  schoolYearId: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  description?: string;

  warning: string | null; // ⚠️ important for UI banner
}
2. Get Events

GET /academic-calendar?schoolYearId=uuid

Response
Array<{
  id: string;
  schoolYearId: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  description?: string;
}>
3. Update Event

PATCH /academic-calendar/:id

Request
{
  title?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}
Response
{
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  description?: string;

  warning: string | null;
}
4. Delete Event

DELETE /academic-calendar/:id

Response
// 204 No Content