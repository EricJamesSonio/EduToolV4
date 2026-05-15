Main features

School managament

- creates one school org per admin
- email extensions (keeping the unique accounts and org scoped only so the unique will be the email extensions)
  - email extension is required before creating any accounts so will be validation that says in student and educator that cannot create account becuase the email extension is not yet set in the organization
  - email extensions should be upgraded into having for example base as "@cmi.com" now when creates student account "@cmi.student.com" and if educator then its "@cmi.educator.com" so that it's unique between educator and student account because there's some cases that the account email of student is the same of the educator within the org
- act as the organization . scoped all the acounts created within here.

School year management

- contains all the programs (college, jhs, shs etc)
- Highest layer
- start and end date of the school year (the semester , grading, weeks classes etc. depends on this )

Program management

- crud program
- type (college, shs, jhs, elementary, daycare etc)
- The base layer
- if the program has course or strand then automatically has creation of those and management.

Program (type 1, doesnt have course or strand ex. Elementary)

- Subject management
  - Creation of subjects such as major and minor
  - minor subject is not course or strand scoped, its just level scoped . the reason behind it is the minor subject is can be linked or shared across different course like BSCS 1 and BSBA 1 can have PE since its just a minor subject. And in programs that doesnt have course or strand it's just easily all level 1 can have it. just that .

Level management:

- Level management
  - add and remove of levels but just increment and decrement
- Section management
  - creation of section by input name of the section and student capacity (capacity of this tells the count of student that can be enroll in this program - level- sections like BSCS 1-B only 30 students allowed. unless modified and update the capacity)
- class management
  - Creates class by selecting an educator to handle it and subject and the week day and time. much easier because the parent already passes the program id, level id, course id , section id, already because level management sits inside the program - level - course - strand

Section management:

- capacity
- enroll students in here for example this is the section A of BSCS 1 so automatically the students enroll in here will be enrolled in BSCS 1-A . so the parents passes down the props to the child

grade lock management:

- Sets the date and time for the grades to be lock to notify the educators that they should have already completed the gradings before this set time. once the set time is done it will automatically locked.

grading-scheme mangement:

- global reusable scheme that can be use in different school years. just if the program type matches it.
- for example created "Standard scheme College" then set the program type to be college, then this will be only reusable in different school years as long as the program type is college.
- have collection of global schemes to be assigned to the programs of the school yearss.
- Selector of school year thne it will dispaly all the progams and show which program doesnt have schemes yet so that we can apply , so in applying only show in modal the schemes that matches that program type
- validation in the schemes .
- basically the grading system of the educators depends on this but the educator can manually modify it its just the base form that the admin will provide but the educator will handle it

grading--scale management:

- global reusable scale that can be use in different school yeasr, just if the program type matches it the sam with the grading scheme.
- just have valid scaling
- again this is just the base form , and the educator can still have its own grading scale to be use and modify

semester setting template:

- global reusable semester tempaltes
- can be use in different school years as long as the program type matches it

student managemnet:

- create student account , block, update the status, edit creadentials , reset password
- view details

educator management:

- creats educator account , suispend, update the status, edit credentatils, reset password
