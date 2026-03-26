📦 CLASS MODULE API
1. Create Class

POST /classes
Role: admin

Request Body
{
  subjectId: string;
  educatorId: string;
  sectionId?: string;
  schoolYearId: string;
  semesterId: string;
  capacity: number; // 0 = unlimited
  schedules: {
    weekday: number; // 0-6
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
  }[];
}
Response
{
  id: string;
  subject_id: string;
  educator_id: string;
  section_id: string | null;
  school_year_id: string;
  semester_id: string;
  capacity: number;
  schedules: {
    weekday: number;
    start_time: string;
    end_time: string;
  }[];
}
2. Get Classes (List)

GET /classes
Role: admin, educator

Query Params
{
  schoolYearId?: string;
  semesterId?: string;
  educatorId?: string;
  subjectId?: string;
  sectionId?: string;
}
Response
Class[]
3. Get Single Class

GET /classes/:id

Response
Class
4. Update Class

PATCH /classes/:id
Role: admin

Body
{
  educatorId?: string;
  sectionId?: string;
  capacity?: number;
  schedules?: ScheduleSlot[];
}
Response
Class
5. Archive Class

DELETE /classes/:id
Role: admin

Response
204 No Content
👨‍🎓 ENROLLMENT
6. Enroll Student

POST /classes/:id/enroll

Body
{
  studentId: string;
}
Response (2 possible!)

✅ Normal:

{
  id: string;
  class_id: string;
  student_id: string;
  status: "active";
}

⚠️ Capacity Full:

{
  overflow: true;
  message: string;
  classId: string;
  studentId: string;
}

👉 Frontend MUST handle both cases

7. Get Enrollments

GET /classes/:id/enrollments

Response
{
  id: string;
  student_id: string;
  status: "active" | "pending" | "removed";
}[]
8. Update Enrollment

PATCH /classes/:classId/enrollments/:enrollmentId

Body
{
  status: "active" | "pending" | "removed";
}
Response
{
  id: string;
  status: string;
}
9. Remove Enrollment

DELETE /classes/:classId/enrollments/:enrollmentId

Response
{
  success: true;
}
👨‍🏫 EDUCATOR REASSIGNMENT
10. Reassign Educator

POST /classes/:id/reassign-educator

Body
{
  educatorId: string;
  reason?: string;
}
Response
{
  id: string;
  educator_id: string;
}
11. Ownership History

GET /student/classes/:id/ownership-history ⚠️ (weird route)

👉 NOTE: This is under student controller but roles = admin/educator

Response
{
  id: string;
  fromEducatorId: string;
  toEducatorId: string;
  reason?: string;
  reassignedBy: string;
  createdAt: string;
}[]
👨‍🏫 EDUCATOR VIEW
12. Get My Classes (Educator)

GET /educator/classes

Response
Class[]
🎓 STUDENT VIEW
13. Get My Classes

GET /student/classes

Response
{
  enrollmentId: string;
  enrollmentStatus: string;
  class: {
    id: string;
    subjectId: string;
    subjectName: string | null;
    educatorId: string;
    educatorName: string | null;
    sectionId: string | null;
    schoolYearId: string;
    semesterId: string;
    capacity: number;
    schedules: any[];
  };
}[]
14. Get Single Class (Student)

GET /student/classes/:classId

Response

Same as above (single object)