================================================================================
  13. LESSON MANAGEMENT  (Educator)
================================================================================

  Properties:
    Title, Description (optional), Week Assignment, Lesson Detail (min 10 words)

--------------------------------------------------------------------------------
  13.1  Concept Extraction
--------------------------------------------------------------------------------

  - Auto-triggered when Lesson Detail of 10+ words is saved for the first time.
  - If lesson content is updated after a concept build already exists, the old
    build stays — educator manually triggers re-extraction when ready.
  - Re-extraction replaces the previous concept build entirely.
  - Runs in background — non-blocking. In-app notification on completion.
  - Feeds only the Assessment Generator for this class.

  WARNING: Re-extracting does not affect assessments already generated from
  the old build. Only new assessments use the updated concept build.

--------------------------------------------------------------------------------
  13.2  Lesson Viewer & Presentation Mode
--------------------------------------------------------------------------------

  Calendar layout by week. Educator can present lesson content directly inside
  the meeting room — all participants follow the forward/backward navigation
  in real time.