Levels of authority

1. Admin (School head/The one who manages the schedules, classes and educators etc.)
2. Educators (teachers etc. the one handling the classes and students ., gradings, teaching. etc.)
3. Students (Students joing the classes to have grades take assessments etc.)

# Admin level authority
* Level section components.
    - Semester setting (reusable)
    - Departments (BSBA, BSCS, BSA , BSHM etc.)

* Create level sections.
    Ex.
        Elementry level 
            - Inside is the year levels.

        Highschool level
        College level

# Department (admin)
* components:
    - yr level
    - subjects
    - course
    - List of educators

notes:
    - Subject management. 
        ex. Creating subject and assigning it to it's correct assigned level. and educator who handles that subject and also the weekday and time. (Validate first before allowing , check for conflict the system)
            Data structure - 1st yr - Eric James - monday - 7am - 10am
            Analgor  - 2nd yr - Jay entilleso - wednesday - 2pm -4pm
            Parallel - 3rd yr - Rj Diaz - tuesday - 1pm -5pm
            Thesis - 4th yr - Eric james - thursday - 7am -10am

Schedule management:
    * Since we have now the list of subjects and the educators that handles it. now we will create astrict and safe schedule. VAlidatign and checking for conflict. for example, theres a subject conflict like, 2 subject ares in the same time, or got overlapping time, its bad. and also if the educator handles 2 subject at the same time in schedule, its conflci since educator is cannot go in 2 different class atthje same time.

    * Monday   Tuesday          Wednesday  Thursday 
    data structure | parallel | analgor     | thesis
    - eric james   | rj diaz  | jay entileso| eric james
    - 7am - 11am   | 1pm - 5pm| 2-pm -4pm   | 7am - 10am
            * This autoamticall created based on the subject's weekday and time set when creating a subject.
            * so every create of subject, builds this schedule viewer
            * if admin wants to change the time and weekday of the subject, it clicked the subject in here. then edit the weekday and time

    Weekdays schedule!
    - jsut select subject since the subject alreay contains the educator that handles it so we dont need to input the educator there, its automatically fetch from the educator component of the subject
    
# Semester management (admin)
- List of semester sinc ewe allowed semester to be reusable since some levels have same semester curriculum sometimes. like senior high and college has same 2 semester etc.
- Create Semester
    - Title :
    - Description (optional)
    - Semesters :
        * 1st semester
        * 2nd semester

    - each semester has its own start date and end date.
    - validayte, they shouldn't overlapp, creates conflict. checks it.