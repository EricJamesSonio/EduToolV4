================================================================================
  4. PLATFORM & ACCOUNT PROVISIONING
================================================================================

--------------------------------------------------------------------------------
  4.1  School Onboarding Flow
--------------------------------------------------------------------------------

  Step 1  School negotiates with the platform owner (us).
  Step 2  Platform owner manually creates one Admin account for the school.
  Step 3  Admin logs in and creates their Organization — setting the name
          and description at this point.
  Step 4  Org is active. Admin begins configuring level defaults, school years,
          and creating educator and student accounts.

  NOTE: One org per Admin account. Prevents account reuse across schools and
        ensures each school has a clean, isolated environment.

  Organization Fields:
    - Name
    - Description

--------------------------------------------------------------------------------
  4.2  Account Creation by Admin
--------------------------------------------------------------------------------

Admin creates all accounts. No self-registration. Credentials system-generated
(10 characters).

  Educator Account Fields:
    - Full Name
    - Email (school-provided Gmail)
    (System auto-generates an Educator ID on creation)

  Student Account Fields:
    - Full Name
    - Email (school-provided Gmail)
    - Student ID  (Admin-assigned, unique within org)
    - Level Section  (Elementary / High School / Senior High / College /
                      any custom program added by Admin)
    - Grade/Year Level  (based on level section)
    - Section  (from org's existing sections for that grade/year level)
    - Strand  —  if Senior High (from org's existing strands)
    - Course  —  if College or custom program (from org's existing courses)

  On Save — Enrollment Validation:
    When Admin saves a student's profile (on creation or update), the system
    immediately runs capacity and enrollment checks. See Section 12.5 for the
    full validation flow.

  NOTE: The student form is fully dynamic. Selecting a Level Section reveals
        the correct fields. Section, Strand, and Course dropdowns show only
        what exists in the org — no hardcoded options.

  NOTE: Students are NOT automatically assigned subjects by their section.
        Section is an organizational grouping only. Subject enrollment is
        managed independently. See Section 11 for details.

--------------------------------------------------------------------------------
  4.3  Password Management
--------------------------------------------------------------------------------

  Reset scope       All educator accounts  |  All student accounts
                    Both  |  Selected specific accounts

  Effect            New password generated. Previous password stops working
                    immediately.

  Use case          Admin resets -> distributes new CSV -> accounts
                    inaccessible until new credentials received.
                    Acts as an access control mechanism.

  User control      Educators and students cannot change their own passwords.
                    Only Admin can reset them.

--------------------------------------------------------------------------------
  4.4  Credential Distribution
--------------------------------------------------------------------------------

  Format      CSV bulk download — all accounts at once
  Columns     Full Name, Student ID / Educator ID, Email, Generated Password,
              Level Section, Section, Course/Strand, Year/Grade Level,
              Account Status
  Delivery    Admin distributes externally (print, email, hand out)

--------------------------------------------------------------------------------
  4.5  Bulk Student Import
--------------------------------------------------------------------------------

  For large schools (1,000+ students), Admin can import student accounts in
  bulk via CSV upload instead of creating accounts one by one.

  CSV Template Columns:
    Full Name, Student ID, Email, Level Section, Grade/Year Level,
    Section, Strand (if Senior High), Course (if College or custom program)

  Import Flow:
    Step 1  Admin downloads the blank CSV template from the system.
    Step 2  Admin fills in student data externally (spreadsheet editor).
    Step 3  Admin uploads the completed CSV.
    Step 4  System validates each row:
              - Required fields present (Full Name, Student ID, Email,
                Level Section, Grade/Year Level)
              - Student ID unique within org
              - Email unique within org
              - Level Section, Grade/Year Level, Section, Strand/Course
                values exist in the org's structure
    Step 5  Validation report shown before any accounts are created:
              - Valid rows: count and preview
              - Error rows: listed with reason (e.g. "Student ID 2024-001
                already exists", "Section 'Narra' not found for Grade 7")
    Step 6  Admin can:
              - Fix errors externally and re-upload
              - Proceed with valid rows only, skipping error rows
    Step 7  System creates accounts for all valid rows.
            System-generated passwords assigned. Credentials available
            for download as CSV immediately after import.
    Step 8  Section capacity checks run per imported student. Capacity
            conflicts surface as Pending students for Admin to resolve
            after import. (Subject enrollment is handled separately
            by Admin after accounts are created.)

  NOTE: Bulk import creates student accounts only. Educator accounts must
        still be created individually as educator roles require more
        deliberate assignment review.

  NOTE: Bulk import does not bypass any validation rules. Section capacity
        and duplicate checks still apply per student.