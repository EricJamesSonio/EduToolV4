================================================================================
  12. STUDENT MANAGEMENT  (Admin)
================================================================================

--------------------------------------------------------------------------------
  12.1  Student Account Status
--------------------------------------------------------------------------------

  Status          Meaning
  -----------     --------------------------------------------------------------
  Active          Normal enrolled student. Can log in, take assessments,
                  attend meetings, view grades.
  Pending         Profile is incomplete or a capacity conflict was unresolved
                  on save. Student has no section assigned yet.
                  Admin must resolve before student can access the system.
  Dropped         Student has dropped out. Account is read-only. Subject
                  enrollments are removed. Transcript preserved. Cannot log in.
  Transferred     Student has transferred to another institution. Same behavior
                  as Dropped — read-only, enrollments removed, transcript kept.
  Suspended       Temporary restriction. Student cannot log in or access
                  classes. Account and enrollments remain intact. Admin lifts
                  suspension to restore Active status.
  Graduated       System-set when student reaches max year level. Read-only.
                  Full transcript accessible. Cannot log in.

  Status Transitions:
    Admin can manually change status at any time, subject to these rules:
      - Dropped / Transferred / Graduated → cannot be reversed to Active
        without a deliberate Admin confirmation step (logged in Audit Log).
      - Suspended → Active: Admin lifts directly.
      - Pending → Active: resolved when Admin assigns a valid section.

  Effect on Enrollment:
    Only Active students can be enrolled in subjects.
    Suspended students retain existing enrollments but cannot access them.
    Dropped / Transferred students are unenrolled from all active classes.
    Graduated students are flagged read-only; classes archive normally.

--------------------------------------------------------------------------------
  12.2  Student Profile
--------------------------------------------------------------------------------

  Dynamic Profile Form:
    Elementary      Grade Level + Section         (Grade 1-6 + Section Name)
    High School     Grade Level + Section         (Grade 7-10 + Section Name)
    Senior High     Grade Level + Strand          (Grade 11-12 + Strand + Section)
    College         Year Level + Course           (1st-Nth Year + Course + Section)
    Custom Program  Year Level + Course/Program   (1st-Nth Year + Program + Section)

  Profile Changes:
    Between semesters only. Manual per student. Handles retakers, shifters,
    irregular students, conditional advancement cases.

  NOTE: Updating a student's profile (Level Section, Year/Grade Level,
        Course/Strand, Section) does NOT automatically change their subject
        enrollments. Admin manages subject enrollment independently.

  Transcript:
    Full grade history across all semesters and school years. Read-only.
    Organized by school year → semester → term → subject.

--------------------------------------------------------------------------------
  12.3  Student Account Search
--------------------------------------------------------------------------------

  Admin can search students by:
    - Student ID  (exact or partial match)
    - Full Name
    - Status  (Active / Pending / Dropped / Transferred / Suspended / Graduated)
    - Level Section / Year Level / Section / Course / Strand / Program  (filters)

  From a student's account view, Admin can:
    - View full profile, Student ID, and current status
    - See all current class enrollments (subject, educator, semester, term)
    - Add a subject enrollment  (see Section 12.4)
    - Remove a subject enrollment  (see Section 12.5)
    - Change account status
    - Edit profile (between semesters)
    - Reset password

--------------------------------------------------------------------------------
  12.4  Adding a Subject Enrollment to a Student  (Admin only)
--------------------------------------------------------------------------------

  Educators cannot enroll students in subjects. Only Admin can.

  Flow:
    Step 1  Admin searches for the student (by Student ID or name).
    Step 2  Admin views the student's current subject/class enrollments.
    Step 3  Admin selects "Add Subject" and searches for the target class
            (by class title, subject, educator, or semester).
    Step 4  System validates:
              - No duplicate enrollment in same subject same semester.
              - Class capacity not exceeded.
              - Student status is Active or resolvable.
    Step 5  Admin confirms. System enrolls the student in the class.
    Step 6  Educator assigned to that class receives a notification:
              "New student [Name] has been added to your class [Class Title]
               by Admin."
    Step 7  If the class has past assessments, educator manually assigns
            status for each one (NULL, Exempted, or Custom Score).
    Step 8  Action is logged in the Admin Audit Log.

  NOTE: Admin takes full responsibility for all subject enrollment decisions.

--------------------------------------------------------------------------------
  12.5  Removing a Subject Enrollment from a Student  (Admin only)
--------------------------------------------------------------------------------

  Flow:
    Step 1  Admin searches for the student.
    Step 2  Admin selects the enrollment to remove.
    Step 3  System warns if the class has existing grades or submissions.
    Step 4  Admin confirms. Student is unenrolled. Removal is soft-deleted
            (record preserved, invisible in active views).
    Step 5  Educator assigned to that class receives a notification:
              "Student [Name] has been removed from your class [Class Title]
               by Admin."
    Step 6  Action is logged in the Admin Audit Log.

  NOTE: Existing submissions and scores are archived, not wiped.

--------------------------------------------------------------------------------
  12.6  Enrollment Validation on Save
--------------------------------------------------------------------------------

  Every time Admin saves a student profile (creation or update), the system
  runs the following check:

  Check — Section Capacity:
    Does the assigned section have space?
      YES → proceed.
      NO  → prompt Admin: create new section or leave student with no section
            (Pending status). See Section 5.4 for section capacity flow.

  Subject enrollment is NOT triggered automatically from profile save.
  Admin manages subject enrollment separately (see Section 12.4).

  All outcomes (section assignments, pending flags) are logged in the
  Admin Audit Log.