"use client";

import { HelpCenter, type HelpTopic } from "@/components/shared/help-center/HelpCenter";

const TOPICS: HelpTopic[] = [
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
  return (
    <HelpCenter
      description="Common questions and step-by-step guides for the student portal."
      topics={TOPICS}
    />
  );
}