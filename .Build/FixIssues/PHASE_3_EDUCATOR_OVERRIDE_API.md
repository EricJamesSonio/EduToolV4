Late-Enrollment Grading Status — Phase 3: Educator Override API

Do not start until Phase 2 is confirmed complete.

Goal

Give educators an endpoint to view the effective grading status of each assessment for a given student in a class (with reason), and to override that status where allowed.

This replaces the old inclusion/exclusion model with a status-based model.

Status Model (must align with Phase 2)

Each assessment for a student must resolve to one of:

MISSING → counts as 0
PENDING → assigned but before due date (excluded temporarily)
SUBMITTED → has score
EXEMPTED → excluded completely

Also return:

countsTowardGrade: boolean

Rules:

MISSING and SUBMITTED → countsTowardGrade = true
PENDING and EXEMPTED → countsTowardGrade = false
Endpoints to add

Read backend/src/modules/grade/educator/grade-educator.controller.ts first and match its existing route prefix, guard usage (@Roles, auth guard), and response shape conventions exactly. Do not introduce a new response envelope style.

1. GET status per assessment

GET /grade/educator/classes/:classId/students/:studentId/assessments/status

Returns every assessment for the class with:

assessmentId
title
effectiveDate
status (MISSING | PENDING | SUBMITTED | EXEMPTED)
countsTowardGrade (boolean)
reason (enum from Phase 2, e.g. default_missing, pending, late_enrollment, exempted, override)
If override exists:
overrideId
overrideStatus
overrideReason
overriddenBy
overriddenAt

Adjust route shape to match existing controller conventions — do not invent a new pattern.

2. POST override

POST /grade/educator/classes/:classId/students/:studentId/assessments/:assessmentId/override

Body:

{
"overrideStatus": "EXEMPTED" | "MISSING",
"reason": "optional string"
}

Behavior:

Upsert on (assessment_id, student_id)
created_by = authenticated educator (reuse existing auth pattern)
Must verify:
Educator owns the class
Assessment belongs to class
Student is enrolled (exclude soft-deleted)

Rules:

EXEMPTED → excludes assessment from grading
MISSING → forces inclusion (counts as 0 if no submission)

Do NOT allow overriding to:

PENDING
SUBMITTED

(these are system-driven states)

3. DELETE override

DELETE /grade/educator/classes/:classId/students/:studentId/assessments/:assessmentId/override

Removes override row
Reverts to default Phase 2 status logic
DTOs

Add to backend/src/modules/grade/educator/dto/grade-educator.dto.ts:

SetAssessmentStatusOverrideDto
overrideStatus: 'EXEMPTED' | 'MISSING'
reason?: string

Use existing validation style (class-validator if already used).

Audit logging

Every override create/update/delete must log:

action
entity_type
entity_id
metadata:
{
"assessmentId": "...",
"studentId": "...",
"previousStatus": "...",
"newStatus": "...",
"reason": "..."
}

Follow the exact audit log service pattern from Phase 0.

Verification (required)
Ownership check:
Non-teaching educator must be rejected
Upsert behavior:
Multiple POST calls update same row
Audit log records each change
DELETE behavior:
Status falls back to Phase 2 default
Confirm via GET endpoint before/after
Guardrails
Max 2 retries per failing verification
Do not introduce new role logic beyond existing controller
Follow existing route/response patterns strictly
Completion message

End with:

"Phase 3 complete. Status-based override API verified. Ready for Phase 4 confirmation."
