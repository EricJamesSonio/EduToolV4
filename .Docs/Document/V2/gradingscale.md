================================================================================
  17. GRADING SCALE CONFIGURATION  (Admin)
================================================================================

  Per level section. Each section can use a completely different scale.

  Property          Details
  ----------------  ------------------------------------------------------------
  Score Range       Percentage range (e.g. 97-100)
  Grade Value       Value for that range (e.g. 1.00, A, Outstanding)
  Remark            Label (e.g. Passed, Failed, Incomplete)
  Passing Threshold Minimum score considered passing
  Validation        Ranges must cover 0-100 fully, no gaps or overlaps

  Lock behavior:
    Grading scale is editable at the start of each school year.
    Once the FIRST grade in that level section is locked for that school year,
    the scale locks for the remainder of the year.
    It unlocks again automatically at the start of the next school year.

  College Scale Example (1.0-5.0 Philippine Style):
    97-100 = 1.00 Passed  |  94-96 = 1.25 Passed  |  91-93 = 1.50 Passed
    88-90  = 1.75 Passed  |  85-87 = 2.00 Passed  |  82-84 = 2.25 Passed
    79-81  = 2.50 Passed  |  76-78 = 2.75 Passed  |  75    = 3.00 Passed
    65-74  = 5.00 Failed  |  Below 65 = INC Incomplete
    Passing threshold: 75

  Elementary Scale Example (Descriptive):
    90-100 = Outstanding Passed       |  85-89 = Very Satisfactory Passed
    80-84  = Satisfactory Passed      |  75-79 = Fairly Satisfactory Passed
    Below 75 = Did Not Meet Expectations Failed
    Passing threshold: 75