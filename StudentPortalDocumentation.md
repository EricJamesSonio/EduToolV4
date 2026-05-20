# Student Portal Documentation

## Overview
The Student Portal is a comprehensive learning management system that allows students to view their classes, take assessments, check grades, track attendance, view lessons, join meetings, and access their academic transcript.

## Navigation Structure

### Main Pages

#### My Classes (`/student/classes`)
- **Purpose**: Displays all classes the student is enrolled in
- **Features**:
  - Filter classes by semester (dropdown selector)
  - Shows class cards with subject name, section, schedule, and educator
  - Displays semester and school year information
  - Click on any class card to view class details and quick links
  - Automatically redirects to this page when accessing `/student`

#### Meetings (`/student/meetings`)
- **Purpose**: View and join live video meetings from all enrolled classes
- **Features**:
  - Lists all meetings across all classes grouped by class
  - Shows meeting status badges:
    - **Live** - meeting is currently active (15 min before start to 3 hours after)
    - **Upcoming** - meeting scheduled but not yet live
    - **Ended** - meeting has concluded
  - For invited students:
    - Join button appears when meeting is live
    - "Not Live Yet" button when invited but meeting hasn't started
  - For non-invited students:
    - "Request to Join" button to ask educator for permission
    - "Request Sent" status after request is submitted
  - View Details button for ended meetings

#### Transcript (`/student/transcript`)
- **Purpose**: View academic record across all school years
- **Features**:
  - Accordion-style school year sections (active year expanded by default)
  - School year status badges (active, completed, upcoming)
  - Within each year, semesters show all subjects with:
    - Term-by-term grades
    - Final scores (when released)
    - Letter grades (when released)
  - Grade status badges:
    - **Pending** - grade not yet released by educator
    - **—** - no grade record for subject
    - Letter grade - when released
  - Print button to generate physical copy (print-optimized view)
  - Color-coded scores in table

#### Help Center (`/student/help`)
- **Purpose**: FAQ-style documentation for common student tasks
- **Features**:
  - Accordion-style help topics
  - Step-by-step guides for:
    - Viewing grades
    - Taking assessments
    - Checking assessment results
    - Viewing attendance
    - Joining meetings
    - Viewing lessons
    - Viewing transcript

#### Profile (`/student/profile`)
- **Purpose**: View and edit student profile information
- **Features**: Standard profile management

---

## Class Management

### Class Overview (`/student/classes/[classId]`)
- **Purpose**: Dashboard view for a specific enrolled class
- **Features**:
  - Class information card showing subject, section, schedule, educator, semester, school year
  - Upcoming assessments card (shows next 3 assessments with quick access)
  - Grade summary card (shows overall average and term grades)
  - Quick navigation to all class sections

### Lessons (`/student/classes/[classId]/lessons`)
- **Purpose**: Access lesson materials and content published by educator
- **Features**:
  - Lessons grouped by week in ascending order
  - Shows lesson title and description
  - Only published lessons are visible to students
  - View button to open full lesson content
  - Previous/Next navigation between lessons
  - Lesson content may include text, images, and embedded materials

### Assessments (`/student/classes/[classId]/assessments`)
- **Purpose**: View and take quizzes, activities, exams, and custom assessments
- **Features**:
  - List all assessments with status badges:
    - **Open** - currently available to take
    - **Submitted** - completed, awaiting grading
    - **Graded** - completed and graded
    - **Not Yet Open** - scheduled for future
    - **Missed** - deadline passed without submission
    - **Draft** - in progress (resume available)
    - **Exempted** - student exempt from assessment
  - Shows assessment type, release date, due date, and total items
  - Action buttons based on status:
    - **Take Assessment** - for open assessments
    - **Resume** - for draft/in-progress assessments
    - **View Result** - for submitted/graded assessments
  - Progress auto-saves during assessment
  - Essay questions show "Pending grading" notice until educator grades them

