"use client";

import { useState } from "react";

const TOPICS = [
  {
    title: "How do I take attendance?",
    content: `Go to your class and click "Attendance" in the sidebar.

## Steps

1. Click the class card from **My Classes**
2. Select "Attendance" from the quick links
3. Pick a week using the navigator arrows
4. Click a session card to open the attendance sheet
5. For each student, tap **Present / Absent / Late / Excused**
6. Click **Save** to record your changes

---

## Tips

- Use **Mark All Present** to quickly set everyone to present, then adjust individual records
- Unsaved changes are tracked — you'll see a count of pending edits at the bottom
- Attendance sessions are automatically generated based on your class schedule`,
  },
  {
    title: "How do I create an assessment?",
    content: `Assessments are built using a 7-step AI-powered wizard.

## Steps

1. Go to your class and click **Assessments**
2. Click **New Assessment**
3. Follow the wizard steps:
   - **Step 1** — Select a lesson with a complete Concept Build
   - **Step 2** — Review the concept sections
   - **Step 3** — Set type (Quiz / Activity / Exam / Custom), term, and total items
   - **Step 4** — Define question ranges and types (Multiple Choice, True/False, Identification, Enumeration, Essay)
   - **Step 5** — Wait for AI to generate questions
   - **Step 6** — Review and edit questions
   - **Step 7** — Set release dates and publish

---

## Notes

- Only lessons with a completed Concept Build (green badge) can be used
- Questions are locked after the release date — edit them before publishing
- You can set a release date and end date, or leave them blank for immediate availability`,
  },
  {
    title: "How do I view and compute grades?",
    content: `Grades shows scores from assessments plus manual categories.

## Steps

1. Go to your class and click **Grades**
2. Switch between **terms** using the tabs at the top
3. Use the two view modes:
   - **Default view** — see every assessment as a column
   - **Clean view** — shows only category summaries
4. Click any manual category cell (Attendance, Recitation, etc.) to enter a score
5. Click **Compute** to recalculate term grades

---

## Notes

- Scores are saved automatically when you press Enter or Tab
- Color coding: ≥90 (green), ≥75 (blue), ≥60 (amber), <60 (red)
- The stats bar shows class average and graded count`,
  },
  {
    title: "How do I lock grades?",
    content: `Locking grades publishes final scores to students and prevents further edits.

## Steps

1. Go to **Grades** in your class
2. Click the active **term tab**
3. Review all scores and click **Compute** to finalize
4. Click **Lock Grades**
5. Confirm the action in the dialog

---

## Notes

- Once locked, grades become read-only for educators
- Students can view their final grades after locking
- An admin can override the lock if needed
- Locking is per-term, not per-class`,
  },
  {
    title: "How do I create a lesson?",
    content: `Lessons hold your teaching material and are used to generate assessments.

## Steps

1. Go to your class and click **Lessons**
2. Click **New Lesson**
3. Fill in the title, description, and lesson detail
4. Assign it to a **week** from the class schedule
5. Click **Save**
6. The system automatically extracts concepts (Concept Build) from your lesson content

---

## Notes

- Concept Build is used by the assessment wizard to generate questions
- If you update the lesson detail, a banner will let you re-extract concepts
- Lessons are organized by week in the calendar view`,
  },
  {
    title: "How do I schedule a meeting?",
    content: `Schedule live video sessions for your class.

## Steps

1. Go to your class and click **Meetings**
2. Click **New Meeting**
3. Enter the title, optional description, and start date/time
4. Choose who to invite:
   - **All enrolled students** (default)
   - **Select specific students** — check the students you want
5. Click **Save Meeting**

---

## Notes

- Students are notified about upcoming meetings
- A meeting is "Live" 15 minutes before the start time
- You can add or remove invited students after creation
- Join requests from uninvited students can be accepted or declined`,
  },
  {
    title: "How do I set up a grading scheme?",
    content: `Grading schemes define how different categories contribute to the final grade.

## Steps

1. Go to your class and click **Grading Scheme**
2. Use the editor to define categories and weight distributions
3. Each category (e.g., Quizzes, Exams, Attendance) gets a percentage weight
4. The total must equal 100%

---

## Notes

- The scheme is locked automatically once the first student is enrolled
- You can also create reusable templates in the **Grading Scheme Library**
- Apply templates to other classes from the library page`,
  },
];

export default function EducatorHelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="container mx-auto max-w-3xl py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Common questions and step-by-step guides for the educator portal.
        </p>
      </div>

      <div className="divide-y divide-border">
        {TOPICS.map((topic, i) => (
          <details
            key={i}
            className="group"
            open={openIndex === i}
            onToggle={(e) => setOpenIndex((e.target as HTMLDetailsElement).open ? i : null)}
          >
            <summary className="flex cursor-pointer items-center gap-3 py-4 text-sm font-medium text-foreground transition-colors hover:text-primary list-none [&::-webkit-details-marker]:hidden">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground group-open:bg-primary group-open:text-primary-foreground transition-colors">
                ?
              </span>
              <span>{topic.title}</span>
              <svg
                className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="pb-6 pl-9">
              <div className="prose prose-sm prose-gray max-w-none text-muted-foreground">
                <RenderContent text={topic.content} />
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function RenderContent({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="pt-2 text-sm font-semibold text-foreground">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("---")) {
          return <hr key={i} className="my-3 border-border" />;
        }
        if (line.startsWith("- **")) {
          const match = line.match(/- \*\*(.+?)\*\*(.*)/);
          if (match) {
            return (
              <p key={i} className="text-sm leading-relaxed">
                <span className="font-medium text-foreground">{match[1]}</span>
                {match[2]}
              </p>
            );
          }
        }
        if (line.startsWith("- ")) {
          return (
            <p key={i} className="text-sm leading-relaxed">
              <span className="mr-1.5 text-muted-foreground">•</span>
              {line.slice(2)}
            </p>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          return (
            <p key={i} className="text-sm leading-relaxed">
              {line}
            </p>
          );
        }
        if (line.trim() === "") {
          return <div key={i} className="h-1" />;
        }
        return (
          <p key={i} className="text-sm leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}
