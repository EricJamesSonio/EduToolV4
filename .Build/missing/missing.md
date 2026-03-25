=== EDUTOOL — MISSING ENDPOINTS & MODULES (updated 03/25/2026) ===

------------------------------------------------------------
STATUS KEY:  ✅ Done   🔧 In Progress   ❌ Missing
------------------------------------------------------------

❌ 1. MEETINGS (§19) — ENTIRE FEATURE MISSING
   No module exists under src/modules/
   Need to create: src/modules/meeting/

   Missing endpoints:
   POST   /classes/:classId/meetings              (create)
   GET    /classes/:classId/meetings              (get all)
   GET    /classes/:classId/meetings/:id          (get one)
   PATCH  /classes/:classId/meetings/:id          (update)
   DELETE /classes/:classId/meetings/:id          (delete)
   POST   /classes/:classId/meetings/:id/end      (educator ends meeting)
   POST   /meetings/:id/join-request              (student sends request)
   PATCH  /meetings/:id/join-request/:reqId       (educator accept/decline)

   Student side:
   GET    /student/classes/:classId/meetings
   GET    /student/classes/:classId/meetings/:id

------------------------------------------------------------
❌ 2. GRADE EXPORT / CLASS CARDS (§18) — ENTIRE FEATURE MISSING
   No module exists under src/modules/
   Could live inside: src/modules/grade/ or new src/modules/export/

   Missing endpoints:
   GET  /classes/:classId/export/csv                    (full class CSV — educator/admin)
   GET  /classes/:classId/students/:studentId/card      (PDF class card — educator/admin)

------------------------------------------------------------
✅ 3. EDUCATOR SELF-VIEW — DONE
   Added: GET /educator/classes
   Lives in: class.controller.ts → EducatorClassController
   Service method: getEducatorClasses(educatorId, orgId)

------------------------------------------------------------
❌ 4. BULK IMPORT CSV TEMPLATE DOWNLOAD (§4.5)
   Module exists: src/modules/student/
   Upload exists:           POST /students/import       ✅
   Credentials CSV exists:  GET  /students/credentials-csv  ✅

   Still missing:
   GET  /students/import-template   (blank CSV template for Admin to fill)

------------------------------------------------------------
❌ 5. STUDENT-CENTRIC ENROLLMENT VIEW & REMOVAL (§12.3, §12.4, §12.5)
   Module exists: src/modules/student/
   Class-centric enroll exists: POST /classes/:id/enroll  ✅

   Still missing:
   GET    /students/:id/enrollments                       (Admin views student's classes)
   POST   /students/:id/enrollments                       (Admin adds subject from student profile)
   DELETE /students/:id/enrollments/:enrollmentId         (Admin removes student from class)

------------------------------------------------------------
❌ 6. CLASS OWNERSHIP / REASSIGNMENT HISTORY (§10.5)
   Module exists: src/modules/class/
   Reassign endpoint exists: POST /classes/:id/reassign-educator  ✅

   Still missing:
   GET  /classes/:id/ownership-history   (log of educator reassignments with dates/reasons)

------------------------------------------------------------
❌ 7. GRADING SCALE ↔ LEVEL SECTION ASSIGNMENT (§17)
   Module exists: src/modules/grading-scale/
   CRUD exists on /grading-scales  ✅

   Still missing:
   POST  /grading-scales/:id/assign    (assign scale to a level section)
   GET   /levels/:id/grading-scale     (get the scale for a level section)
   — OR include levelSectionId in POST/PATCH body and filter GET by it

------------------------------------------------------------
✅ 8. ENROLLMENT REMOVAL — DONE
   Added: DELETE /classes/:classId/enrollments/:enrollmentId
   Service method: removeEnrollment(classId, enrollmentId, orgId)
   Repo method:    removeEnrollment(enrollmentId) → sets status = 'removed'

------------------------------------------------------------
❌ 9. AUDIT LOG FILTERS (§23.1)
   Module exists: src/modules/audit-log/
   GET /audit-log exists  ✅

   Still missing query params:
   GET /audit-log?date=&actionType=&targetEntityId=&targetType=

------------------------------------------------------------

=== SUMMARY ===

✅ Done (2/9):
   #3  Educator self-view (GET /educator/classes)
   #8  Enrollment removal (DELETE /classes/:classId/enrollments/:enrollmentId)

❌ Still missing (7/9):
   #1  Meetings module         ← biggest, needs new module
   #2  Grade export module     ← needs new module or extend grade module
   #4  CSV import template     ← one endpoint in student module
   #5  Student enrollments     ← 3 endpoints in student module
   #6  Ownership history       ← 1 endpoint in class module
   #7  Grading scale assign    ← 2 endpoints in grading-scale/level modules
   #9  Audit log filters       ← query params on existing endpoint

=== MODULES THAT NEED TO BE CREATED ===
   src/modules/meeting/    ← #1
   src/modules/export/     ← #2 (or extend grade module)

=== MODULES THAT NEED NEW ENDPOINTS ONLY ===
   src/modules/student/        ← #4, #5
   src/modules/class/          ← #6
   src/modules/grading-scale/  ← #7
   src/modules/level/          ← #7
   src/modules/audit-log/      ← #9