/**
 * seed.ts
 *
 * Default seed for a new organisation.
 * Run with: npx ts-node seed.ts  (or via your Prisma seed script)
 *
 * Decisions baked in:
 *  - College levels are per-course (e.g. "BSIT – 1st Year")
 *  - GradingScale.school_year_id is null at seed time (link when SY is created)
 *  - Grading schemes are seeded as named presets (is_default = false)
 *  - Daycare scheme: Play 40 + Participation 30 + Behavior 20 + Health 10 = 100
 *  - Component type mapping:
 *      Quizzes          → quiz
 *      Activities/Play  → activity
 *      Projects/Crafts  → activity
 *      Exams            → exam
 *      Behavior/Participation/Health → manual
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';

const db = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Org id injected at runtime — replace or pass as env var */
const ORG_ID = process.env.SEED_ORG_ID ?? 'ORG_ID_PLACEHOLDER';

function id() { return uuid() }

// ─────────────────────────────────────────────────────────────────────────────
// 1. PROGRAMS
// ─────────────────────────────────────────────────────────────────────────────

const PROGRAMS = [
  { key: 'daycare',     name: 'Daycare / Pre-School',   type: 'daycare' },
  { key: 'kinder',      name: 'Kindergarten',            type: 'kinder' },
  { key: 'elementary',  name: 'Elementary School',       type: 'elementary' },
  { key: 'jhs',         name: 'Junior High School',      type: 'jhs' },
  { key: 'shs',         name: 'Senior High School',      type: 'shs' },
  { key: 'college',     name: 'College / University',    type: 'college' },
];

