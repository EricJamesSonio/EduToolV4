# SEED DATA PLAN
> Reflects the actual `org-seeder` implementation as coded.

---

## 1. PROGRAMS

Six programs are available. Admin picks which to activate during onboarding.

| Key         | Name                    | Type        |
|-------------|-------------------------|-------------|
| `daycare`   | Daycare / Pre-School    | `daycare`   |
| `kinder`    | Kindergarten            | `kinder`    |
| `elementary`| Elementary School       | `elementary`|
| `jhs`       | Junior High School      | `jhs`       |
| `shs`       | Senior High School      | `shs`       |
| `college`   | College / University    | `college`   |

> IDs are deterministic: `seed-prog-{key}-{orgId}`

---

## 2. LEVELS & SECTIONS (per program)

### Daycare
| Level     | Sections            | Capacity |
|-----------|---------------------|----------|
| Daycare 1 | Section A, Section B | 40 each |
| Daycare 2 | Section A, Section B | 40 each |

### Kinder
| Level    | Sections             | Capacity |
|----------|----------------------|----------|
| Kinder 1 | Section A, Section B | 30 each  |
| Kinder 2 | Section A, Section B | 30 each  |

### Elementary
Grades 1–6, each with 3 sections (A/B/C), capacity 40.

### Junior High School
Grades 7–10, each with 3 sections (A/B/C), capacity 40.

### Senior High School
One level per **grade × strand** combination (20 levels total = 10 strands × 2 grades).
Format: `Grade {11|12} – {StrandName}`, 3 sections (A/B/C), capacity 40.

Strands: `ABM`, `STEM`, `HUMSS`, `GAS`, `ICT`, `HE`, `IA`, `Agri-Fishery`, `Sports`, `Arts and Design`

### College
One level per **course × year** combination.
Format: `{CODE} – {Year Label}`, 3 sections (A/B/C), capacity 50.

| Code     | Name                              | Years |
|----------|-----------------------------------|-------|
| BSIT     | BS Information Technology         | 4     |
| BSBA     | BS Business Administration        | 4     |
| BSED     | Bachelor of Secondary Education   | 4     |
| BSA      | BS Accountancy                    | 5     |
| BSCS     | BS Computer Science               | 4     |
| BSHM     | BS Hospitality Management         | 4     |
| BSCRIM   | BS Criminology                    | 4     |
| BSTM     | BS Tourism Management             | 4     |

Year labels: `1st Year`, `2nd Year`, `3rd Year`, `4th Year`, `5th Year`

> IDs are deterministic: `seed-level-{programKey}-{levelName}-{orgId}` (spaces → dashes)
> Section IDs: `seed-section-{levelKey}-{sectionName}-{orgId}`

---

## 3. COURSES (College only)

All 8 COLLEGE_COURSES above are seeded, plus BSED majors as separate course entries:

| Code        | Name                        |
|-------------|-----------------------------|
| BSED-ENG    | BSED – English Major        |
| BSED-MATH   | BSED – Mathematics Major    |
| BSED-SCI    | BSED – Science Major        |
| BSED-SS     | BSED – Social Studies Major |
| BSED-FIL    | BSED – Filipino Major       |
| BSED-TLE    | BSED – TLE Major            |

> ID: `seed-course-{code}-{orgId}`

---

## 4. STRANDS (SHS only)

10 strands seeded under the SHS program:

`ABM`, `STEM`, `HUMSS`, `GAS`, `ICT`, `HE`, `IA`, `Agri-Fishery`, `Sports`, `Arts and Design`

> ID: `seed-strand-{name-dasherized}-{orgId}`

---

## 5. GRADING SCALES (per level)

