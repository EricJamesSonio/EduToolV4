================================================================================
  22. SOFT DELETE POLICY
================================================================================

  EduTool uses soft deletion for critical records. No academic data is
  permanently destroyed. Deleted records are flagged with a deleted_at
  timestamp and become invisible in the active UI but remain fully stored
  in the database.

  Soft Delete Applies To:
    - Classes
    - Assessments
    - Lessons
    - Enrollments
    - Meetings

  Behavior:
    - Soft-deleted records do not appear in any active view for any role.
    - Historical grade and score records referencing soft-deleted items
      are preserved and still contribute to transcripts and exports.
    - Raw soft-deleted data is retained in the database for dispute resolution
      or recovery by the Admin with platform-level DB access if needed.

  Hard deletes are never performed on any of the above record types.