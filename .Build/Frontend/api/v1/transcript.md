=========================
TRANSCRIPT (STUDENT)
Base: /student/transcript
=========================
10. GET My Transcript

GET /student/transcript

Roles: student

Response:

[
  {
    "schoolYearId": "uuid",
    "schoolYearName": "string",
    "semesters": [
      {
        "semesterId": "uuid",
        "semesterName": "string",
        "classes": [
          {
            "classId": "uuid",
            "subject": { "name": "string" },
            "educator": "string",
            "termGrades": [...]
          }
        ]
      }
    ]
  }
]
TERM GRADES STRUCTURE
{
  "termId": "uuid",
  "termName": "Prelim",
  "orderIndex": number,
  "finalScore": number | null,
  "finalGrade": string | null,
  "isReleased": boolean
}
🔒 GRADE VISIBILITY RULE (VERY IMPORTANT)
finalGrade is visible ONLY IF is_locked = true

Meaning:

Teacher encoded grade → NOT visible yet
Locked grade → visible to student
IMPORTANT BEHAVIOR
DATA AGGREGATION

Transcript pulls from:

classes
subjects
educator profiles
semesters + terms
grades
GROUPING STRUCTURE

Data is grouped into:

School Year
  → Semester
      → Classes
          → Term Grades
FALLBACK HANDLING

If missing data:

subject → "Unknown Subject"
educator → "Unknown Educator"
semester → "Unknown Semester"
FRONTEND NOTES

Must:

group by school year → semester
sort terms using orderIndex
show:
score immediately
grade ONLY when released

TRANSCRIPT FLOW
Enrollment → Classes → Grades → Transcript

Key rules:

grade visibility controlled by LOCK
structured per academic hierarchy