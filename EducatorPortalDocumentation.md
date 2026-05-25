# Educator Portal Documentation

## Overview
The Educator Portal is a comprehensive teaching management system that allows educators to manage their classes, lessons, assessments, attendance, grades, and meetings in one place.

## Navigation Structure

### Main Pages

#### My Classes (`/educator/classes`)
- **Purpose**: Displays all classes currently assigned to the educator
- **Features**:
  - Shows class cards with subject name, program/course/strand, level, and section
  - Displays schedule, semester, school year, and capacity
  - Click on any class card to view class details and quick links
  - Automatically redirects to this page when accessing `/educator`

#### Activity Log (`/educator/activity-log`)
- **Purpose**: Tracks all actions performed across educator's classes
- **Features**:
  - Filter by class, event type (Create, Update, Delete, Login, Submit, Grade)
  - Filter by date range (from/to dates)
  - Shows timestamp, event type, class, and details
  - Paginated view (25 items per page)
  - Color-coded badges for different event types

#### Grading Scheme Library (`/educator/grading-scheme-library`)
- **Purpose**: Manage reusable grading scheme templates
- **Features**:
  - Create new grading scheme templates
  - Edit existing templates
  - Apply templates to classes
  - Delete templates (local cache only - backend endpoint not yet implemented)
  - Templates are stored in cache until backend exposes template endpoint

#### Help Center (`/educator/help`)
- **Purpose**: FAQ-style documentation for common educator tasks
- **Features**:
  - Accordion-style help topics
  - Step-by-step guides for:
    - Taking attendance
    - Creating assessments
    - Viewing and computing grades
    - Locking grades
    - Creating lessons
    - Scheduling meetings
    - Setting up grading schemes

#### Profile (`/educator/profile`)
- **Purpose**: View and edit educator profile information
- **Features**: Standard profile management

---

## Class Management

### Class Overview (`/educator/classes/[classId]`)
- **Purpose**: Dashboard view for a specific class
- **Features**:
  - Displays class information: subject, program, course/strand, level, section, schedule, capacity, school year
  - Shows active enrollment count
  - Quick links to all class sections:
    - Lessons
    - Assessments
    - Attendance
    - Grades
    - Grading Scheme
    - Meetings

### Lessons (`/educator/classes/[classId]/lessons`)
- **Purpose**: Manage lesson plans and teaching materials
- **Features**:
  - Calendar view organized by weeks
  - Grouped by semester and term
  - Create new lessons
  - Assign lessons to specific weeks
  - Automatic concept extraction from lesson content (Concept Build)
  - Concept Build is used by assessment wizard to generate questions

### Assessments (`/educator/classes/[classId]/assessments`)
- **Purpose**: Create and manage quizzes, activities, exams, and custom assessments
- **Features**:
  - List all assessments with type filter (Quiz, Activity, Exam, Custom)
  - Shows assessment status (Upcoming, Open, Closed)
  - Displays release date, end date, submission count
  - Shows pending essay count requiring manual grading
  - View assessment details
  - View student submissions
  - Delete assessments (removes all submitted scores)
  - Create new assessments via 7-step AI-powered wizard

### Attendance (`/educator/classes/[classId]/attendance`)
- **Purpose**: Track student attendance per session
- **Features**:
  - Sessions automatically generated based on class schedule
  - Grouped by semester and term
  - Week-by-week session cards
  - Shows session date, time, and status (Mark/Upcoming)
  - Click on session to open attendance sheet
  - Mark students as Present, Absent, Late, or Excused
  - "Mark All Present" quick action
  - Tracks unsaved changes

### Grades (`/educator/classes/[classId]/grades`)
- **Purpose**: View and compute student grades
- **Features**:
  - Term-based tabs to switch between grading periods
  - Two view modes:
    - **Default view**: Shows every assessment as a column with detailed breakdown
    - **Clean view**: Shows only category summaries
  - Editable manual category cells (Attendance, Recitation, Participation, Behavior)
  - Automatic save on Enter or Tab
  - Color coding: ≥90 (green), ≥75 (blue), ≥60 (amber), <60 (red)
  - Stats bar showing class average and graded count
  - Compute button to recalculate term grades
  - Lock Grades button to publish final scores (prevents further edits)
  - Locking is per-term, not per-class
  - Admin can override lock if needed

### Grading Scheme (`/educator/classes/[classId]/grading-scheme`)
- **Purpose**: Define how different categories contribute to final grade
- **Features**:
  - Editor to define categories and weight distributions
  - Each category (Quizzes, Exams, Attendance, etc.) gets a percentage weight
  - Total must equal 100%
  - Automatically locks once first student is enrolled
  - Can create reusable templates in Grading Scheme Library

### Meetings (`/educator/classes/[classId]/meetings`)
- **Purpose**: Schedule and manage video sessions
- **Features**:
  - Create new meetings with title, description, and start date/time
  - Invite all enrolled students or select specific students
  - Students notified about upcoming meetings
  - Meeting becomes "Live" 15 minutes before start time
  - Add or remove invited students after creation
  - Accept or decline join requests from uninvited students

---

## Key Workflows

### Creating an Assessment
1. Go to class → Assessments → New Assessment
2. Select a lesson with completed Concept Build (green badge)
3. Review concept sections
4. Set type (Quiz/Activity/Exam/Custom), term, and total items
5. Define question ranges and types (Multiple Choice, True/False, Identification, Enumeration, Essay)
6. Wait for AI to generate questions
7. Review and edit questions
8. Set release dates and publish
9. Questions locked after release date - edit before publishing

### Taking Attendance
1. Go to class → Attendance
2. Select a week using the calendar
3. Click a session card to open attendance sheet
4. For each student, tap Present/Absent/Late/Excused
5. Click Save to record changes
6. Use "Mark All Present" for quick entry

### Computing and Locking Grades
1. Go to class → Grades
2. Select the term tab
3. Review all scores and edit manual categories if needed
4. Click Compute to recalculate term grades
5. Click Lock Grades to publish final scores
6. Confirm the action
7. Once locked, grades become read-only for educators
8. Students can view final grades after locking

### Creating a Lesson
1. Go to class → Lessons → New Lesson
2. Fill in title, description, and lesson detail
3. Assign to a week from class schedule
4. Click Save
5. System automatically extracts concepts (Concept Build)
6. If lesson detail is updated, re-extract concepts using banner prompt

---

## Technical Notes

### Role Protection
- All educator pages are protected by role guard
- Only users with "educator" role can access these pages
- Uses `useRoleGuard(["educator"])` hook in layout

### Data Fetching
- Uses React Query (@tanstack/react-query) for data fetching
- Custom hooks for each feature (useEducatorClasses, useAssessments, useAttendance, etc.)
- Automatic caching and refetching

### State Management
- Client-side filtering for some features (event type in activity log)
- Server-side filtering where available (class, date range)
- Pagination handled client-side for activity log

### UI Components
- Uses shadcn/ui components (Button, Badge, Select, Input, etc.)
- Custom components for specific features (DataTable, WeekCalendar, MeetingCard)
- Lucide React icons throughout
- TailwindCSS for styling

### Backend Integration
- API client for backend communication
- RESTful API endpoints
- Axios for HTTP requests
- Toast notifications for user feedback (sonner)