EduTool Enrollment & Academic History — Updated Planning

1. ENROLLMENT LIFECYCLE

The enrollment process is divided into:

- Enrollment Application
- Application Approval
- Academic Enrollment
- Section Assignment
- Class Assignment
- Class Enrollment Finalization
- Academic/Class Outcomes
- Permanent Academic History

2. ENROLLMENT APPLICATION

The Admin/Registrar creates an Enrollment Period from a ready School Year.

Enrollment Period contains:

- School Year
- Start Date
- Lock Date
- End Date
- Shareable Enrollment Portal Link
- Section Assignment setting
- Other enrollment-related settings

Section Assignment setting:

- Automatically assign approved students to a section
- Do not assign a section initially; Admin/Registrar assigns it later

The Enrollment Portal is shared with students.

Student process:

- Open shared enrollment portal
- Verify personal Gmail/email
- Complete required forms
- Select Department
- Select Course/Program/Strand, if applicable
- Select Level/Year Level
- Submit application

After submission:

- System generates a unique Enrollment Application Code.
- Registrar/Admin can search the application using the code.
- Student may edit the application until the configured Lock Date.
- After the Lock Date, student editing is locked.
- After the End Date, the enrollment period is closed.

3. APPLICATION APPROVAL

When the Admin/Registrar approves the enrollment application:

- Student record/account is created or activated.
- Student credentials/next-step information are sent to the verified personal Gmail.
- Academic Enrollment is created.
- Program, Department, School Year, Semester, and Level are recorded.
- Section is assigned automatically or left empty depending on the Enrollment Period setting.

IMPORTANT:

Approval creates the student's Academic Enrollment record even if no classes have been assigned yet.

Example:

Academic Enrollment:

- School Year: 2026–2027
- Semester: 1st
- Program: BSCS
- Level: 1
- Section: BSCS 1-A
- Status: ACTIVE

At this point:

Academic Enrollment exists.

Student Class/Subject Enrollment may still be empty.

4. ACADEMIC HISTORY

Academic history begins when the Academic Enrollment is created.

The system should retain the historical Academic Enrollment permanently.

The initial academic-history record may contain:

- Student
- School Year
- Semester
- Department
- Program/Course/Strand
- Level/Year
- Section, if assigned
- Enrollment status
- Other enrollment-level information

Classes do not need to exist yet.

Once class assignment is finalized, Student Class/Subject Enrollment records are added to the corresponding Academic Enrollment.

Example:

Initially:

2026–2027 / 1st Semester
BSCS / Year 1 / Section A

Classes:

- None yet

After class assignment:

2026–2027 / 1st Semester
BSCS / Year 1 / Section A

Classes:

- Mathematics
- Programming 1
- English
- PE
- NSTP

The Academic Enrollment itself is not replaced or recreated.

The class records are added to the existing academic enrollment.

5. SECTION ASSIGNMENT

If automatic section assignment is enabled:

Approved Student
↓
Automatic Section Assignment
↓
Section assigned
↓
Determine applicable class offerings

If automatic section assignment is disabled:

Approved Student
↓
Academic Enrollment created
↓
Section = NULL
↓
Admin/Registrar assigns section later
↓
Determine applicable class offerings

6. CLASS ASSIGNMENT

After the student has a section, the system determines the classes offered to that section.

Example:

BSCS 1-A:

- Mathematics
- Programming 1
- English
- PE
- NSTP

Class assignment has two main paths.

A. NO REVIEW REQUIRED

Student:

- Has no known issue/conflict
- Has no special request
- Is not marked for manual review

The system can automatically assign/finalize all applicable classes.

No class-selection request form is required.

Example:

Student:
BSCS 1-A

Automatically finalized:

- Mathematics
- Programming 1
- English
- PE
- NSTP

The student can see the finalized classes in their account.

This should normally happen before the semester starts for regular on-time students.

B. MANUAL REVIEW REQUIRED

Student:

- Has a special circumstance
- Has a conflict
- Has a class request
- Is marked by Admin/Registrar as requiring review
- Is irregular
- Has another school-defined reason requiring manual review

The student may submit a Class/Subject Request Form.

The request represents what the student wants to take.

It is NOT the final academic decision.

The Admin/Registrar reviews the request.

The Admin/Registrar can:

ACCEPT:

- Accept the requested classes as submitted.

MODIFY:

- Add classes
- Remove classes
- Assign all applicable classes
- Reduce the number of classes
- Change the student's requested classes
- Make another academically appropriate decision

The final Admin/Registrar decision becomes the student's actual Student Class/Subject Enrollment.

7. LATE ENROLLEES

Late enrollment is a timing classification and does not automatically mean the student has an issue.

Students may be:

- ON_TIME + NO REVIEW REQUIRED
- ON_TIME + MANUAL REVIEW REQUIRED
- LATE + NO REVIEW REQUIRED
- LATE + MANUAL REVIEW REQUIRED

Late + No Review Required:

- Student enrolled late.
- No special issue exists.
- Admin/Registrar does not require manual review.
- System can automatically assign applicable classes.

Late + Manual Review Required:

- Student enrolled late.
- Admin/Registrar determines that manual review is needed.
- Admin/Registrar determines the final classes.

The fact that a class has already started does not automatically determine the student's class status.

The Admin/Registrar may decide how the student should be handled according to school policy.

8. CLASS/ACADEMIC OUTCOMES

