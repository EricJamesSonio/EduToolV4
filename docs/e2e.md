# EduToolV4 – End‑to‑End Flow (Normal Path)

## 1. Admin – Create Organization

1. **Login as super‑admin** (or a user with `org:create` permission).
2. Navigate to **“Organizations” → “New Organization”**.
3. Fill in:
   - **Name** – e.g., _Green Valley School District_
   - **Slug** – auto‑generated, e.g., `green-valley-school-district`
   - **Timezone** – select the district’s timezone.
4. Click **“Create Org”**.
5. System redirects to the **Org Dashboard** and displays a success toast:  
   _“Organization ‘Green Valley School District’ created successfully.”_

> **Result:** The org now exists with a default empty configuration and an auto‑generated API key (visible only once).

---

## 2. Admin – Create School Profile

1. Still on the **Org Dashboard**, select **“Add School”**.
2. Provide school details:
   - **Name** – e.g., _Green Valley Primary_
   - **Address** – street, city, state, postal code.
   - **Principal name** – optional but recommended.
   - **Phone / Email** – contact info.
   - **Timezone** – usually matches the org’s timezone.
3. Click **“Create School”**.
4. The new school appears in the **Schools list** under the organization.

> **Result:** The school is now linked to the org and has a unique `schoolId`.

---

## 3. Seed – School Year

1. In the **Org Dashboard**, open the **“School Years”** tab.
2. Click **“Seed New School Year”**.
3. The system prompts for:
   - **Year label** – e.g., `2025‑2026`
   - **Start date** – first day of classes (e.g., `2025‑08‑15`).
   - **End date** – last day of classes (e.g., `2026‑06‑05`).
4. Confirm.
5. The new school year appears in the list with status **“Draft”**.

> **Result:** The school year is created and can now be activated for the selected school.

---

## 4. Admin – Create Department

1. Navigate to **School → Departments** (within the just‑created school).
2. Click **“Add Department”**.
3. Fill in:
   - **Name** – e.g., _Mathematics_
   - **Code** – optional short code, e.g., `MTH`.
   - **Year level** – e.g., `Grade 5`.
4. Click **“Create Department”**.
5. Department shows up in the list; a success message confirms creation.

> **Result:** The department is now associated with the school and the active school year.

---

## 5. Enroll Student

### 5.1. Admin / Staff enrollment

1. Go to **School → Students** → **“Add Student”**.
2. Enter student information:
   - **First name**, **Last name**
   - **Date of birth**
   - **Grade / Year level** (must match a department’s year level).
   - **Email** (optional, for login).
   - **Parent/guardian contact** – name and email.
3. Assign the student to a **Department** (e.g., Mathematics).
4. Click **“Enroll Student”**.

5. The student appears in the **Students list** with a generated temporary password and a “ pending activation” status.

### 5.2. Student self‑registration (optional)

1. The student receives an invitation email with a **unique registration link**.
2. Clicking the link opens the **Student Sign‑up** page.
3. Set a personal password and confirm the account.
4. The student is now linked to the same department and school year.

> **Result:** The student can now log in, view assigned courses, and start submitting work.

---

## 6. Educator – Create Course & Assign Grading Workflow

### 6.1. Educator onboarding

1. An educator receives an invitation email (or signs up with school credentials).
2. After login, the educator is assigned to at least one **Department**.

### 6.2. Create a Course

1. Educator goes to **My Courses → “Add Course”**.
2. Fill in:
   - **Course name** – e.g., _Algebra 101_
   - **Department** – pre‑selected based on educator’s assignment.
   - **School year** – the active year (2025‑2026).
   - **Course code** – optional, e.g., `ALG101`.
   - **Credits / Hours** – optional.
3. Click **“Create Course”**.

The course appears in the educator’s course list and is linked to the department.

### 6.3. Enroll Students in the Course

