Organization page

default:

- if the user doesn't have school org yet, it will ask it first to create one.
- input the school name, description.

- manage the email extension in here, can be update. as long as no accounts where created yet. and also if the new email extenssion is unique. detected by the backend

Extra feature:
Data seeder

Steps:

- Creates school year

ex. SChool year 2026-2027

- Select program from the seeds available
  ex. selected "College"

- Modify the levels, course and strand if has, sections, capacity of sections etc.
  ex.
  Base level 4 (means All courses will inherit this )
  Selected courses : BSCS, BSBA
  Modified sections : A , B (In this seeding all courses level will inherit this )

resulting to : BSCS 1-4 has all A,B sections, same with BSBA.

- Select subjects from the provided seed (major and minor)
  ex.
  Selected "Data structure 1 (major), OOP 2 (major), PE 1 (Minor) for BSCS
  resulting to : - BSCS 1 has Subject Data structure 1 and PE becuase both of them are applicable for college 1 - BSCS 2 only has OOP

- select grading scheme
  ex.
  Selected Grading scheme : standard college
  quiz : 25 %
  exam : 25 %
  act : 25 %
  behavior : 25 %
  total 100 %

Set to (College)

resulting to : All college courses such as BSCS and BSBA will be having this grading scheme (program scope)

- Note: can be modified later when seeded

* select grading scale
  ex.
  Selected grading scale : standard college
  1.0 : Perfect
  1.5 : excellent
  2.0 : Good
  2.5 : Better
  3.0 : Not bad
  5.0 : Bad

set to (college)

Resulting to : All college courses will be having this grading scale (program scoped)

- Select semester setting template:
  Ex.
  Selected semester template : standard college
  1st semester: - pre lim - midterm - pre final - final
  2nd semester: - pre lim - mid term - pre final - final

set to (college)

resulting to : College will be following this semester template so all courses also. since this is program scoped