const SELECTED_PROGRAMS = process.env.SEED_PROGRAMS
  ? new Set(process.env.SEED_PROGRAMS.split(',').map((s) => s.trim()))
  : null // null = seed everything

  function shouldSeed(programKey: string): boolean {
  return SELECTED_PROGRAMS === null || SELECTED_PROGRAMS.has(programKey)
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LEVELS + SECTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * levelDefs: [ programKey, levelName, sections: [{name, capacity}] ]
 *
 * College levels are per-course:
 *   levelName = "<COURSE_CODE> – <Year>"
 *   We store the course code in a side-table later so subjects can be linked.
 */

type SectionDef = { name: string; capacity: number };
type LevelDef   = { programKey: string; name: string; sections: SectionDef[] };

function sections3x50(): SectionDef[] {
  return [
    { name: 'Section A', capacity: 50 },
    { name: 'Section B', capacity: 50 },
    { name: 'Section C', capacity: 50 },
  ];
}
function sections3x40(): SectionDef[] {
  return [
    { name: 'Section A', capacity: 40 },
    { name: 'Section B', capacity: 40 },
    { name: 'Section C', capacity: 40 },
  ];
}
function sections2x40(): SectionDef[] {
  return [
    { name: 'Section A', capacity: 40 },
    { name: 'Section B', capacity: 40 },
  ];
}
function sections2x30(): SectionDef[] {
  return [
    { name: 'Section A', capacity: 30 },
    { name: 'Section B', capacity: 30 },
  ];
}

// College course codes used both for levels and course records
const COLLEGE_COURSES = [
  { code: 'BSIT',   name: 'BS Information Technology',          years: 4 },
  { code: 'BSBA',   name: 'BS Business Administration',         years: 4 },
  { code: 'BSED',   name: 'Bachelor of Secondary Education',    years: 4 },
  { code: 'BSA',    name: 'BS Accountancy',                     years: 5 },
  { code: 'BSCS',   name: 'BS Computer Science',                years: 4 },
  { code: 'BSHM',   name: 'BS Hospitality Management',          years: 4 },
  { code: 'BSCRIM', name: 'BS Criminology',                     years: 4 },
  { code: 'BSTM',   name: 'BS Tourism Management',              years: 4 },
];

const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

// SHS strand/track names (used for both levels and strands)
const SHS_STRANDS = [
  // Academic
  'ABM', 'STEM', 'HUMSS', 'GAS',
  // TVL
  'ICT', 'HE', 'IA', 'Agri-Fishery',
  // Others
  'Sports', 'Arts and Design',
];

function buildLevelDefs(): LevelDef[] {
  const defs: LevelDef[] = [];

  // Daycare
  defs.push(
    { programKey: 'daycare', name: 'Daycare 1', sections: [{ name: 'Section A', capacity: 40 }, { name: 'Section B', capacity: 40 }] },
    { programKey: 'daycare', name: 'Daycare 2', sections: [{ name: 'Section A', capacity: 40 }, { name: 'Section B', capacity: 40 }] },
  );

  // Kindergarten
  defs.push(
    { programKey: 'kinder', name: 'Kinder 1', sections: sections2x30() },
    { programKey: 'kinder', name: 'Kinder 2', sections: sections2x30() },
  );

  // Elementary Grade 1–6
  for (let g = 1; g <= 6; g++) {
    defs.push({ programKey: 'elementary', name: `Grade ${g}`, sections: sections3x40() });
  }

  // JHS Grade 7–10
  for (let g = 7; g <= 10; g++) {
    defs.push({ programKey: 'jhs', name: `Grade ${g}`, sections: sections3x40() });
  }

  // SHS — one level per strand per grade
  for (const strand of SHS_STRANDS) {
    defs.push(
      { programKey: 'shs', name: `Grade 11 – ${strand}`, sections: sections3x40() },
      { programKey: 'shs', name: `Grade 12 – ${strand}`, sections: sections3x40() },
    );
  }

  // College — one level per course per year
  for (const course of COLLEGE_COURSES) {
    for (let y = 1; y <= course.years; y++) {
      defs.push({
        programKey: 'college',
        name: `${course.code} – ${YEAR_LABELS[y - 1]}`,
        sections: sections3x50(),
      });
    }
  }

  return defs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COURSES (college only)
// ─────────────────────────────────────────────────────────────────────────────
// Courses in the schema belong to a program and group subjects.
// For BSED we also add per-major sub-courses.

const BSED_MAJORS = [
  { code: 'BSED-ENG',  name: 'BSED – English Major' },
  { code: 'BSED-MATH', name: 'BSED – Mathematics Major' },
  { code: 'BSED-SCI',  name: 'BSED – Science Major' },
  { code: 'BSED-SS',   name: 'BSED – Social Studies Major' },
  { code: 'BSED-FIL',  name: 'BSED – Filipino Major' },
  { code: 'BSED-TLE',  name: 'BSED – TLE Major' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. STRANDS (SHS only)
// ─────────────────────────────────────────────────────────────────────────────

const SHS_STRAND_DEFS = [
  { name: 'ABM'          },
  { name: 'STEM'         },
  { name: 'HUMSS'        },
  { name: 'GAS'          },
  { name: 'ICT'          },
  { name: 'HE'           },
  { name: 'IA'           },
  { name: 'Agri-Fishery' },
  { name: 'Sports'       },
  { name: 'Arts and Design' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. GRADING SCALES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ranges stored as JSON array:
 *   { min: number, max: number, label: string }[]
 * school_year_id is null — linked when admin creates the first school year.
 */

const SCALE_K12 = [
  { min: 90, max: 100, label: 'Outstanding' },
  { min: 85, max: 89,  label: 'Very Satisfactory' },
  { min: 80, max: 84,  label: 'Satisfactory' },
  { min: 75, max: 79,  label: 'Fairly Satisfactory' },
  { min: 0,  max: 74,  label: 'Did Not Meet Expectations' },
];

const SCALE_COLLEGE = [
  { min: 97,  max: 100, label: '1.0 – Excellent' },
  { min: 93,  max: 96,  label: '1.25 – Very Good' },
  { min: 89,  max: 92,  label: '1.5 – Very Good' },
  { min: 85,  max: 88,  label: '1.75 – Good' },
  { min: 82,  max: 84,  label: '2.0 – Good' },
  { min: 78,  max: 81,  label: '2.25 – Satisfactory' },
  { min: 75,  max: 77,  label: '2.5 – Satisfactory' },
  { min: 70,  max: 74,  label: '2.75 – Passing' },
  { min: 65,  max: 69,  label: '3.0 – Passing' },
  { min: 55,  max: 64,  label: '4.0 – Conditional Fail' },
  { min: 0,   max: 54,  label: '5.0 – Fail' },
];

const SCALE_PASSFAIL = [
  { min: 75, max: 100, label: 'P – Pass' },
  { min: 0,  max: 74,  label: 'F – Fail' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 6. GRADING SCHEMES (presets, not locked to org default)
// ─────────────────────────────────────────────────────────────────────────────

type ComponentPreset = { name: string; type: string; weight: number; isOptional: boolean };
type SchemePreset    = { name: string; components: ComponentPreset[] };

const SCHEME_PRESETS: SchemePreset[] = [
  {
    name: 'Daycare Scheme',
    components: [
      { name: 'Play and Activities', type: 'activity', weight: 40, isOptional: false },
      { name: 'Participation',       type: 'manual',   weight: 30, isOptional: false },
      { name: 'Behavior',            type: 'manual',   weight: 20, isOptional: false },
      { name: 'Health and Hygiene',  type: 'manual',   weight: 10, isOptional: false },
      // total: 100
    ],
  },
  {
    name: 'Kindergarten Scheme',
    components: [
      { name: 'Quizzes',      type: 'quiz',     weight: 20, isOptional: false },
      { name: 'Activities',   type: 'activity', weight: 30, isOptional: false },
      { name: 'Behavior',     type: 'manual',   weight: 20, isOptional: false },
      { name: 'Projects',     type: 'activity', weight: 30, isOptional: false },
      // total: 100
    ],
  },
  {
    name: 'Elementary Scheme',
    components: [
      { name: 'Quizzes',    type: 'quiz',     weight: 25, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 25, isOptional: false },
      { name: 'Behavior',   type: 'manual',   weight: 20, isOptional: false },
      { name: 'Projects',   type: 'activity', weight: 20, isOptional: false },
      { name: 'Exams',      type: 'exam',     weight: 10, isOptional: false },
      // total: 100
    ],
  },
  {
    name: 'High School Scheme',
    components: [
      { name: 'Quizzes',    type: 'quiz',     weight: 20, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 20, isOptional: false },
      { name: 'Behavior',   type: 'manual',   weight: 20, isOptional: false },
      { name: 'Exams',      type: 'exam',     weight: 40, isOptional: false },
      // total: 100
    ],
  },
  {
    name: 'Senior High School Scheme',
    components: [
      { name: 'Quizzes',    type: 'quiz',     weight: 20, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 20, isOptional: false },
      { name: 'Behavior',   type: 'manual',   weight: 10, isOptional: false },
      { name: 'Projects',   type: 'activity', weight: 10, isOptional: false },
      { name: 'Exams',      type: 'exam',     weight: 40, isOptional: false },
      // total: 100
    ],
  },
  {
    name: 'College Scheme',
    components: [
      { name: 'Quizzes',    type: 'quiz',     weight: 20, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 20, isOptional: false },
      { name: 'Behavior',   type: 'manual',   weight: 20, isOptional: false },
      { name: 'Exams',      type: 'exam',     weight: 40, isOptional: false },
      // total: 100
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 7. SUBJECTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SubjectDef fields:
 *   levelName    — matches the level name seeded above
 *   courseCode   — matches COLLEGE_COURSES.code (null for k-12)
 *   strandName   — matches SHS_STRAND_DEFS.name (null for non-SHS)
 *   name         — subject/learning area name
 *   yearLevel    — "1st Year" / "Grade 11" / "Daycare 1" etc.
 *   termLabel    — "1st Semester" / "2nd Semester" / "Whole Year" / "Both Semesters"
 *   prereqNames  — prerequisite subject names (resolved to ids after insert)
 */

type SubjectDef = {
  levelName:   string;
  courseCode:  string | null;
  strandName:  string | null;
  name:        string;
  yearLevel:   string;
  termLabel:   string;
  prereqNames: string[];
};

// ── Helpers to build subject arrays ──────────────────────────────────────────

function subj(
  levelName: string,
  courseCode: string | null,
  strandName: string | null,
  name: string,
  yearLevel: string,
  termLabel: string,
  prereqNames: string[] = [],
): SubjectDef {
  return { levelName, courseCode, strandName, name, yearLevel, termLabel, prereqNames };
}

// ── Daycare ───────────────────────────────────────────────────────────────────

const DAYCARE_AREAS = [
  'Language and Literacy',
  'Cognitive and Numeracy Skills',
  'Physical Development, Health, and Safety',
  'Social and Emotional Development',
  'Creative Arts and Music',
  'Understanding the World / Discovery',
];

function daycareSubjects(): SubjectDef[] {
  const out: SubjectDef[] = [];
  for (const area of DAYCARE_AREAS) {
    out.push(subj('Daycare 1', null, null, area, 'Daycare 1', 'Whole Year'));
  }
  for (const area of DAYCARE_AREAS) {
    out.push(subj('Daycare 2', null, null, area, 'Daycare 2', 'Whole Year', [`${area} (Daycare 1)`]));
    // Note: prereq name uses "(Daycare 1)" suffix to disambiguate — we strip it on lookup
  }
  return out;
}

// ── Kindergarten ──────────────────────────────────────────────────────────────

const KINDER_AREAS = [
  'Language, Literacy, and Communication',
  'Mathematical Thinking',
  'Physical Development, Health, and Safety',
  'Social and Emotional Development / Values Formation',
  'Creative Arts',
  'Understanding the World / Discovery',
];

function kinderSubjects(): SubjectDef[] {
  const out: SubjectDef[] = [];
  for (const area of KINDER_AREAS) {
    out.push(subj('Kinder 1', null, null, area, 'Kinder 1', 'Whole Year'));
  }
  for (const area of KINDER_AREAS) {
    out.push(subj('Kinder 2', null, null, area, 'Kinder 2', 'Whole Year', [area]));
  }
  return out;
}

// ── Elementary Grade 1–6 ──────────────────────────────────────────────────────

const ELEM_CORE = ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'Edukasyon sa Pagpapakatao (ESP)'];
const ELEM_PREREQS: Record<string, string | null> = {
  'English': 'English',
  'Mathematics': 'Mathematics',
  'Science': 'Science',
  'Filipino': 'Filipino',
  'Araling Panlipunan': 'Araling Panlipunan',
  'MAPEH': null,
  'Edukasyon sa Pagpapakatao (ESP)': null,
};

function elementarySubjects(): SubjectDef[] {
  const out: SubjectDef[] = [];
  for (let g = 1; g <= 6; g++) {
    for (const subjectName of ELEM_CORE) {
      const prereq = ELEM_PREREQS[subjectName];
      const prereqNames = (prereq && g > 1) ? [prereq] : [];
      out.push(subj(`Grade ${g}`, null, null, subjectName, `Grade ${g}`, 'Whole Year', prereqNames));
    }
  }
  return out;
}

// ── JHS Grade 7–10 ────────────────────────────────────────────────────────────

const JHS_CORE = ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'Edukasyon sa Pagpapakatao (ESP)', 'TLE'];
const JHS_PREREQS: Record<string, string | null> = {
  'English': 'English',
  'Mathematics': 'Mathematics',
  'Science': 'Science',
  'Filipino': 'Filipino',
  'Araling Panlipunan': 'Araling Panlipunan',
  'MAPEH': null,
  'Edukasyon sa Pagpapakatao (ESP)': null,
  'TLE': 'TLE',
};

function jhsSubjects(): SubjectDef[] {
  const out: SubjectDef[] = [];
  for (let g = 7; g <= 10; g++) {
    for (const subjectName of JHS_CORE) {
      const prereq = JHS_PREREQS[subjectName];
      // Grade 7 prereqs point to Grade 6 equivalents — already seeded in elementary
      const prereqNames = prereq ? [prereq] : [];
      out.push(subj(`Grade ${g}`, null, null, subjectName, `Grade ${g}`, 'Whole Year', prereqNames));
    }
  }
  return out;
}

// ── SHS Minor/Shared subjects (same for all strands) ─────────────────────────

const SHS_MINOR: { name: string; grade: 11 | 12; term: string; prereqs: string[] }[] = [
  { name: 'Oral Communication',                         grade: 11, term: '1st Semester', prereqs: [] },
  { name: 'Reading and Writing Skills',                 grade: 11, term: '1st Semester', prereqs: [] },
  { name: 'Mathematics in the Modern World',            grade: 11, term: '1st Semester', prereqs: [] },
  { name: 'Understanding the Self',                     grade: 11, term: '1st Semester', prereqs: [] },
  { name: 'Contemporary World',                         grade: 11, term: '2nd Semester', prereqs: [] },
  { name: 'Readings in Philippine History',             grade: 11, term: '2nd Semester', prereqs: [] },
  { name: 'Physical Education / Health',                grade: 11, term: 'Both Semesters', prereqs: [] },
  { name: 'Life and Works of Jose Rizal',               grade: 11, term: '2nd Semester', prereqs: [] },
  { name: 'National Service Training Program (NSTP)',   grade: 12, term: 'Both Semesters', prereqs: [] },
  { name: 'Art Appreciation',                           grade: 12, term: '1st Semester', prereqs: [] },
];

// ── SHS Major subjects per strand ────────────────────────────────────────────

type ShsSubjRaw = { name: string; grade: 11 | 12; term: string; prereqs: string[] };

const SHS_MAJOR: Record<string, ShsSubjRaw[]> = {
  ABM: [
    { name: 'Fundamentals of Accounting',  grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Business Math',               grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Fundamentals of Economics',   grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Principles of Management',    grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Entrepreneurship',            grade: 12, term: '1st Semester', prereqs: ['Principles of Management'] },
    { name: 'Organization and Management', grade: 12, term: '1st Semester', prereqs: ['Fundamentals of Accounting', 'Principles of Management'] },
    { name: 'Business Finance',            grade: 12, term: '2nd Semester', prereqs: ['Business Math', 'Fundamentals of Accounting'] },
    { name: 'Business Ethics',             grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Applied Economics',           grade: 12, term: '2nd Semester', prereqs: ['Fundamentals of Economics'] },
    { name: 'Strategic Business Planning', grade: 12, term: '2nd Semester', prereqs: ['Entrepreneurship', 'Organization and Management'] },
  ],
  STEM: [
    { name: 'General Biology',                    grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'General Chemistry',                  grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'General Physics',                    grade: 11, term: '2nd Semester', prereqs: ['Mathematics in the Modern World'] },
    { name: 'Earth and Life Science',             grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Calculus and Analytical Geometry',   grade: 12, term: '1st Semester', prereqs: [] },
    { name: 'Advanced Physics',                   grade: 12, term: '1st Semester', prereqs: ['General Physics'] },
    { name: 'Organic Chemistry',                  grade: 12, term: '2nd Semester', prereqs: ['General Chemistry'] },
    { name: 'Research in Science',                grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Engineering and Technology Applications', grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Applied Mathematics',                grade: 12, term: '2nd Semester', prereqs: ['Calculus and Analytical Geometry'] },
  ],
  HUMSS: [
    { name: 'Introduction to Philosophy',             grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Understanding Culture and Society',      grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Creative Writing',                       grade: 11, term: '2nd Semester', prereqs: ['Reading and Writing Skills'] },
    { name: 'Philippine Politics and Governance',     grade: 11, term: '2nd Semester', prereqs: ['Understanding Culture and Society'] },
    { name: 'Psychology',                             grade: 12, term: '1st Semester', prereqs: ['Understanding the Self'] },
    { name: 'Social Research and Statistics',         grade: 12, term: '1st Semester', prereqs: ['Contemporary World'] },
    { name: 'World History and Globalization',        grade: 12, term: '2nd Semester', prereqs: ['Readings in Philippine History'] },
    { name: 'Philosophy of Human Person',             grade: 12, term: '2nd Semester', prereqs: ['Introduction to Philosophy'] },
    { name: 'Economics for Social Sciences',          grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Applied Social Sciences / Ethics in Society', grade: 12, term: '2nd Semester', prereqs: ['Understanding the Self'] },
  ],
  GAS: [
    { name: 'Introduction to Humanities',          grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Introduction to Social Sciences',     grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Fundamentals of Business and Management', grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Basic Principles of Science and Technology', grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Creative Writing',                    grade: 12, term: '1st Semester', prereqs: ['Reading and Writing Skills'] },
    { name: 'Introduction to Philosophy',          grade: 12, term: '1st Semester', prereqs: [] },
    { name: 'Research Methods / Applied Research', grade: 12, term: '2nd Semester', prereqs: ['Contemporary World'] },
    { name: 'Economics / Business Economics',      grade: 12, term: '2nd Semester', prereqs: ['Fundamentals of Business and Management'] },
    { name: 'Social Issues and Ethics',            grade: 12, term: '2nd Semester', prereqs: ['Understanding the Self'] },
    { name: 'Interdisciplinary Elective',          grade: 12, term: '2nd Semester', prereqs: [] },
  ],
  ICT: [
    { name: 'Computer Programming 1',                   grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Introduction to Computing',                grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Web Development 1 (HTML, CSS)',             grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Computer Programming 2',                   grade: 11, term: '2nd Semester', prereqs: ['Computer Programming 1'] },
    { name: 'Web Development 2 (JavaScript)',           grade: 11, term: '2nd Semester', prereqs: ['Web Development 1 (HTML, CSS)'] },
    { name: 'Database Management Systems',              grade: 11, term: '2nd Semester', prereqs: ['Introduction to Computing'] },
    { name: 'Systems Analysis and Design',              grade: 12, term: '1st Semester', prereqs: ['Computer Programming 2', 'Database Management Systems'] },
    { name: 'Mobile Application Development',          grade: 12, term: '1st Semester', prereqs: ['Computer Programming 2'] },
    { name: 'Computer Networks and Security',          grade: 12, term: '1st Semester', prereqs: ['Introduction to Computing'] },
    { name: 'Capstone Project',                        grade: 12, term: '2nd Semester', prereqs: ['Systems Analysis and Design'] },
    { name: 'ICT Project Management',                  grade: 12, term: '2nd Semester', prereqs: ['Systems Analysis and Design'] },
    { name: 'Emerging Technologies in ICT',            grade: 12, term: '2nd Semester', prereqs: [] },
  ],
  HE: [
    { name: 'Introduction to Home Economics',  grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Cookery / Culinary Basics',       grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Bread and Pastry Production',     grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Food and Beverage Services',      grade: 11, term: '2nd Semester', prereqs: ['Cookery / Culinary Basics'] },
    { name: 'Housekeeping',                    grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Caregiving (Basic)',              grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Dressmaking / Tailoring',         grade: 12, term: '1st Semester', prereqs: [] },
    { name: 'Advanced Cookery / International Cuisine', grade: 12, term: '1st Semester', prereqs: ['Cookery / Culinary Basics'] },
    { name: 'Events Management Services',      grade: 12, term: '1st Semester', prereqs: ['Food and Beverage Services'] },
    { name: 'Entrepreneurship in Home Economics', grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Work Immersion (OJT)',            grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Capstone Project / Practical Assessment', grade: 12, term: '2nd Semester', prereqs: [] },
  ],
  IA: [
    { name: 'Introduction to Industrial Arts',               grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Basic Electrical Installation and Maintenance', grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Carpentry Fundamentals',                        grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Shielded Metal Arc Welding (SMAW) NC I',       grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Plumbing Basics',                               grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Automotive Servicing NC I',                     grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Electrical Installation and Maintenance NC II', grade: 12, term: '1st Semester', prereqs: ['Basic Electrical Installation and Maintenance'] },
    { name: 'Shielded Metal Arc Welding (SMAW) NC II',      grade: 12, term: '1st Semester', prereqs: ['Shielded Metal Arc Welding (SMAW) NC I'] },
    { name: 'Advanced Carpentry / Construction Technology',  grade: 12, term: '1st Semester', prereqs: ['Carpentry Fundamentals'] },
    { name: 'Industrial Safety and Maintenance',             grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Work Immersion (OJT)',                         grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Capstone Project / Practical Assessment',      grade: 12, term: '2nd Semester', prereqs: [] },
  ],
  'Agri-Fishery': [
    { name: 'Introduction to Agri-Fishery Arts', grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Crop Production (Basic)',           grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Animal Production (Basic)',         grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Aquaculture (Basic)',               grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Horticulture',                      grade: 11, term: '2nd Semester', prereqs: ['Crop Production (Basic)'] },
    { name: 'Agricultural Machinery and Tools',  grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Crop Production NC II',             grade: 12, term: '1st Semester', prereqs: ['Crop Production (Basic)'] },
    { name: 'Animal Production NC II',           grade: 12, term: '1st Semester', prereqs: ['Animal Production (Basic)'] },
    { name: 'Aquaculture NC II',                 grade: 12, term: '1st Semester', prereqs: ['Aquaculture (Basic)'] },
    { name: 'Farm Management',                   grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Work Immersion (OJT)',              grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Capstone Project / Practical Assessment', grade: 12, term: '2nd Semester', prereqs: [] },
  ],
  Sports: [
    { name: 'Introduction to Sports Science',          grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Physical Fitness and Conditioning',       grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Fundamentals of Coaching',               grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Sports Officiating and Rules',           grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Sports Psychology',                       grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Safety and First Aid in Sports',         grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Advanced Coaching and Training Techniques', grade: 12, term: '1st Semester', prereqs: ['Fundamentals of Coaching'] },
    { name: 'Sports Event Management',                grade: 12, term: '1st Semester', prereqs: [] },
    { name: 'Anatomy and Physiology for Athletes',    grade: 12, term: '1st Semester', prereqs: ['Introduction to Sports Science'] },
    { name: 'Sports Analytics and Performance Analysis', grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Work Immersion (OJT)',                   grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Capstone Project / Practical Assessment', grade: 12, term: '2nd Semester', prereqs: [] },
  ],
  'Arts and Design': [
    { name: 'Introduction to Arts and Design',        grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Elements and Principles of Design',      grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Creative Industries I (Applied Arts)',   grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Creative Industries II (Media Arts)',    grade: 11, term: '2nd Semester', prereqs: ['Creative Industries I (Applied Arts)'] },
    { name: 'Fundamentals of Performing Arts',        grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Visual Arts Production',                 grade: 11, term: '2nd Semester', prereqs: ['Elements and Principles of Design'] },
    { name: 'Specialization in Arts',                grade: 12, term: '1st Semester', prereqs: [] },
    { name: 'Portfolio Development',                  grade: 12, term: '1st Semester', prereqs: ['Visual Arts Production'] },
    { name: 'Arts Production and Management',         grade: 12, term: '1st Semester', prereqs: [] },
    { name: 'Contemporary Arts Practices',            grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Work Immersion (OJT)',                  grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Capstone Project / Culminating Exhibit', grade: 12, term: '2nd Semester', prereqs: [] },
  ],
};

function shsSubjects(): SubjectDef[] {
  const out: SubjectDef[] = [];
  for (const strand of SHS_STRAND_DEFS) {
    const majors = SHS_MAJOR[strand.name] ?? [];
    for (const g of [11, 12] as const) {
      const levelName = `Grade ${g} – ${strand.name}`;
      const yearLabel = `Grade ${g}`;

      // Majors for this grade
      for (const m of majors.filter(x => x.grade === g)) {
        out.push(subj(levelName, null, strand.name, m.name, yearLabel, m.term, m.prereqs));
      }

      // Shared minor subjects
      for (const m of SHS_MINOR.filter(x => x.grade === g)) {
        out.push(subj(levelName, null, strand.name, m.name, yearLabel, m.term, m.prereqs));
      }
    }
  }
  return out;
}

// ── College subjects ──────────────────────────────────────────────────────────

// GE subjects shared across all college courses
const COLLEGE_GE: { name: string; year: string; term: string; prereqs: string[] }[] = [
  { name: 'Mathematics in the Modern World', year: '1st Year', term: '1st Semester', prereqs: [] },
  { name: 'Purposive Communication',         year: '1st Year', term: '1st Semester', prereqs: [] },
  { name: 'Understanding the Self',          year: '1st Year', term: '1st Semester', prereqs: [] },
  { name: 'Readings in Philippine History',  year: '1st Year', term: '2nd Semester', prereqs: [] },
  { name: 'The Contemporary World',          year: '1st Year', term: '2nd Semester', prereqs: [] },
  { name: 'Life and Works of Jose Rizal',    year: '1st Year', term: '2nd Semester', prereqs: [] },
  { name: 'Physical Education 1',            year: '1st Year', term: '1st Semester', prereqs: [] },
  { name: 'Physical Education 2',            year: '1st Year', term: '2nd Semester', prereqs: [] },
  { name: 'Ethics',                          year: '2nd Year', term: '1st Semester', prereqs: ['Understanding the Self'] },
  { name: 'Art Appreciation',               year: '2nd Year', term: '2nd Semester', prereqs: [] },
  { name: 'Science, Technology, and Society', year: '2nd Year', term: '2nd Semester', prereqs: [] },
  { name: 'NSTP 1',                         year: '2nd Year', term: '1st Semester', prereqs: [] },
  { name: 'NSTP 2',                         year: '2nd Year', term: '2nd Semester', prereqs: [] },
];

type CollegeSubjRaw = { name: string; year: string; term: string; prereqs: string[] };

const COLLEGE_MAJOR: Record<string, CollegeSubjRaw[]> = {
  BSIT: [
    { name: 'Introduction to Computing',             year: '1st Year', term: '1st Semester', prereqs: [] },
    { name: 'Computer Programming 1',                year: '1st Year', term: '1st Semester', prereqs: ['Introduction to Computing'] },
    { name: 'Computer Programming 2',               year: '1st Year', term: '2nd Semester', prereqs: ['Computer Programming 1'] },
    { name: 'Data Structures and Algorithms',        year: '2nd Year', term: '1st Semester', prereqs: ['Computer Programming 2'] },
    { name: 'Database Management Systems',           year: '2nd Year', term: '2nd Semester', prereqs: ['Data Structures and Algorithms'] },
    { name: 'Web Systems and Technologies',          year: '2nd Year', term: '2nd Semester', prereqs: ['Computer Programming 2'] },
    { name: 'Software Engineering',                  year: '3rd Year', term: '1st Semester', prereqs: ['Data Structures and Algorithms'] },
    { name: 'Human-Computer Interaction',            year: '3rd Year', term: '2nd Semester', prereqs: ['Software Engineering'] },
    { name: 'Operating Systems',                     year: '3rd Year', term: '1st Semester', prereqs: ['Data Structures and Algorithms'] },
    { name: 'Computer Networks',                     year: '3rd Year', term: '2nd Semester', prereqs: ['Operating Systems'] },
    { name: 'Information Assurance and Security',    year: '3rd Year', term: '2nd Semester', prereqs: ['Computer Networks'] },
    { name: 'Systems Analysis and Design',           year: '3rd Year', term: '1st Semester', prereqs: ['Software Engineering'] },
    { name: 'IT Project Management',                 year: '4th Year', term: '1st Semester', prereqs: ['Systems Analysis and Design'] },
    { name: 'Capstone Project / Thesis',             year: '4th Year', term: '2nd Semester', prereqs: ['IT Project Management'] },
  ],
  BSBA: [
    { name: 'Principles of Management',   year: '1st Year', term: '1st Semester', prereqs: [] },
    { name: 'Microeconomics',             year: '1st Year', term: '2nd Semester', prereqs: [] },
    { name: 'Macroeconomics',             year: '1st Year', term: '2nd Semester', prereqs: ['Microeconomics'] },
    { name: 'Business Statistics',        year: '1st Year', term: '2nd Semester', prereqs: ['Mathematics in the Modern World'] },
    { name: 'Principles of Marketing',   year: '2nd Year', term: '1st Semester', prereqs: ['Principles of Management'] },
    { name: 'Financial Management',      year: '2nd Year', term: '1st Semester', prereqs: ['Principles of Management', 'Business Statistics'] },
    { name: 'Business Law',              year: '2nd Year', term: '1st Semester', prereqs: [] },
    { name: 'Human Resource Management', year: '2nd Year', term: '2nd Semester', prereqs: ['Principles of Management'] },
    { name: 'Operations Management',     year: '2nd Year', term: '2nd Semester', prereqs: ['Principles of Management', 'Business Statistics'] },
    { name: 'Business Ethics',           year: '2nd Year', term: '2nd Semester', prereqs: [] },
    { name: 'Organizational Behavior',   year: '2nd Year', term: '2nd Semester', prereqs: ['Principles of Management'] },
    { name: 'Strategic Management',      year: '3rd Year', term: '1st Semester', prereqs: ['Principles of Management', 'Principles of Marketing', 'Financial Management'] },
    { name: 'International Business',    year: '3rd Year', term: '1st Semester', prereqs: ['Principles of Marketing', 'Strategic Management'] },
    { name: 'Entrepreneurial Management', year: '3rd Year', term: '2nd Semester', prereqs: ['Principles of Marketing', 'Strategic Management'] },
    { name: 'Business Research',         year: '3rd Year', term: '2nd Semester', prereqs: ['Business Statistics', 'Principles of Management'] },
    { name: 'Project Management',        year: '4th Year', term: '1st Semester', prereqs: ['Strategic Management', 'Operations Management'] },
  ],
  BSA: [
    { name: 'Fundamentals of Accounting',                             year: '1st Year', term: '1st Semester', prereqs: [] },
    { name: 'Financial Accounting and Reporting I',                    year: '1st Year', term: '2nd Semester', prereqs: ['Fundamentals of Accounting'] },
    { name: 'Business Law',                                            year: '2nd Year', term: '1st Semester', prereqs: [] },
    { name: 'Management Accounting',                                   year: '2nd Year', term: '1st Semester', prereqs: ['Financial Accounting and Reporting I'] },
    { name: 'Regulatory Framework and Legal Issues in Business',       year: '2nd Year', term: '1st Semester', prereqs: ['Business Law'] },
    { name: 'Cost Accounting',                                         year: '2nd Year', term: '2nd Semester', prereqs: ['Management Accounting'] },
    { name: 'Accounting Information Systems',                          year: '2nd Year', term: '2nd Semester', prereqs: ['Fundamentals of Accounting'] },
    { name: 'Auditing Theory',                                         year: '3rd Year', term: '1st Semester', prereqs: ['Cost Accounting'] },
    { name: 'Advanced Financial Accounting and Reporting',             year: '3rd Year', term: '1st Semester', prereqs: ['Financial Accounting and Reporting I'] },
    { name: 'Financial Management',                                    year: '3rd Year', term: '1st Semester', prereqs: ['Management Accounting'] },
    { name: 'Auditing and Assurance Services',                         year: '3rd Year', term: '2nd Semester', prereqs: ['Auditing Theory'] },
    { name: 'Taxation (Income Tax, Business Tax)',                     year: '3rd Year', term: '2nd Semester', prereqs: ['Financial Accounting and Reporting I'] },
    { name: 'Strategic Cost Management',                               year: '4th Year', term: '1st Semester', prereqs: ['Cost Accounting'] },
    { name: 'Governance, Business Ethics, Risk Management, and Internal Control', year: '4th Year', term: '1st Semester', prereqs: ['Auditing Theory'] },
    { name: 'Accounting Research',                                     year: '4th Year', term: '2nd Semester', prereqs: ['Advanced Financial Accounting and Reporting', 'Management Accounting'] },
    { name: 'Integrated Review Courses (Board Exam Preparation)',      year: '4th Year', term: '2nd Semester', prereqs: [] },
  ],
  BSCS: [
    { name: 'Introduction to Computing',       year: '1st Year', term: '1st Semester', prereqs: [] },
    { name: 'Computer Programming 1',          year: '1st Year', term: '1st Semester', prereqs: ['Introduction to Computing'] },
    { name: 'Computer Programming 2',         year: '1st Year', term: '2nd Semester', prereqs: ['Computer Programming 1'] },
    { name: 'Discrete Mathematics',           year: '1st Year', term: '2nd Semester', prereqs: [] },
    { name: 'Object-Oriented Programming',    year: '2nd Year', term: '1st Semester', prereqs: ['Computer Programming 2'] },
    { name: 'Computer Architecture',          year: '2nd Year', term: '2nd Semester', prereqs: ['Introduction to Computing', 'Object-Oriented Programming'] },
    { name: 'Data Structures and Algorithms', year: '2nd Year', term: '2nd Semester', prereqs: ['Object-Oriented Programming', 'Discrete Mathematics'] },
    { name: 'Database Systems',               year: '2nd Year', term: '2nd Semester', prereqs: ['Computer Programming 2'] },
    { name: 'Algorithms and Complexity',      year: '3rd Year', term: '1st Semester', prereqs: ['Data Structures and Algorithms'] },
    { name: 'Automata Theory',               year: '3rd Year', term: '1st Semester', prereqs: ['Discrete Mathematics'] },
    { name: 'Operating Systems',              year: '3rd Year', term: '1st Semester', prereqs: ['Data Structures and Algorithms', 'Computer Architecture'] },
    { name: 'Numerical Methods',              year: '3rd Year', term: '1st Semester', prereqs: ['Discrete Mathematics'] },
    { name: 'Programming Languages',          year: '3rd Year', term: '2nd Semester', prereqs: ['Object-Oriented Programming', 'Data Structures and Algorithms'] },
    { name: 'Software Engineering',           year: '3rd Year', term: '2nd Semester', prereqs: ['Object-Oriented Programming'] },
    { name: 'Computer Networks',              year: '3rd Year', term: '2nd Semester', prereqs: ['Operating Systems'] },
    { name: 'Human-Computer Interaction',     year: '3rd Year', term: '2nd Semester', prereqs: ['Software Engineering'] },
    { name: 'Artificial Intelligence',        year: '4th Year', term: '1st Semester', prereqs: ['Data Structures and Algorithms', 'Algorithms and Complexity'] },
    { name: 'Machine Learning',              year: '4th Year', term: '2nd Semester', prereqs: ['Artificial Intelligence', 'Data Structures and Algorithms'] },
    { name: 'CS Thesis / Capstone Project',  year: '4th Year', term: '2nd Semester', prereqs: [] },
  ],
  BSED: [
    // Core education subjects (no course_id — shared across all BSED majors)
    // seeded separately below with courseCode = null
  ],
  BSHM: [
    { name: 'Introduction to Hospitality Industry', year: '1st Year', term: '1st Semester', prereqs: [] },
    { name: 'Food and Beverage Service Operations',  year: '1st Year', term: '2nd Semester', prereqs: ['Introduction to Hospitality Industry'] },
    { name: 'Housekeeping Operations',              year: '1st Year', term: '2nd Semester', prereqs: ['Introduction to Hospitality Industry'] },
    { name: 'Front Office Operations',              year: '2nd Year', term: '1st Semester', prereqs: ['Introduction to Hospitality Industry'] },
    { name: 'Culinary Arts / Basic Cooking',        year: '2nd Year', term: '1st Semester', prereqs: ['Food and Beverage Service Operations'] },
    { name: 'Hospitality Marketing',               year: '2nd Year', term: '2nd Semester', prereqs: ['Introduction to Hospitality Industry', 'Front Office Operations'] },
    { name: 'Hospitality Financial Management',     year: '2nd Year', term: '2nd Semester', prereqs: ['Food and Beverage Service Operations'] },
    { name: 'Food Safety and Sanitation',           year: '2nd Year', term: '2nd Semester', prereqs: ['Culinary Arts / Basic Cooking'] },
    { name: 'Hospitality Law',                      year: '2nd Year', term: '2nd Semester', prereqs: [] },
    { name: 'Customer Service Management',          year: '2nd Year', term: '2nd Semester', prereqs: ['Front Office Operations', 'Food and Beverage Service Operations'] },
    { name: 'Tourism Planning and Development',     year: '3rd Year', term: '1st Semester', prereqs: ['Introduction to Hospitality Industry'] },
    { name: 'Hotel and Restaurant Management',      year: '3rd Year', term: '1st Semester', prereqs: ['Front Office Operations', 'Housekeeping Operations'] },
    { name: 'Beverage Management (Bar and Drinks)', year: '3rd Year', term: '1st Semester', prereqs: ['Food and Beverage Service Operations'] },
    { name: 'Event Management',                     year: '3rd Year', term: '2nd Semester', prereqs: ['Hospitality Marketing'] },
    { name: 'Banquet and Catering Management',      year: '3rd Year', term: '2nd Semester', prereqs: ['Food and Beverage Service Operations', 'Event Management'] },
    { name: 'Entrepreneurship in Hospitality',      year: '4th Year', term: '1st Semester', prereqs: ['Hospitality Marketing', 'Hotel and Restaurant Management'] },
    { name: 'Internship / OJT',                    year: '4th Year', term: '2nd Semester', prereqs: [] },
  ],
  BSCRIM: [
    { name: 'Introduction to Criminology',               year: '1st Year', term: '1st Semester', prereqs: [] },
    { name: 'Criminal Law',                              year: '1st Year', term: '2nd Semester', prereqs: ['Introduction to Criminology'] },
    { name: 'Criminological Theories',                   year: '2nd Year', term: '1st Semester', prereqs: ['Introduction to Criminology'] },
    { name: 'Law Enforcement Administration',            year: '2nd Year', term: '1st Semester', prereqs: ['Criminological Theories'] },
    { name: 'Ethics and Moral Values in Law Enforcement',year: '2nd Year', term: '1st Semester', prereqs: [] },
    { name: 'Criminalistics / Forensic Science',         year: '2nd Year', term: '2nd Semester', prereqs: ['Criminal Law'] },
    { name: 'Crime Detection and Investigation',         year: '2nd Year', term: '2nd Semester', prereqs: ['Criminalistics / Forensic Science', 'Law Enforcement Administration'] },
    { name: 'Juvenile Delinquency',                      year: '2nd Year', term: '2nd Semester', prereqs: ['Criminological Theories'] },
    { name: 'Police Administration',                     year: '3rd Year', term: '1st Semester', prereqs: ['Law Enforcement Administration'] },
    { name: 'Criminal Psychology',                       year: '3rd Year', term: '1st Semester', prereqs: ['Criminological Theories', 'Juvenile Delinquency'] },
    { name: 'Correctional Administration',               year: '3rd Year', term: '2nd Semester', prereqs: ['Police Administration'] },
    { name: 'Disaster and Risk Management',              year: '3rd Year', term: '2nd Semester', prereqs: ['Law Enforcement Administration'] },
    { name: 'Research in Criminology',                   year: '3rd Year', term: '2nd Semester', prereqs: ['Criminological Theories', 'Criminal Law'] },
    { name: 'Criminal Investigation Practicum',          year: '4th Year', term: '1st Semester', prereqs: ['Crime Detection and Investigation', 'Police Administration'] },
    { name: 'Community Policing and Public Safety',      year: '4th Year', term: '2nd Semester', prereqs: ['Criminal Investigation Practicum'] },
  ],
  BSTM: [
    { name: 'Principles of Tourism',              year: '1st Year', term: '1st Semester', prereqs: [] },
    { name: 'Tourism Research and Statistics',    year: '2nd Year', term: '2nd Semester', prereqs: [] },
    { name: 'Tourism Planning and Development',   year: '2nd Year', term: '1st Semester', prereqs: ['Principles of Tourism'] },
    { name: 'Travel Agency Operations',           year: '2nd Year', term: '2nd Semester', prereqs: ['Principles of Tourism'] },
    { name: 'Tour Guiding and Tour Operations',   year: '2nd Year', term: '2nd Semester', prereqs: ['Principles of Tourism'] },
    { name: 'Hospitality and Tourism Law',        year: '2nd Year', term: '2nd Semester', prereqs: ['Principles of Tourism'] },
    { name: 'Tourism Marketing and Promotion',    year: '3rd Year', term: '1st Semester', prereqs: ['Tourism Planning and Development'] },
    { name: 'Event and Convention Management',    year: '3rd Year', term: '1st Semester', prereqs: ['Tourism Marketing and Promotion'] },
    { name: 'Sustainable Tourism',               year: '3rd Year', term: '2nd Semester', prereqs: ['Tourism Planning and Development'] },
    { name: 'Cultural and Heritage Tourism',     year: '3rd Year', term: '2nd Semester', prereqs: ['Tourism Planning and Development'] },
    { name: 'Tourism Policy and Governance',     year: '3rd Year', term: '2nd Semester', prereqs: ['Principles of Tourism', 'Sustainable Tourism'] },
    { name: 'Airline and Cruise Management',     year: '4th Year', term: '1st Semester', prereqs: ['Travel Agency Operations'] },
    { name: 'Tourism Entrepreneurship',          year: '4th Year', term: '1st Semester', prereqs: ['Tourism Marketing and Promotion'] },
    { name: 'Internship / OJT',                 year: '4th Year', term: '2nd Semester', prereqs: [] },
  ],
};

// BSED core subjects (shared across all BSED majors, no course_id)
const BSED_CORE: CollegeSubjRaw[] = [
  { name: 'The Teaching Profession',              year: '1st Year', term: '1st Semester', prereqs: [] },
  { name: 'Foundations of Education',             year: '1st Year', term: '2nd Semester', prereqs: ['The Teaching Profession'] },
  { name: 'Child and Adolescent Development',     year: '2nd Year', term: '1st Semester', prereqs: ['Foundations of Education'] },
  { name: 'Principles of Teaching',               year: '2nd Year', term: '1st Semester', prereqs: ['The Teaching Profession', 'Foundations of Education'] },
  { name: 'Facilitating Learner-Centered Teaching', year: '2nd Year', term: '2nd Semester', prereqs: ['Principles of Teaching', 'Child and Adolescent Development'] },
  { name: 'Educational Technology',               year: '2nd Year', term: '2nd Semester', prereqs: ['Facilitating Learner-Centered Teaching'] },
  { name: 'Assessment of Learning 1',             year: '3rd Year', term: '1st Semester', prereqs: ['Facilitating Learner-Centered Teaching'] },
  { name: 'Assessment of Learning 2',             year: '3rd Year', term: '2nd Semester', prereqs: ['Assessment of Learning 1'] },
  { name: 'Curriculum Development',               year: '3rd Year', term: '2nd Semester', prereqs: ['Foundations of Education'] },
  { name: 'Field Study (Practice Teaching Preparation)', year: '3rd Year', term: '2nd Semester', prereqs: ['Assessment of Learning 1', 'Facilitating Learner-Centered Teaching'] },
  { name: 'Practice Teaching / Internship',       year: '4th Year', term: '1st Semester', prereqs: ['Field Study (Practice Teaching Preparation)'] },
];

function collegeSubjects(): SubjectDef[] {
  const out: SubjectDef[] = [];

  for (const course of COLLEGE_COURSES) {
    const majors = COLLEGE_MAJOR[course.code] ?? [];

    // Major subjects
    for (const s of majors) {
      const levelName = `${course.code} – ${s.year}`;
      out.push(subj(levelName, course.code, null, s.name, s.year, s.term, s.prereqs));
    }

    // GE subjects
    for (const s of COLLEGE_GE) {
      const levelName = `${course.code} – ${s.year}`;
      out.push(subj(levelName, course.code, null, s.name, s.year, s.term, s.prereqs));
    }
  }

  // BSED core (no course_id — shared across all BSED majors)
  for (const s of BSED_CORE) {
    const levelName = `BSED – ${s.year}`;
    out.push(subj(levelName, null, null, s.name, s.year, s.term, s.prereqs));
  }

  return out;
}

function allSubjects(): SubjectDef[] {
  return [
    ...daycareSubjects(),
    ...kinderSubjects(),
    ...elementarySubjects(),
    ...jhsSubjects(),
    ...shsSubjects(),
    ...collegeSubjects(),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEED
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting seed for org:', ORG_ID)
  console.log('  → Programs:', SELECTED_PROGRAMS ? [...SELECTED_PROGRAMS].join(', ') : 'all')

  // Programs — only seed selected ones
  const programMap: Record<string, string> = {}
  for (const p of PROGRAMS) {
    if (!shouldSeed(p.key)) continue
    const rec = await db.program.upsert({
      where: { id: `seed-prog-${p.key}-${ORG_ID}` },
      update: {},
      create: {
        id:     `seed-prog-${p.key}-${ORG_ID}`,
        org_id: ORG_ID,
        name:   p.name,
        type:   p.type,
      },
    })
    programMap[p.key] = rec.id
  }

  // Courses — only if college was selected
  const courseMap: Record<string, string> = {}
  if (shouldSeed('college') && programMap['college']) {
    console.log('  → Courses')
    for (const c of COLLEGE_COURSES) {
      const rec = await db.course.upsert({
        where: { id: `seed-course-${c.code}-${ORG_ID}` },
        update: {},
        create: {
          id:         `seed-course-${c.code}-${ORG_ID}`,
          org_id:     ORG_ID,
          program_id: programMap['college'],
          name:       c.name,
          code:       c.code,
        },
      })
      courseMap[c.code] = rec.id
    }
    for (const m of BSED_MAJORS) {
      const rec = await db.course.upsert({
        where: { id: `seed-course-${m.code}-${ORG_ID}` },
        update: {},
        create: {
          id:         `seed-course-${m.code}-${ORG_ID}`,
          org_id:     ORG_ID,
          program_id: programMap['college'],
          name:       m.name,
          code:       m.code,
        },
      })
      courseMap[m.code] = rec.id
    }
  }

  // Strands — only if shs was selected
  const strandMap: Record<string, string> = {}
  if (shouldSeed('shs') && programMap['shs']) {
    console.log('  → Strands')
    for (const s of SHS_STRAND_DEFS) {
      const rec = await db.strand.upsert({
        where: { id: `seed-strand-${s.name.replace(/\s+/g, '-')}-${ORG_ID}` },
        update: {},
        create: {
          id:         `seed-strand-${s.name.replace(/\s+/g, '-')}-${ORG_ID}`,
          org_id:     ORG_ID,
          program_id: programMap['shs'],
          name:       s.name,
        },
      })
      strandMap[s.name] = rec.id
    }
  }

  // Levels + Sections — only for selected programs
  console.log('  → Levels and Sections')
  const levelDefs = buildLevelDefs().filter((lvl) => shouldSeed(lvl.programKey))
  const levelMap: Record<string, string> = {}
  for (const lvl of levelDefs) {
    const levelKey = `${lvl.programKey}-${lvl.name}`.replace(/\s+/g, '-')
    const rec = await db.level.upsert({
      where: { id: `seed-level-${levelKey}-${ORG_ID}` },
      update: {},
      create: {
        id:         `seed-level-${levelKey}-${ORG_ID}`,
        org_id:     ORG_ID,
        program_id: programMap[lvl.programKey],
        name:       lvl.name,
      },
    })
    levelMap[lvl.name] = rec.id
    for (const sec of lvl.sections) {
      const sectionKey = `${levelKey}-${sec.name}`.replace(/\s+/g, '-')
      await db.section.upsert({
        where: { id: `seed-section-${sectionKey}-${ORG_ID}` },
        update: {},
        create: {
          id:       `seed-section-${sectionKey}-${ORG_ID}`,
          org_id:   ORG_ID,
          level_id: rec.id,
          name:     sec.name,
          capacity: sec.capacity,
        },
      })
    }
  }

  // Grading Scales — filter to selected programs
  console.log('  → Grading Scales')
  const allScaleAssignments = buildScaleAssignments()
  for (const sa of allScaleAssignments) {
    if (!shouldSeed(sa.programKey)) continue
    const levelId = levelMap[sa.levelName]
    if (!levelId) continue
    const scaleKey = `${sa.levelName}-${sa.scaleName}`.replace(/\s+/g, '-')
    await db.gradingScale.upsert({
      where: { id: `seed-scale-${scaleKey}-${ORG_ID}` },
      update: {},
      create: {
        id:             `seed-scale-${scaleKey}-${ORG_ID}`,
        org_id:         ORG_ID,
        level_id:       levelId,
        school_year_id: '',
        name:           sa.scaleName,
        ranges:         sa.ranges,
        is_locked:      false,
      },
    })
  }

  // Grading Schemes — always seed all presets, they're org-level not program-level
  console.log('  → Grading Scheme Presets')
  for (const preset of SCHEME_PRESETS) {
    const schemeKey = preset.name.replace(/\s+/g, '-')
    const existing = await db.gradingScheme.findFirst({
      where: { org_id: ORG_ID, name: preset.name },
    })
    if (existing) continue
    const scheme = await db.gradingScheme.create({
      data: {
        id:         `seed-scheme-${schemeKey}-${ORG_ID}`,
        org_id:     ORG_ID,
        name:       preset.name,
        is_default: false,
        is_locked:  false,
      },
    })
    await db.gradingSchemeComponent.createMany({
      data: preset.components.map((c) => ({
        id:                id(),
        org_id:            ORG_ID,
        grading_scheme_id: scheme.id,
        name:              c.name,
        type:              c.type,
        weight:            c.weight,
        is_optional:       c.isOptional,
      })),
    })
  }

  // Subjects — only for selected programs
  console.log('  → Subjects')
  const subjectDefs = allSubjects().filter((s) => {
    // derive programKey from levelName
    const programKey = deriveProgramKey(s.levelName)
    return shouldSeed(programKey)
  })

  const subjectNameToId: Record<string, string> = {}
  for (const s of subjectDefs) {
    const levelId = levelMap[s.levelName]
    if (!levelId) {
      console.warn(`    ⚠ Level not found: "${s.levelName}" for subject "${s.name}"`)
      continue
    }
    const courseId = s.courseCode ? courseMap[s.courseCode] : null
    const strandId = s.strandName ? strandMap[s.strandName] : null
    const subjectKey = `${s.levelName}-${s.courseCode ?? 'none'}-${s.strandName ?? 'none'}-${s.name}`
      .replace(/\s+/g, '-')

    const existing = await db.subject.findFirst({
      where: {
        org_id:    ORG_ID,
        name:      s.name,
        level_id:  levelId,
        course_id: courseId ?? undefined,
        strand_id: strandId ?? undefined,
      },
    })

    let subjectId: string
    if (existing) {
      subjectId = existing.id
    } else {
      const rec = await db.subject.create({
        data: {
          id:         `seed-subj-${subjectKey}-${ORG_ID}`.substring(0, 100),
          org_id:     ORG_ID,
          name:       s.name,
          level_id:   levelId,
          course_id:  courseId,
          strand_id:  strandId,
          year_level: s.yearLevel,
          term_label: s.termLabel,
          is_locked:  false,
        },
      })
      subjectId = rec.id
    }
    subjectNameToId[s.name] = subjectId
  }

  // Prerequisites — only for seeded subjects
  console.log('  → Prerequisites')
  for (const s of subjectDefs) {
    if (s.prereqNames.length === 0) continue
    const levelId = levelMap[s.levelName]
    if (!levelId) continue
    const subjectId = subjectNameToId[s.name]
    if (!subjectId) continue

    for (const prereqName of s.prereqNames) {
      const cleanName = prereqName.replace(/\s*\(.*?\)\s*$/, '').trim()
      const prereqId = subjectNameToId[cleanName]
      if (!prereqId) {
        console.warn(`    ⚠ Prereq not found: "${cleanName}" for subject "${s.name}"`)
        continue
      }
      await db.subjectPrerequisite.upsert({
        where: {
          subject_id_prerequisite_id: {
            subject_id:      subjectId,
            prerequisite_id: prereqId,
          },
        },
        update: {},
        create: {
          id:              id(),
          org_id:          ORG_ID,
          subject_id:      subjectId,
          prerequisite_id: prereqId,
        },
      })
    }
  }

  console.log('✅ Seed complete.')
}

function buildScaleAssignments() {
  const out: { programKey: string; levelName: string; scaleName: string; ranges: object }[] = []
  for (const name of ['Daycare 1', 'Daycare 2']) {
    out.push({ programKey: 'daycare', levelName: name, scaleName: 'Pass/Fail Scale', ranges: SCALE_PASSFAIL })
  }
  for (const name of ['Kinder 1', 'Kinder 2']) {
    out.push({ programKey: 'kinder', levelName: name, scaleName: 'Pass/Fail Scale', ranges: SCALE_PASSFAIL })
  }
  for (let g = 1; g <= 6; g++) {
    out.push({ programKey: 'elementary', levelName: `Grade ${g}`, scaleName: 'K-12 Scale', ranges: SCALE_K12 })
  }
  for (let g = 7; g <= 10; g++) {
    out.push({ programKey: 'jhs', levelName: `Grade ${g}`, scaleName: 'K-12 Scale', ranges: SCALE_K12 })
  }
  for (const strand of SHS_STRANDS) {
    for (const g of [11, 12]) {
      out.push({ programKey: 'shs', levelName: `Grade ${g} – ${strand}`, scaleName: 'K-12 Scale', ranges: SCALE_K12 })
    }
  }
  for (const course of COLLEGE_COURSES) {
    for (let y = 1; y <= course.years; y++) {
      out.push({ programKey: 'college', levelName: `${course.code} – ${YEAR_LABELS[y - 1]}`, scaleName: 'College Numeric Scale (1.0–5.0)', ranges: SCALE_COLLEGE })
    }
  }
  return out
}
function deriveProgramKey(levelName: string): string {
  if (levelName.startsWith('Daycare'))  return 'daycare'
  if (levelName.startsWith('Kinder'))   return 'kinder'
  if (levelName.startsWith('Grade 1') || levelName.startsWith('Grade 2') ||
      levelName.startsWith('Grade 3') || levelName.startsWith('Grade 4') ||
      levelName.startsWith('Grade 5') || levelName.startsWith('Grade 6'))  return 'elementary'
  if (levelName.startsWith('Grade 7')  || levelName.startsWith('Grade 8') ||
      levelName.startsWith('Grade 9')  || levelName.startsWith('Grade 10')) return 'jhs'
  if (levelName.startsWith('Grade 11') || levelName.startsWith('Grade 12')) return 'shs'
  return 'college'
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());


/**
 * Structure seeded in order:
 *
 * Programs → Courses → Strands → Levels → Sections → Grading Scales → Grading Schemes → Subjects → Prerequisites
 *
 * Key decisions made automatically:
 *
 * - College levels are per-course (BSIT – 1st Year, BSBA – 1st Year, etc.) matching your data
 *
 * - Daycare scheme drops Projects/Crafts:
 *   Play 40 + Participation 30 + Behavior 20 + Health 10 = 100%
 *
 * - Grading scales:
 *   school_year_id seeds as '' (empty string, nullable-ish placeholder).
 *   If your schema enforces a foreign key, make school_year_id optional (String?)
 *   or seed a placeholder school year first.
 *
 * - All 6 schemes seeded as named presets with is_default: false
 *   → Admin selects one during onboarding
 *
 * - BSED core subjects:
 *   course_id = null (shared across all BSED majors)
 *   BSED majors are separate Course rows for specialization subjects
 *
 * To run:
 *   SEED_ORG_ID=your-org-uuid npx ts-node seed.ts
 *
 * Schema fix needed:
 *   GradingScale.school_year_id should be String? (nullable)
 *   to support seeding before a school year exists.
 *   Currently String → seed uses '' as workaround.
 */