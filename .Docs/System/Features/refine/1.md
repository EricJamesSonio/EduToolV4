EDUTOOL SYSTEM DOCUMENTATION
=================================================

SYSTEM OVERVIEW
-------------------------------------------------
EduTool is an academic management system used by
three main user roles:

1. Admin
2. Educators
3. Students

The system manages:
- Departments
- Semesters
- Classes
- Schedules
- Lessons
- Assessments
- Grades
- Meetings

Admins handle the structural setup of the school,
while educators manage teaching-related activities.


=================================================
USER ROLES
=================================================

1. ADMIN
-------------------------------------------------
Represents the school administrator or head.

Responsibilities:
- Manage semesters
- Manage departments
- Manage educators
- Create classes
- Assign educators to classes
- Build schedules
- Manage level sections (Elementary, High School, College)

Admins can only manage their own school and cannot
see data from other schools.


2. EDUCATORS
-------------------------------------------------
Teachers who manage their assigned classes.

Responsibilities:
- Manage lessons
- Generate assessments
- Manage grades
- Conduct meetings
- Track student performance


3. STUDENTS
-------------------------------------------------
Students join classes and participate in learning.

Responsibilities:
- Attend classes
- Take assessments
- View lessons
- View grades
- Join meetings



=================================================
LEVEL SECTION MANAGEMENT (ADMIN)
=================================================

Admins can create education level sections.

Examples:
- Elementary Level
- High School Level
- College Level

Each level section contains:

- Year levels
- Departments
- Semester configuration

Example:

College Level
    Year Levels
        - 1st Year
        - 2nd Year
        - 3rd Year
        - 4th Year



=================================================
SEMESTER MANAGEMENT (ADMIN)
=================================================

Semesters are reusable configurations that define
the academic time period.

Multiple semester settings can exist.

Example Semester Setting:

Title: Main Semester Setting

1st Semester
Start Date: August 12
End Date: December 18

2nd Semester
Start Date: January 4
End Date: March 16


Alternative Setting Example:

Title: Alternative Semester Setting

1st Semester
Start Date: June 14
End Date: November 14

2nd Semester
Start Date: December 12
End Date: February 12

3rd Semester
Start Date: February 20
End Date: April 20


Rules:
- Semesters must NOT overlap
- Maximum allowed semesters per setting: 3
- Semesters are editable
- Departments select which semester setting they use



=================================================
DEPARTMENT MANAGEMENT (ADMIN)
=================================================

Departments represent academic programs.

Examples:
- BSCS
- BSBA
- BSA
- BSHM

Department Object Structure

Title
Description
Maximum Year Level
Semester Setting
Educators List
Subjects List
Schedules


Example Department:

Title: BSCS
Description: Bachelor of Science in Computer Science
Max Year Level: 4

Subjects (sorted by year)

1st Year
- Data Structure
- Programming 1
- Computer 1

2nd Year
- OOP
- Algorithms

3rd Year
- Research
- Parallel Computing

4th Year
- Thesis
- IT Review



=================================================
SUBJECT MANAGEMENT
=================================================

Subjects belong to departments and year levels.

Subject Properties:

Title
Description
Assigned Educator
Applicable Year Level
Weekday
Time Schedule

Example Subject Entry:

Data Structure
1st Year
Educator: Eric James
Monday
7:00 AM - 10:00 AM



=================================================
SCHEDULE MANAGEMENT
=================================================

Schedules are automatically generated based on
created classes and subject assignments.

Conflict checks include:

1. Time Overlap
Two subjects cannot occur at the same time.

2. Educator Conflict
An educator cannot teach two classes at the same time.

Example Weekly Schedule

Monday
Data Structure
Eric James
7:00 AM - 11:00 AM

Tuesday
Programming 1
Jay Entilleso
12:00 PM - 3:00 PM

Wednesday
Computer 1
RJ Diaz
7:00 AM - 11:00 AM

Thursday
P.E
Eric James
3:00 PM - 5:00 PM

