=========================
GRADE LOCK MODULE
Base: /grade-lock
=========================
6. CREATE Grade Lock Setting

POST /grade-lock/settings

Roles: admin

Request:
{
"schoolYearId": "uuid",
"lockDeadline": "ISO date string"
}

Response:
{
"id": "uuid",
"schoolYearId": "uuid",
"lockDeadline": "date"
}

Notes:

Defines deadline for all classes in a school year
Store this globally in frontend state if needed
7. GET Grade Lock Setting

GET /grade-lock/settings?schoolYearId=uuid

Response:
{
"schoolYearId": "uuid",
"lockDeadline": "date"
}

Error:

400 if schoolYearId missing

Notes:

Use to show countdown / deadline warning in UI
8. LOCK Class Grades

POST /grade-lock/:classId/lock

Roles: educator

Response:
{
"success": true
}

Effects:

Publishes grades
Locks grading scale
Prevents further edits

Errors:

Not owner
Deadline passed
Already locked

Notes:

After locking:
disable ALL editing UI
enable student grade visibility
This is the "final submit" action
9. UNLOCK Class Grades

POST /grade-lock/:classId/unlock

Roles: admin

Response:
{
"success": true
}

Notes:

Re-enables editing
Should be restricted in UI (admin only)
10. GET Class Locks

GET /grade-lock/classes

Roles: admin

Response:
[
{
"classId": "uuid",
"isLocked": boolean,
"lockedBy": "uuid | system",
"lockedAt": "date"
}
]

Notes:

Useful for admin dashboard
Can display lock status per class

Teacher workflow:
Input scores → Compute grades → Review → Lock grades
Lock = critical state:
Enables student visibility
Disables ALL grade edits
Freezes grading scale
Frontend must handle:
NULL values (not computed / not released)
Locked vs unlocked UI states
Manual vs computed scores
Key UI States:
Draft → Computed → Locked (Final)