### Attendance (`/student/classes/[classId]/attendance`)
- **Purpose**: View personal attendance record for the class
- **Features**:
  - Summary bar showing totals:
    - Present count
    - Absent count
    - Late count
    - Excused count
    - Unrecorded count
    - Total sessions
  - Detailed table grouped by week
  - Shows session date and status badge
  - Status badges:
    - **Present** (green)
    - **Absent** (red)
    - **Late** (amber)
    - **Excused** (blue)
    - **—** (gray) - unrecorded by educator
  - Records appear once educator starts taking attendance
  - Contact educator if records appear incorrect

### Grades (`/student/classes/[classId]/grades`)
- **Purpose**: View term-by-term grades for the class
- **Features**:
  - Overall average card (shows combined performance across released terms)
  - Term grade cards for each grading period:
    - Shows score percentage and letter grade (when released)
    - Progress bar visualization
    - "Not yet released" status when educator hasn't locked grades
  - Color coding: ≥90% (green), ≥75% (blue), <75% (red)
  - Grades appear only after educator locks the grading period
  - Lock icon indicator for unreleased grades

---

## Key Workflows

### Taking an Assessment
1. Go to class → Assessments
2. Find assessment with "Take Assessment" or "Resume" button
3. Click button to start assessment
4. Answer each question:
   - **Multiple Choice** - tap A, B, C, or D
   - **True/False** - select True or False
   - **Identification** - type answer in text box
   - **Enumeration** - fill in numbered items
   - **Essay** - write response in text area
5. Use question grid to jump between questions
6. Flag questions to review later
7. Click Submit when finished (confirm in dialog)
8. Progress auto-saves as you go
9. Countdown timer shows remaining time
10. After submitting, view result with score breakdown
11. Essay scores appear after educator grades them manually

### Viewing Assessment Results
1. Go to class → Assessments
2. Find completed assessment
3. Click "View Result"
4. See score, percentage, and progress bar
5. If assessment has essays, "Pending grading" notice appears
6. Scores are official only after educator publishes them
7. "Published" confirmation banner appears when grades are released
8. Performance tiers: ≥90% (excellent), ≥75% (passing), <75% (needs improvement)

### Joining a Meeting
1. Click Meetings in sidebar
2. Find meeting you want to join
3. Check status badge:
   - **Live** - click Join to enter video room
   - **Upcoming** - wait until 15 minutes before start time
   - **Ended** - view details only, cannot join
4. If not invited, click "Request to Join"
5. Wait for educator to approve request
6. Once inside, use mic/camera, chat, raise hand, and react with emojis
7. Stable internet connection recommended for video conferences

### Viewing Lessons
1. Go to class → Lessons
2. Lessons grouped by week in ascending order
3. Click "View" on any lesson to see full content
4. Use Previous and Next buttons to move between lessons
5. Only published lessons are visible
6. If no lessons appear, educator hasn't published any yet

---

## Technical Notes

### Role Protection
- All student pages are protected by role guard
- Only users with "student" role can access these pages
- Uses `useRoleGuard(["student"])` hook in layout

### Data Fetching
- Uses React Query (@tanstack/react-query) for data fetching
- Custom hooks for each feature (useStudentClasses, useStudentAssessments, useStudentGrades, etc.)
- Automatic caching and refetching
- Defensive data unwrapping to handle various API response formats

### State Management
- Client-side filtering where appropriate (semester filter in classes)
- Status derivation based on dates and submission state
- Local state for UI interactions (accordions, modals)

### UI Components
- Uses shadcn/ui components (Button, Badge, Progress, Skeleton, etc.)
- Custom components for specific features (ClassCard, MeetingRow, TermGradeCard)
- Lucide React icons throughout
- TailwindCSS for styling
- Responsive grid layouts

### Backend Integration
- API client for backend communication
- RESTful API endpoints
- Axios for HTTP requests
- Toast notifications for user feedback (sonner)

### Assessment Taking
- Auto-save functionality during assessment
- Question grid navigation
- Flagging system for review
- Countdown timer
- Multiple question types supported
- Progress tracking

### Meeting System
- Real-time status calculation (live 15 min before start)
- Join request workflow for non-invited students
- Video room integration
- Meeting status badges with color coding

### Grade Visibility
- Grades only appear after educator locks grading period
- "Not yet released" status for pending grades
- Color-coded score visualization
- Progress bars for visual feedback
- Overall average calculation from released terms only