Friday
Test
Sam Smit
8:00 AM - 12:00 PM

Each year level has its own schedule.



=================================================
CLASS MANAGEMENT
=================================================

Classes are created by Admin and assigned to educators.

Class Properties

Title
Applicable Year Level
Course / Department
Semester
Capacity
Weekdays
Time
Assigned Educator


Example:

Title: Data Structure Class A
Year Level: 1st Year
Course: BSCS
Semester: 1st
Weekday: Monday
Time: 7:00 AM - 11:00 AM
Educator: Eric James



=================================================
WEEK COMPUTATION
=================================================

Weeks are computed automatically based on the
semester date range.

Example:

If class meets twice per week:

Week 1
    Week 1.1 (Monday)
    Week 1.2 (Friday)

Week 2
    Week 2.1
    Week 2.2



=================================================
STUDENT MANAGEMENT
=================================================

Students create their own accounts.

Admins do NOT manually create students.

When adding students to a class:

The system filters students automatically by:

- Course
- Year Level

Example:

Class: BSCS 1st Year

Only students with:
Course = BSCS
Year = 1

will appear in the selection.



=================================================
LESSON MANAGEMENT
=================================================

Lessons are scoped inside a class.

Lesson Properties

Title
Description (optional)
Week Assignment
Lesson Detail (optional)

Lesson Detail Requirements:

- Minimum 10 words
- Used for AI concept extraction


Concept Extraction

When lesson detail is provided:
The system automatically extracts learning concepts.

This process runs in the background and continues
even if the user leaves the page.

Notifications are shown when extraction completes.



=================================================
LESSON VIEWER
=================================================

Lessons are displayed using a calendar view.

Example:

January 2
Week 1
Lesson: Data Structure

January 7
Week 2
Lesson: None

Multiple lessons can exist in one week.



=================================================
ASSESSMENT GENERATOR
=================================================

Assessments are automatically generated from lessons.

Steps:

1. Select Lesson
2. Check if concept extraction exists
3. Choose Assessment Template
4. Configure Assessment


Assessment Configuration

Type
- Quiz
- Activity
- Exam
- Custom

Number of Items

Sections
Example:

1-10 Data Structure


Validation Rules

- Number of items cannot exceed concept capacity
- Section must have enough generated questions


Generation Process

Assessment generation runs in the background.

Users receive notifications when completed.

Assessments can also be cancelled during generation.



=================================================
ASSESSMENT ASSIGNMENT
=================================================

After generation:

Educator selects students to assign.

Options:
- Assign to all students
- Assign manually

Unassigned students default status:

NULL (considered missed)

Educator can change status:

Exempted
Perfect score

Custom Score
Manual grade entry



=================================================
GRADE MANAGEMENT
=================================================

Grades are computed using global rubric settings.

Example Rubric

Activities: 20%
Quizzes: 20%
Exams: 30%
Behavior: 30%

Behavior is manually graded by educators.

Grades update automatically when:

- Assessment submitted
- Score modified
- New assessment created


Grade Display Modes

1. Clean View
Grouped categories

Activities
Quizzes
Exams

2. Excel View
Detailed list of all assessments.



=================================================
MEETING MANAGEMENT
=================================================

Educators can create class meetings.

Meeting Properties

Title
Description
Start Date
Start Time
Invited Students


Invitation Options

Invite All Students
Select Students


Meeting Behavior

Invited students receive notifications.

Students not invited may request to join.



=================================================
GLOBAL ACCOUNT SYSTEM
=================================================

Students and educators create their own accounts.

Admins do not create accounts manually.

The system only manages permissions and access.



=================================================
SYSTEM SUMMARY
=================================================

Admin Responsibilities
- Manage semesters
- Manage departments
- Create classes
- Assign educators
- Build schedules

Educator Responsibilities
- Manage lessons
- Generate assessments
- Grade students
- Host meetings

Student Responsibilities
- Join classes
- View lessons
- Take assessments
- View grades
- Attend meetings