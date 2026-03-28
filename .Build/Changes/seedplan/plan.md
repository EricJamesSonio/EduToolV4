SEED DATA VERIFICATION
======================
Checking your files against the seed plan checklist.


✅ = complete
⚠️  = partial / needs clarification
❌ = missing


════════════════════════════════════════
1. PROGRAMS
════════════════════════════════════════
✅ College / University       type: "college"
✅ Senior High School         type: "shs"
✅ Junior High School         type: "jhs"
✅ Elementary                 type: "elementary"
✅ Daycare / Pre-School       type: "daycare"

→ All programs covered. Good.


════════════════════════════════════════
2. LEVELS (per program)
════════════════════════════════════════
✅ Daycare:     Daycare 1, Daycare 2
✅ Kindergarten: Kinder 1, Kinder 2
✅ Elementary:  Grade 1–6
✅ JHS:         Grade 7–10
✅ SHS:         Grade 11, Grade 12 (per strand: ABM, STEM, HUMSS, GAS)

College levels — ⚠️ NEEDS CLARIFICATION
  Your college levels are defined PER COURSE, not per program.
  e.g. "BSIT – 1st Year", "BSIT – 2nd Year" etc.

  The schema has Level.program_id (links to program, not course).
  You have two choices — pick one:

  OPTION A (Recommended):
    Levels are shared across all college courses:
      1st Year, 2nd Year, 3rd Year, 4th Year, 5th Year
    Then subjects link to a course to differentiate them.
    → Simpler. Sections are shared per year level.

  OPTION B:
    Each course gets its own set of year levels:
      "BSIT – 1st Year", "BSBA – 1st Year", etc.
    → More specific but creates many duplicate level rows.

  → Your level.md implies Option B (per-course levels).
    Tell me which you want and I'll seed accordingly.
    If unsure, go with Option A — it's cleaner.

BSA (Accountancy) has a 5th Year — ✅ noted in your data.


════════════════════════════════════════
3. SECTIONS (per level)
════════════════════════════════════════
✅ Daycare 1:    Section A, Section B
✅ Daycare 2:    Section A
✅ Kinder 1–2:  Section A, Section B
✅ Grade 1–6:   Section A, Section B, Section C
✅ Grade 7–10:  Section A, Section B, Section C
✅ SHS (all strands, G11–12): Section A, Section B, Section C
✅ College (all courses, all years): Section A, Section B, Section C

❌ MISSING: Default section capacity
   Your files list section names but no capacity number.
   The schema requires Section.capacity (Int).
   → Tell me the default capacity. Common values: 30, 40, 45, 50.
   → Can be different per program level if needed.


════════════════════════════════════════
4. COURSES (College)
════════════════════════════════════════
✅ BS Information Technology (BSIT)
✅ BS Business Administration (BSBA)
✅ Bachelor of Secondary Education (BSED)
✅ BS Accountancy (BSA)
✅ BS Computer Science (BSCS)
✅ BS Hospitality Management (BSHM)
✅ BS Criminology (BSCrim)
✅ BS Tourism Management (BSTM)

→ All 8 courses covered. Good.

❌ MISSING: Short codes for some courses
   BSIT ✅, BSBA ✅, BSED ✅, BSA ✅, BSCS ✅, BSHM ✅, BSCrim ✅, BSTM ✅
   → Actually all have recognizable codes. I'll assign them in the seed.


════════════════════════════════════════
5. STRANDS (SHS)
════════════════════════════════════════
✅ ABM  (Accountancy, Business, and Management)
✅ STEM (Science, Technology, Engineering, and Mathematics)
✅ HUMSS (Humanities and Social Sciences)
✅ GAS  (General Academic Strand)

❌ MISSING: TVL, Sports, Arts & Design tracks
   Your level.md only shows the Academic Track (ABM/STEM/HUMSS/GAS).
   TVL Track (Technical-Vocational-Livelihood) is common in PH schools.
   → Do you want TVL and other tracks seeded? Or Academic Track only?


════════════════════════════════════════
6. GRADING SCALES (per level)
════════════════════════════════════════
✅ Letter Grade / Percentage Scale (A+/A/B+/B/C/F) — general
✅ 1.0–5.0 Numeric Scale — college
✅ K–12 Basic Education Scale (Outstanding/VS/S/FS/DNM) — k12
✅ Pass/Fail / Credit System — vocational
✅ Alternate 1.0–5.0 variant

⚠️ NOT MAPPED to specific levels yet
   You have the scales defined but haven't said which scale goes to which level.
   I'll use this mapping unless you say otherwise:

     Daycare / Kinder     → Pass/Fail (P/F)
     Grade 1–6            → K–12 Scale (Outstanding/VS/S/FS/DNM)
     Grade 7–10           → K–12 Scale
     Grade 11–12 (SHS)    → K–12 Scale
     College (all courses) → 1.0–5.0 Numeric Scale

   → Confirm or correct this mapping.

