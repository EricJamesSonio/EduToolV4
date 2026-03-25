=== EDUTOOL — MISSING ENDPOINTS & MODULES ===

------------------------------------------------------------
1. MEETINGS (§19) — ENTIRE FEATURE MISSING
   No module exists under src/modules/
   Need to create: src/modules/meeting/
   
   Missing endpoints:
   POST   /classes/:classId/meetings         (create)
   GET    /classes/:classId/meetings         (get all)
   GET    /classes/:classId/meetings/:id     (get one)
   PATCH  /classes/:classId/meetings/:id     (update)
   DELETE /classes/:classId/meetings/:id     (delete)
   POST   /classes/:classId/meetings/:id/end (educator ends meeting)
   POST   /meetings/:id/join-request         (student sends request)
   PATCH  /meetings/:id/join-request/:reqId  (educator accept/decline)

   Student side:
   GET    /student/classes/:classId/meetings
   GET    /student/classes/:classId/meetings/:id

------------------------------------------------------------
2. GRADE EXPORT / CLASS CARDS (§18) — ENTIRE FEATURE MISSING
   No module exists under src/modules/
   Could live inside: src/modules/grade/ or new src/modules/export/

   Missing endpoints:
   GET  /classes/:classId/export/csv                        (full class CSV — educator/admin)
   GET  /classes/:classId/students/:studentId/card          (PDF class card — educator/admin)

------------------------------------------------------------
3. EDUCATOR SELF-VIEW — MISSING ENDPOINT
   Module exists: src/modules/educator/
   Just missing the endpoint for educator to view their own classes.

   Missing endpoint:
   GET  /educator/classes    (educator sees their assigned classes)

   Note: Students have /student/classes — educators have no equivalent.

------------------------------------------------------------
4. BULK IMPORT CSV TEMPLATE DOWNLOAD (§4.5) — MISSING ENDPOINT
   Module exists: src/modules/student/
   Upload exists: POST /students/import
   Credentials CSV exists: GET /students/credentials-csv
   
   Missing endpoint:
   GET  /students/import-template   (blank CSV template for Admin to fill)

------------------------------------------------------------
5. STUDENT-CENTRIC ENROLLMENT VIEW & REMOVAL (§12.3, §12.4, §12.5)
   Module exists: src/modules/student/ and src/modules/class/
   Class-centric enroll exists: POST /classes/:id/enroll

   Missing endpoints:
   GET    /students/:id/enrollments              (Admin views student's classes from student profile)
   POST   /students/:id/enrollments              (Admin adds subject starting from student profile)
   DELETE /students/:id/enrollments/:enrollmentId (Admin removes student from class with warnings)

------------------------------------------------------------
6. CLASS OWNERSHIP / REASSIGNMENT HISTORY (§10.5) — MISSING ENDPOINT
   Module exists: src/modules/class/
   Reassign endpoint exists: POST /classes/:id/reassign-educator

   Missing endpoint:
   GET  /classes/:id/ownership-history   (full log of educator reassignments with dates/reasons)

------------------------------------------------------------
7. GRADING SCALE ↔ LEVEL SECTION ASSIGNMENT (§17) — MISSING ENDPOINT
   Module exists: src/modules/grading-scale/
   CRUD exists on /grading-scales

   Missing endpoint:
   POST   /grading-scales/:id/assign          (assign scale to a level section)
   GET    /levels/:id/grading-scale           (get the scale assigned to a level section)
   — OR —
   Include levelSectionId in POST/PATCH /grading-scales body and filter GET by it

------------------------------------------------------------
8. ENROLLMENT REMOVAL (§12.5) — MISSING ENDPOINT
   Module exists: src/modules/class/
   PATCH enrollment exists but no DELETE/remove.

   Missing endpoint:
   DELETE /classes/:classId/enrollments/:enrollmentId   (remove student from class)

------------------------------------------------------------
9. AUDIT LOG FILTERS (§23.1) — MISSING QUERY PARAMS
   Module exists: src/modules/audit-log/
   GET /audit-log exists but no filter params documented.

   Needs query params:
   GET /audit-log?date=&actionType=&targetEntityId=&targetType=

=== MODULES THAT NEED TO BE CREATED ===
   src/modules/meeting/         ← biggest missing feature
   src/modules/export/          ← or add to grade module

=== MODULES THAT NEED NEW ENDPOINTS ONLY ===
   src/modules/student/         ← enrollment view/add/remove, import template
   src/modules/class/           ← ownership history, enrollment delete
   src/modules/educator/        ← self classes view
   src/modules/grading-scale/   ← level section assignment
   src/modules/audit-log/       ← filter query params