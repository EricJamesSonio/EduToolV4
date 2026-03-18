================================================================================
  14. ASSESSMENT MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  14.1  Question Types
--------------------------------------------------------------------------------

  Type              AI Generated    Auto-Graded    Notes
  ----------------  --------------  -------------  ----------------------------
  Multiple Choice   Yes             Yes            Checked on submission
  True or False     Yes             Yes            Checked on submission
  Identification    Yes             Yes            Checked on submission
  Enumeration       Yes             Yes            Checked on submission
  Essay             Yes             No             AI generates question.
                                                   Educator manually grades.

--------------------------------------------------------------------------------
  14.2  Assessment Dates
--------------------------------------------------------------------------------

  Release Date    Before this, students see title only — questions hidden.
  End Date        Submission deadline. Assessment auto-closes.

--------------------------------------------------------------------------------
  14.3  Template Configuration & Generation Flow
--------------------------------------------------------------------------------

  Step 1  Select lesson. If no concept build exists, lesson is blocked.

  Step 2  Concept build displays sections and available item counts:
            e.g.  Stack: 5 | Queue: 6 | Binary Tree: 4 | Linear Data: 5
                  Total available: 20 items

  Step 3  Set type (Quiz / Activity / Exam / Custom) and total items.
          System validates — cannot exceed concept build total.

  Step 4  Build item ranges. Each range:
            - Item span (e.g. 1-10)
            - One question type
            - One or more concept sections to fulfill the count
          If one section can't fulfill the range, add more until met.

  Step 5  Generation runs in background — non-blocking.
  Step 6  In-app notification when complete.
  Step 7  Set release date, end date, assign to students.

  Example:
    Range       Type            Sections Used                   Valid?
    ---------   --------------  ------------------------------  --------
    Items 1-10  Identification  Stack(5)+Queue(4)+Arrays(1)=10  OK
    Items 11-15 Enumeration     Queue(6 avail, 5 needed)        OK
    Items 16-20 True or False   Binary Tree(4)+Linear(5), 5 needed  OK
    Item 21     Essay           Remaining concepts              OK

--------------------------------------------------------------------------------
  14.4  Editing Generated Questions
--------------------------------------------------------------------------------

  - Educator can edit any AI-generated question before the release date.
  - Editable: question text, answer choices (MC), correct answer.
  - Essay question text is editable just like other types.
  - Once the release date passes, questions lock — no further edits.

--------------------------------------------------------------------------------
  14.5  Student Assignment & Status
--------------------------------------------------------------------------------

  Status          Meaning
  -----------     --------------------------------------------------------------
  NULL (default)  Not assigned. Treated as missed. Educator can override.
  Exempted        Excused. Excluded from grade calc. Counts as perfect score.
  Custom Score    Educator manually sets a score. Status = Customized.
  Submitted       Submitted within deadline. Feeds grade computation.
  Draft           Opened, not submitted. Auto-saved. Can resume before end date.

  - Partial submissions allowed. Auto-saves on disconnect.
  - Late student additions: educator manually assigns status for each past
    assessment the student missed.

--------------------------------------------------------------------------------
  14.6  Assessment Attempt Control
--------------------------------------------------------------------------------

  Each student may have only one active attempt per assessment at any time.

  When a student opens an assessment:
    - An attempt record is created with status = Active.
    - All auto-save progress is stored under this attempt.

  If the same student opens the assessment from another tab or device:
    - System detects the existing Active attempt.
    - The existing attempt is resumed — no new attempt created.
    - Previous progress is restored exactly where left off.

  This prevents multiple simultaneous tab attempts, multiple device attempts,
  and accidental duplicate submissions.

  On submission: attempt status is set to Submitted. No further access.
  On end date:   all Draft attempts are closed automatically.

--------------------------------------------------------------------------------
  14.7  Score Publishing
--------------------------------------------------------------------------------

  Scores hidden by default. Educator publishes when ready.

  Publish to all      All assigned students see their score at once.
  Publish selected    Only specific students' scores become visible.
  Unpublish           Educator can hide scores again after publishing.
  Default state       Always hidden until explicitly published.

  On grade lock:
    ALL unpublished scores are automatically published when grades are locked.
    Students see final grade + every individual score simultaneously.

--------------------------------------------------------------------------------
  14.8  Assessment Deletion
--------------------------------------------------------------------------------

  WARNING: Deleting an assessment after students have submitted wipes all
  scores. Final grade recomputes without it.
  Assessment is soft-deleted — removed from active UI but preserved in DB.