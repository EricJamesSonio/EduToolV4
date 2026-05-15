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
    -class management - Creates class by selecting an educator to handle it and subject and the week day and time. much easier because the parent already passes the program id, level id, course id , section id, already because level management sits inside the program - level - course - strand