A Student Class/Subject Enrollment can eventually have an outcome/status such as:

- ENROLLED
- PASSED
- FAILED
- DROPPED
- WITHDRAWN
- WITHDRAWN_DUE_TO_SHIFTING
- TRANSFERRED/CREDITED
- Other school-configured outcome, if supported

The exact terminology/statuses can be configured according to the school's academic policies.

Important:

A student who was never enrolled in a class should not receive a DROPPED or FAILED record.

There should be a distinction between:

NOT ENROLLED:
The student never actually enrolled in the class.

DROPPED:
The student was enrolled and later dropped the class.

WITHDRAWN:
The student was enrolled and later withdrew.

COMPLETED/PASSED:
The student completed the class successfully.

FAILED:
The student completed/attempted the class but received a failing result.

WITHDRAWN_DUE_TO_SHIFTING:
The student was enrolled in the class but the enrollment ended because the student shifted programs.

9. PROGRAM SHIFTING

When a student shifts programs during an academic period:

- The previous Academic Enrollment remains in academic history.
- Previous class enrollments remain in academic history.
- Previous classes are not deleted.
- The student's new program creates/updates the appropriate new Academic Enrollment according to the school's shifting workflow.
- New applicable classes are determined for the new program.

Example:

Previous:

2026–2027 / 1st Semester
BSCS / Year 1 / Section A

- Mathematics
- Programming 1
- English

Student shifts to BSIT.

The previous BSCS academic history remains.

New academic enrollment/class enrollment records are created as appropriate for BSIT.

The previous classes receive their final applicable outcomes.

10. SHIFTING OUTCOME DEFAULT SETTING

The Admin/Registrar can configure a default outcome for classes affected when a student shifts programs before completing the semester.

Example setting:

"Default outcome for abandoned/affected classes when student shifts"

Default:

- DROPPED

Possible configurable options may include:

- DROPPED
- WITHDRAWN
- WITHDRAWN_DUE_TO_SHIFTING
- COMPLETED
- TRANSFERRED/CREDITED
- Other supported outcome

IMPORTANT:

This setting is a DEFAULT/HELPER for Admin/Registrar workflow.

It is NOT a permanent academic rule.

The Admin/Registrar can change this setting at any time.

For example:

Current default:
DROPPED

Later, Admin changes it to:
WITHDRAWN_DUE_TO_SHIFTING

Future shifting cases will use the new default.

Existing historical records that were already finalized as DROPPED remain DROPPED.

Changing the setting must NOT rewrite, recalculate, or modify historical academic records.

11. ADMIN OVERRIDE OF DEFAULTS

Even when a default outcome is configured, the Admin/Registrar should be able to review and override the default for an individual student's case when permitted by the school's rules.

Example:

Default:
DROPPED

Student shifts.

System suggests:

Mathematics → DROPPED
Programming → DROPPED
English → DROPPED

Admin reviews and changes:

Mathematics → WITHDRAWN_DUE_TO_SHIFTING
Programming → TRANSFERRED/CREDITED
English → COMPLETED

The final manually confirmed outcome becomes the permanent historical record.

12. SETTINGS PRINCIPLE

Admin/Registrar settings are workflow defaults and helpers.

They are intended to:

- Reduce repetitive manual work
- Provide sensible default decisions
- Make common enrollment scenarios faster
- Allow the school to configure its preferred workflow

Settings must NOT:

- Rewrite historical records
- Change previously finalized class outcomes
- Change what actually happened in a student's academic history
- Retroactively apply new defaults to old records

Rule:

CONFIGURATION CONTROLS FUTURE WORKFLOW.
HISTORY RECORDS WHAT ACTUALLY HAPPENED.

13. ACADEMIC HISTORY PRINCIPLE

Academic history is permanent.

The system must preserve:

- Previous programs
- Previous academic enrollments
- Previous sections
- Previous classes
- Previous class outcomes
- Previous grades
- Previous shifting events
- Previous withdrawals/drops
- Previous transferred/credited subjects

Changing a student's current program or enrollment status must not erase or rewrite previous academic history.

14. FINAL CONCEPTUAL MODEL

APPLICATION
=
Student's request to enroll in the school.

ACADEMIC ENROLLMENT
=
Official enrollment in a School Year/Semester/Program/Level.

SECTION ASSIGNMENT
=
Assignment of the student to a section.

CLASS OFFERING
=
A class available/offered to a section.

STUDENT CLASS ENROLLMENT
=
The student's actual enrollment in a specific class.

CLASS OUTCOME
=
What ultimately happened to that class enrollment.

ACADEMIC HISTORY
=
Permanent historical record of the student's academic enrollments,
classes, and outcomes over time.

15. OVERALL FLOW

Enrollment Period Created
↓
Student Application
↓
Application Approval
↓
Academic Enrollment Created
↓
Student Account Created
↓
Section Assignment
↓
Determine Offered/Applicable Classes
↓
Check Class Assignment Review Requirement
↓
┌─────────────────────────────┐
│ │
▼ ▼
NO REVIEW REQUIRED MANUAL REVIEW REQUIRED
│ │
▼ ▼
Auto-assign applicable Student Request /
classes Admin Review
│ │
│ ▼
│ Admin Accepts
│ or Modifies
│ │
└──────────────┬──────────────┘
↓
Final Student Class Enrollment
↓
Classes visible to student
↓
Semester activity
↓
Grades / Class Outcomes
↓
Permanent Academic History