| Program      | Level(s)               | Scale Name                      |
|--------------|------------------------|---------------------------------|
| Daycare      | Daycare 1, Daycare 2   | Pass/Fail Scale                 |
| Kinder       | Kinder 1, Kinder 2     | Pass/Fail Scale                 |
| Elementary   | Grade 1–6              | K-12 Scale                      |
| JHS          | Grade 7–10             | K-12 Scale                      |
| SHS          | All Grade 11/12 levels | K-12 Scale                      |
| College      | All course/year levels | College Numeric Scale (1.0–5.0) |

### Pass/Fail Scale
| Min | Max | Label    |
|-----|-----|----------|
| 75  | 100 | P – Pass |
| 0   | 74  | F – Fail |

### K-12 Scale
| Min | Max | Label                      |
|-----|-----|----------------------------|
| 90  | 100 | Outstanding                |
| 85  | 89  | Very Satisfactory          |
| 80  | 84  | Satisfactory               |
| 75  | 79  | Fairly Satisfactory        |
| 0   | 74  | Did Not Meet Expectations  |

### College Numeric Scale (1.0–5.0)
| Min | Max | Label                   |
|-----|-----|-------------------------|
| 97  | 100 | 1.0 – Excellent         |
| 93  | 96  | 1.25 – Very Good        |
| 89  | 92  | 1.5 – Very Good         |
| 85  | 88  | 1.75 – Good             |
| 82  | 84  | 2.0 – Good              |
| 78  | 81  | 2.25 – Satisfactory     |
| 75  | 77  | 2.5 – Satisfactory      |
| 70  | 74  | 2.75 – Passing          |
| 65  | 69  | 3.0 – Passing           |
| 55  | 64  | 4.0 – Conditional Fail  |
| 0   | 54  | 5.0 – Fail              |

> ID: `seed-scale-{levelName}-{scaleName}-{orgId}` (spaces → dashes)

---

## 6. GRADING SCHEMES

Six scheme presets are seeded org-wide (not tied to a specific level/class).
`is_default: false` — admin assigns them to classes manually.

### Daycare Scheme
| Component          | Type       | Weight |
|--------------------|------------|--------|
| Play and Activities| activity   | 40%    |
| Participation      | manual     | 30%    |
| Behavior           | manual     | 20%    |
| Health and Hygiene | manual     | 10%    |

### Kindergarten Scheme
| Component  | Type     | Weight |
|------------|----------|--------|
| Quizzes    | quiz     | 20%    |
| Activities | activity | 30%    |
| Behavior   | manual   | 20%    |
| Projects   | activity | 30%    |

### Elementary Scheme
| Component  | Type     | Weight |
|------------|----------|--------|
| Quizzes    | quiz     | 25%    |
| Activities | activity | 25%    |
| Behavior   | manual   | 20%    |
| Projects   | activity | 20%    |
| Exams      | exam     | 10%    |

### High School Scheme (JHS)
| Component  | Type     | Weight |
|------------|----------|--------|
| Quizzes    | quiz     | 20%    |
| Activities | activity | 20%    |
| Behavior   | manual   | 20%    |
| Exams      | exam     | 40%    |

### Senior High School Scheme
| Component  | Type     | Weight |
|------------|----------|--------|
| Quizzes    | quiz     | 20%    |
| Activities | activity | 20%    |
| Behavior   | manual   | 10%    |
| Projects   | activity | 10%    |
| Exams      | exam     | 40%    |

### College Scheme
| Component  | Type     | Weight |
|------------|----------|--------|
| Quizzes    | quiz     | 20%    |
| Activities | activity | 20%    |
| Behavior   | manual   | 20%    |
| Exams      | exam     | 40%    |

> Scheme ID: `seed-scheme-{name-dasherized}-{orgId}`
> Component IDs: `uuid()` (random)
> Duplicate check: `findFirst({ org_id, name })` — skipped if already exists.

---

## 7. SUBJECTS

Subjects are seeded per program. Each subject links to a `level_id`, and optionally a `course_id` or `strand_id`. Prerequisites are seeded in a separate pass after all subjects exist.