1. In the course detail page, open **“Enroll Students”**.
2. Check the boxes next to the students who should belong to this course (e.g., all Grade‑5 Mathematics students).
3. Click **“Enroll Selected”**.

Each enrolled student now sees the course in their dashboard.

### 6.4. Grading Workflow (per assignment)

1. Educator creates an **Assignment**:
   - **Title** – e.g., _Week 3 Quiz_
   - **Due date** – e.g., `2025‑09‑10`.
   - **Max points** – e.g., `10`.
   - **Rubric** (optional).

2. Students submit their work (upload file or inline text) before the due date.

3. When the deadline passes, the educator navigates to **“Grading”** for the assignment.
4. For each student:
   - Review the submission.
   - Enter a **score** (0‑10) and optional **feedback comments**.
   - Click **“Save Grade”**.

5. The system automatically calculates the student’s **percentage** and updates the **gradebook**.

> **Result:** Educator can track progress, generate reports, and provide feedback efficiently.

---

## 7. Student – Submit Work & View Grades

### 7.1. Submitting an Assignment

1. Student logs in and selects the course **Algebra 101**.
2. Clicks **“Assignments”** → the Week 3 Quiz card.
3. Clicks **“Submit”** and either:
   - Uploads a file (PDF, DOCX, etc.), or
   - Types/ pastes a response in the editor.
4. Clicks **“Submit”** again to confirm.

A toast confirms: _“Submission received – 2025‑09‑08 14:32”_.

### 7.2. Viewing Grades

1. After the educator publishes grades, the student returns to the assignment page.
2. The score and feedback are displayed.
3. The student can also view the ** overall gradebook** under **My Progress**, showing all course scores and current GPA (if configured).

> **Result:** Students stay informed about their performance and can request clarification from the educator.

---

## 8. End‑of‑School‑Year Process

1. **Admin** opens **School Years** and selects the active year (2025‑2026).
2. Clicks **“Close School Year”**.
3. The system prompts for:
   - **Finalize grades** – ensure all assignments have grades entered.
   - **Generate report cards** – optional one‑click PDF generation for each student.
   - **Archive data** – marks the year as “Closed”; historical data remains read‑only.

4. System runs a **validation check**:
   - All required assignments must have a grade.
   - No missing submissions for required courses.

5. If validation passes, the year status changes to **“Closed”** and a **summary report** is displayed:
   - Total students, courses completed, average grades, pass/fail counts.

6. Educators and students can still **view** closed‑year data, but no new submissions or grade edits are allowed (read‑only).

7. **Admin** may **seed a new school year** (step 3) to start a fresh cycle.

> **Result:** The academic year is cleanly wrapped up, report cards are produced, and the system is ready for the next term.

---

## 9. Summary Checklist (for reference)

| Step | Actor           | Key Action                      | Expected Outcome                                         |
| ---- | --------------- | ------------------------------- | -------------------------------------------------------- |
| 1    | Admin           | Create Org                      | Org exists with default settings                         |
| 2    | Admin           | Create School                   | School linked to org                                     |
| 3    | Admin           | Seed School Year                | Year record created (draft)                              |
| 4    | Admin           | Create Department               | Department attached to school & year                     |
| 5    | Admin / Student | Enroll Student                  | Student account active, assigned to department           |
| 6    | Educator        | Create Course + Enroll Students | Course appears, students can submit                      |
| 7    | Educator        | Assign & Grade Assignments      | Grades stored in gradebook                               |
| 8    | Student         | Submit work & view grades       | Feedback visible immediately                             |
| 9    | Admin           | Close School Year               | Year locked, report cards generated, ready for next year |

---

### How to use this file

- **Copy** the markdown above into a new file (e.g., `docs/e2e-flow.md`).
- Adjust institution‑specific names, dates, or UI labels to match your actual deployment.
- Share the file with new team members, training docs, or as a quick reference during onboarding.

---

_End of E2E flow documentation._
