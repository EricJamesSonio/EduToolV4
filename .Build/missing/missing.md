=== EDUTOOL — MISSING ENDPOINTS & MODULES (updated 03/25/2026) ===

------------------------------------------------------------
STATUS KEY:  ✅ Done   ❌ Missing
------------------------------------------------------------

✅ 3. EDUCATOR SELF-VIEW — DONE
   GET /educator/classes
   Lives in: class.controller.ts → EducatorClassController
   Service: getEducatorClasses(educatorId, orgId)
   Repo:    findActiveClassesByEducator() — already existed

✅ 4. CSV IMPORT TEMPLATE — DONE
   GET /students/import-template
   Lives in: student.controller.ts
   Service: getImportTemplate() — already existed

✅ 5. STUDENT-CENTRIC ENROLLMENTS — DONE
   GET    /students/:id/enrollments
   POST   /students/:id/enrollments
   DELETE /students/:id/enrollments/:enrollmentId
   Lives in: student.controller.ts + student.service.ts
   New repo methods added: findEnrollments, findEnrollmentById, removeEnrollment
   New DTO added: AddEnrollmentDto

✅ 8. ENROLLMENT REMOVAL — DONE
   DELETE /classes/:classId/enrollments/:enrollmentId
   Lives in: class.controller.ts
   Service: removeEnrollment(classId, enrollmentId, orgId)
   Repo:    removeEnrollment(enrollmentId) → status = 'removed'

✅ 9. AUDIT LOG FILTERS — DONE (was already implemented)
   GET /audit-log?from=&to=&action=&entityType=&entityId=&actorId=
   GET /activity-log?classId=&from=&to=
   DTO, service, and repo already had full filter support

------------------------------------------------------------

❌ 6. CLASS OWNERSHIP / REASSIGNMENT HISTORY (§10.5)
   Module exists: src/modules/class/
   Reassign endpoint exists: POST /classes/:id/reassign-educator ✅

   Needs new Prisma model:
   model ClassOwnershipLog {
     id              String   @id @default(uuid())
     org_id          String
     class_id        String
     from_educator_id String
     to_educator_id   String
     reason          String?
     reassigned_at   DateTime @default(now())
     reassigned_by   String   // adminId

     class Class @relation(fields: [class_id], references: [id])
   }

   Missing endpoint:
   GET /classes/:id/ownership-history

   Files to touch:
   - schema.prisma              ← add ClassOwnershipLog model
   - class.repository.ts        ← add createOwnershipLog + findOwnershipHistory
   - class.service.ts           ← write log on reassignEducator + new getOwnershipHistory
   - class.controller.ts        ← add GET :id/ownership-history route

------------------------------------------------------------

❌ 7. GRADING SCALE ↔ LEVEL SECTION ASSIGNMENT (§17)
   Module exists: src/modules/grading-scale/
   CRUD exists on /grading-scales ✅

   Schema check — GradingScale already has level_id:
   model GradingScale {
     level_id       String   ← this IS the link to level section
     school_year_id String
     ...
   }

   So no new table needed. What IS missing:
   - GET /grading-scales?levelId= filter  (get scale for a level)
   - GET /levels/:id/grading-scale        (get scale from level side)

   Files to touch:
   - grading-scale.controller.ts   ← add levelId query param to GET
   - grading-scale.service.ts      ← pass levelId filter through
   - grading-scale.repository.ts   ← add levelId to findAll filter
   - level.controller.ts           ← add GET :id/grading-scale route
   - level.service.ts              ← add getGradingScale(levelId, orgId)

------------------------------------------------------------

❌ 2. GRADE EXPORT / CLASS CARDS (§18) — NEW MODULE NEEDED
   No module exists under src/modules/

   No new Prisma model needed — reads from existing:
   Grade, Enrollment, Assessment, Submission, Rubric, Class, Profile

   Need to install: pdfkit (PDF generation)
   npm install pdfkit
   npm install --save-dev @types/pdfkit

   Missing endpoints:
   GET /classes/:classId/export/csv         (full class grades CSV)
   GET /classes/:classId/students/:studentId/card  (PDF class card)

   Files to create:
   - src/modules/export/export.module.ts
   - src/modules/export/export.controller.ts
   - src/modules/export/export.service.ts

------------------------------------------------------------

❌ 1. MEETINGS (§19) — NEW MODULE NEEDED
   No module exists under src/modules/

   Needs new Prisma models:
   model Meeting {
     id           String    @id @default(uuid())
     org_id       String
     class_id     String
     educator_id  String
     title        String
     description  String?
     start_time   DateTime
     status       String    // scheduled | active | ended
     created_at   DateTime  @default(now())
     deleted_at   DateTime?

     class        Class     @relation(fields: [class_id], references: [id])
     invites      MeetingInvite[]
     join_requests MeetingJoinRequest[]
   }

   model MeetingInvite {
     id         String @id @default(uuid())
     org_id     String
     meeting_id String
     student_id String

     meeting Meeting @relation(fields: [meeting_id], references: [id])
   }

   model MeetingJoinRequest {
     id         String   @id @default(uuid())
     org_id     String
     meeting_id String
     student_id String
     status     String   // pending | accepted | declined
     created_at DateTime @default(now())

     meeting Meeting @relation(fields: [meeting_id], references: [id])
   }

   Missing endpoints:
   POST   /classes/:classId/meetings
   GET    /classes/:classId/meetings
   GET    /classes/:classId/meetings/:id
   PATCH  /classes/:classId/meetings/:id
   DELETE /classes/:classId/meetings/:id
   POST   /classes/:classId/meetings/:id/end
   POST   /meetings/:id/join-request
   PATCH  /meetings/:id/join-request/:reqId
   GET    /student/classes/:classId/meetings
   GET    /student/classes/:classId/meetings/:id

   Files to create:
   - src/modules/meeting/meeting.module.ts
   - src/modules/meeting/meeting.controller.ts
   - src/modules/meeting/meeting.service.ts
   - src/modules/meeting/meeting.repository.ts
   - src/modules/meeting/dto/meeting.dto.ts
   - src/modules/meeting/entity/meeting.entity.ts

------------------------------------------------------------

=== SUMMARY ===

✅ Done (5/9):
   #3  Educator self-view
   #4  CSV import template
   #5  Student-centric enrollments
   #8  Enrollment removal
   #9  Audit log filters

❌ Remaining (4/9):
   #6  Ownership history    ← next, schema change + 4 file touches
   #7  Grading scale assign ← no schema change, 5 file touches
   #2  Grade export         ← new module, needs pdfkit
   #1  Meetings             ← largest, new module + 3 schema models

=== RECOMMENDED ORDER ===
   Do #6 next  → small schema change, contained to class module
   Then #7     → zero schema change, just filter wiring
   Then #2     → new module, no schema change
   Do #1 last  → schema changes + full new module