### Daycare
6 learning areas × 2 levels = 12 subjects. `Daycare 2` subjects carry a prerequisite pointing to the matching `Daycare 1` area.

Learning areas: Language and Literacy, Cognitive and Numeracy Skills, Physical Development Health and Safety, Social and Emotional Development, Creative Arts and Music, Understanding the World / Discovery

### Kinder
6 learning areas × 2 levels = 12 subjects. `Kinder 2` subjects prerequisite the matching `Kinder 1` area.

Learning areas: Language Literacy and Communication, Mathematical Thinking, Physical Development Health and Safety, Social and Emotional Development / Values Formation, Creative Arts, Understanding the World / Discovery

### Elementary (Grades 1–6)
7 subjects per grade × 6 grades = 42 subjects.
Subjects: English, Mathematics, Science, Filipino, Araling Panlipunan, MAPEH, Edukasyon sa Pagpapakatao (ESP)
Core academic subjects carry a same-name prerequisite from the prior grade (Grade 2+). MAPEH and ESP have no prerequisites.

### JHS (Grades 7–10)
8 subjects per grade × 4 grades = 32 subjects.
Same as Elementary plus `TLE`. All carry grade-chain prerequisites except MAPEH and ESP.

### SHS
Per strand, per grade: **strand major subjects + SHS minor (core) subjects**.

**SHS Minor (shared across all strands):**
- Grade 11: Oral Communication, Reading and Writing Skills, Mathematics in the Modern World, Understanding the Self, Contemporary World, Readings in Philippine History, Physical Education / Health, Life and Works of Jose Rizal
- Grade 12: NSTP, Art Appreciation, Physical Education / Health

**SHS Major subjects** are strand-specific (see strands.data / shs.subjects.ts for full list per strand: ABM, STEM, HUMSS, GAS, ICT, HE, IA, Agri-Fishery, Sports, Arts and Design).

### College
Two layers per course:

1. **GE subjects** (shared across all courses, seeded per course level):
   Mathematics in the Modern World, Purposive Communication, Understanding the Self, Readings in Philippine History, The Contemporary World, Life and Works of Jose Rizal, PE 1 & 2, Ethics, Art Appreciation, Science Technology and Society, NSTP 1 & 2

2. **Major subjects** (course-specific, see college.subjects.ts):
   BSIT (14 subjects), BSBA (16), BSA (16), BSCS (19), BSHM (17), BSCRIM (15), BSTM (14). BSED uses shared BSED Core (11 subjects).

> Subject IDs: `seed-subj-{levelName}-{courseCode|none}-{strandName|none}-{name}-{orgId}` truncated to 100 chars.
> Duplicate check: `findFirst({ org_id, name, level_id, course_id, strand_id })` — skipped if exists.

---

## 8. PREREQUISITES

Seeded in a second pass after all subjects are inserted.
Prerequisite names are resolved by name lookup against `subjectNameToId` map.
Trailing parenthetical suffixes are stripped before lookup (e.g. `"English (Grade 1)"` → `"English"`).

> Uses `upsert` on `{ subject_id, prerequisite_id }` unique key — safe to re-run.
> IDs: `uuid()` (random)

---

## SEED EXECUTION ORDER

```
seedPrograms()
  → seedCourses()          (college only)
  → seedStrands()          (shs only)
  → seedLevelsAndSections()
  → seedGradingScales()
  → seedGradingSchemes()   (org-wide, all presets)
  → seedSubjects()
  → seedPrerequisites()    (second pass, name → id resolution)
```

---

## ONBOARDING SELECTION (OrgSeedOptions)

```ts
interface OrgSeedOptions {
  orgId:    string
  programs: string[]  // subset of: ['daycare','kinder','elementary','jhs','shs','college']
}
```

Only records belonging to selected programs are seeded. Unselected programs are fully skipped. All seed operations use `upsert` or `findFirst`-guard — safe to re-run without duplicates.