⚠️ GradingScale needs school_year_id (required in schema, no default)
   At seed time there is no school year yet.
   Two options:
     OPTION A: Seed scales without school_year_id — requires making
               school_year_id nullable in schema (currently it's String, not String?)
     OPTION B: Create a placeholder "AY 2024–2025" school year as part of seed,
               then link scales to it.
   → Tell me which you prefer.


════════════════════════════════════════
7. GRADING SCHEME (org default)
════════════════════════════════════════
✅ Daycare/Nursery scheme (Play, Participation, Behavior, Health, Projects)
✅ Kindergarten scheme
✅ Elementary scheme
✅ High School scheme
✅ Senior High School scheme
✅ College scheme

⚠️ Weights don't add up to 100% in some schemes
   Let me check each:

   Daycare:  40+30+20+10+10 = 110%  ❌ OVER by 10
   Kinder:   20+30+20+30    = 100%  ✅
   Elementary: 25+25+20+20+10 = 100%  ✅
   High School: 20+20+20+40  = 100%  ✅
   SHS:      20+20+10+10+40  = 100%  ✅
   College:  20+20+20+40     = 100%  ✅

   → Daycare weights total 110%. Fix needed — tell me which to reduce.
     Options: remove Projects (keep at 100%), or reduce Play to 30%.

⚠️ Component types need to match your ComponentType enum
   Your enum: quiz | activity | exam | custom | manual
   Your scheme uses: Quizzes, Activities, Behavior, Projects, Exams, etc.

   Suggested mapping:
     Quizzes      → type: "quiz"
     Activities   → type: "activity"
     Exams        → type: "exam"
     Projects     → type: "activity"  (or "custom" — your call)
     Behavior     → type: "manual"    (manually entered by educator)
     Participation → type: "manual"
     Health & Hygiene → type: "manual"
     Play & Activities → type: "activity"

   → Confirm this mapping.

⚠️ One scheme per program level or one global default?
   The schema supports one org-wide default (is_default: true).
   But you have 6 different schemes for different levels.
   
   Two approaches:
     OPTION A: Seed all 6 as named schemes (is_default: false),
               admin picks one as default during onboarding.
     OPTION B: Seed College as the org default, others as selectable presets.
   
   → Which do you prefer?


════════════════════════════════════════
8. SUBJECTS
════════════════════════════════════════
✅ SHS ABM — 10 major + 10 minor subjects
✅ SHS STEM — 10 major + 10 minor subjects
✅ SHS HUMSS — 10 major + 10 minor subjects
✅ SHS GAS — 10 major + 10 minor subjects

✅ BSIT — 14 major + 11 minor
✅ BSBA — 16 major + 11 minor + specialization tracks
✅ BSA  — 16 major + 11 minor
✅ BSCS — 19 major + 11 minor
✅ BSED — 11 major + 11 minor + specialization tracks
✅ BSHM — 17 major + 11 minor
✅ BSCrim — 15 major + 11 minor
✅ BSTM — 14 major + 11 minor

❌ MISSING: Elementary subjects (Grade 1–6)
   No subject list provided for elementary levels.
   Standard DepEd subjects are:
   English, Filipino, Mathematics, Science (Gr3+),
   Araling Panlipunan, EsP, MAPEH, TLE (Gr4+), MTB-MLE (Gr1-3)
   → Do you want me to fill these in, or will you provide them?

❌ MISSING: Junior High School subjects (Grade 7–10)
   No subject list provided for JHS.
   Standard DepEd subjects:
   English, Filipino, Mathematics, Science, Araling Panlipunan,
   EsP, MAPEH, TLE/EPP, Computer/ICT
   → Same question — fill in or you provide?

❌ MISSING: Daycare / Kindergarten subjects/activities
   These are usually learning areas, not formal subjects.
   e.g. for Kinder: Language, Numeracy, Motor Skills, Values, etc.
   → Do you want these seeded or skip for daycare/kinder?

⚠️ Prerequisites need subject name matching
   Your subject files list prerequisites by name string.
   When seeding, prereqs must be resolved by name → id within the same course.
   → This is handled in the seed script, just confirming you're aware.

⚠️ BSBA and BSED specialization tracks
   BSBA has Marketing/Financial/HR tracks with extra subjects.
   BSED has English/Math/Science/SocSci/Filipino/TLE tracks.
   → Seed all specialization subjects, or only core subjects?


════════════════════════════════════════
SUMMARY — WHAT YOU STILL NEED TO PROVIDE
════════════════════════════════════════

REQUIRED before I write the seed file:

  1. College levels — Option A (shared 1st–4th Year) or Option B (per course)?
  2. Default section capacity — one number or per program?
  3. Grading scale → level mapping — confirm or correct the mapping above
  4. GradingScale school_year_id — Option A (nullable) or Option B (placeholder SY)?
  5. Daycare grading scheme weights — currently 110%, needs fix
  6. Component type mapping — confirm the mapping above
  7. Grading scheme approach — Option A (all as presets) or Option B (one default)?

OPTIONAL (I can fill in with standard DepEd data):

  8. Elementary subjects — want me to fill in standard DepEd? Y/N
  9. JHS subjects — want me to fill in standard DepEd? Y/N
 10. Daycare/Kinder learning areas — seed or skip? Y/N
 11. TVL/Sports/Arts SHS tracks — include or Academic Track only?
 12. BSBA/BSED specialization subjects — include or core only?