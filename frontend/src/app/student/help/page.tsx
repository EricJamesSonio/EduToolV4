"use client";

import { useState } from "react";

const TOPICS = [
  {
    title: "How do I view my grades?",
    content: `You can view your term-by-term grades for each class.

## Steps

1. Go to **My Classes** and click the class you want
2. Click **Grades** from the quick links
3. Each term shows a card with your score, letter grade, and a progress bar
4. An overall average card at the top shows your combined performance

---

## Notes

- Grades appear only after the educator locks the grading period
- "Not yet released" means your educator hasn't published final grades yet
- Scores are color-coded: ≥90% (green), ≥75% (blue), <75% (red)`,
  },
  {
    title: "How do I take an assessment?",
    content: `Assessments include quizzes, activities, and exams.

## Steps

1. Go to your class and click **Assessments**
2. Look for an assessment with **Take Assessment** or **Resume** button
3. Answer each question:
   - **Multiple Choice** — tap A, B, C, or D
   - **True/False** — select True or False
   - **Identification** — type your answer in the text box
   - **Enumeration** — fill in numbered items
   - **Essay** — write your response in the text area
4. Use the question grid to jump between questions
5. Flag questions you want to review later
6. Click **Submit** when finished (confirm in the dialog)

---

## Notes

- Progress auto-saves as you go
- A countdown timer shows remaining time
- After submitting, you can view your result with score breakdown
- Essay scores appear after the educator grades them manually`,
  },
  {
    title: "How do I check my assessment results?",
    content: `After submitting, you can view your score and feedback.

## Steps

1. Go to **Assessments** in your class
2. Find the completed assessment
3. Click **View Result**
4. You'll see your score, percentage, and a progress bar
5. If the assessment has essay questions, a notice will say "Pending grading"

---

## Notes

- Scores are official only after the educator publishes them
- You'll see a "Published" confirmation banner once grades are released
- Performance tiers: ≥90% (excellent), ≥75% (passing), <75% (needs improvement)`,
  },
  {
    title: "How do I view my attendance?",
    content: `Check your attendance record for each class.

## Steps

1. Go to your class and click **Attendance**
2. A summary bar shows totals for Present, Absent, Late, Excused, and Unrecorded
3. Below the summary, attendance is grouped by week
4. Each session shows a color-coded status badge

---

## Notes

- Records appear once the educator starts taking attendance
- If you see "Unrecorded", the educator hasn't marked that session yet
- Contact your educator if you believe a record is incorrect`,
  },
  {
    title: "How do I join a meeting?",
    content: `Live video meetings are available from the Meetings page.

## Steps

1. Click **Meetings** in the sidebar
2. Find the meeting you want to join — check the status badge:
   - **Live** — click **Join** to enter the video room
   - **Upcoming** — wait until 15 minutes before start time
   - **Ended** — you can view details but cannot join
3. If you're not invited, click **Request to Join**
4. Wait for the educator to approve your request

---

## Notes

- If you're invited but the meeting isn't live yet, you'll see "Not Live Yet"
- Once inside, you can use mic/camera, chat, raise hand, and react with emojis
- A stable internet connection is recommended for video conferences`,
  },
  {
    title: "How do I view lessons?",
    content: `Access your class materials and lesson content.

## Steps

1. Go to your class and click **Lessons**
2. Lessons are grouped by week in ascending order
3. Click **View** on any lesson to see the full content
4. Use the **Previous** and **Next** buttons to move between lessons

---

## Notes

- Only published lessons are visible to students
- If no lessons appear, the educator hasn't published any yet
- Lesson content may include text, images, and embedded materials`,
  },
  {
    title: "How do I view my transcript?",
    content: `Your academic transcript shows grades across all school years.

## Steps

1. Click **Transcript** in the sidebar
2. School years are shown in an accordion — the active year is expanded by default
3. Within each year, semesters list every subject with scores and letter grades
4. Click the **Print** button to generate a physical copy

---

## Notes

- "Pending" means the grade hasn't been released yet
- "—" means the subject has no grade record
- The print view is optimized for paper output`,
  },
];

export default function StudentHelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="container mx-auto max-w-3xl py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Common questions and step-by-step guides for the student portal.
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
