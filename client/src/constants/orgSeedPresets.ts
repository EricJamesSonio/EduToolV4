import type { GradingScalePayload } from '../modules/admin/system/types/organization.types';

export const seedPrograms = [
  { key: 'daycare', name: 'Daycare / Pre-School' },
  { key: 'kinder', name: 'Kindergarten' },
  { key: 'elementary', name: 'Elementary School' },
  { key: 'jhs', name: 'Junior High School' },
  { key: 'shs', name: 'Senior High School' },
  { key: 'college', name: 'College / University' },
];

export const seedCourses = [
  { code: 'BSIT', name: 'BS Information Technology' },
  { code: 'BSBA', name: 'BS Business Administration' },
  { code: 'BSED', name: 'Bachelor of Secondary Education' },
  { code: 'BSA', name: 'BS Accountancy' },
  { code: 'BSCS', name: 'BS Computer Science' },
  { code: 'BSHM', name: 'BS Hospitality Management' },
  { code: 'BSCRIM', name: 'BS Criminology' },
  { code: 'BSTM', name: 'BS Tourism Management' },
  { code: 'BSED-ENG', name: 'BSED - English Major' },
  { code: 'BSED-MATH', name: 'BSED - Mathematics Major' },
  { code: 'BSED-SCI', name: 'BSED - Science Major' },
  { code: 'BSED-SS', name: 'BSED - Social Studies Major' },
  { code: 'BSED-FIL', name: 'BSED - Filipino Major' },
  { code: 'BSED-TLE', name: 'BSED - TLE Major' },
];

export const seedStrands = [
  'ABM',
  'STEM',
  'HUMSS',
  'GAS',
  'ICT',
  'HE',
  'IA',
  'Agri-Fishery',
  'Sports',
  'Arts and Design',
];

export const seedLevels = [
  { programKey: 'daycare', name: 'Daycare 1' },
  { programKey: 'daycare', name: 'Daycare 2' },
  { programKey: 'kinder', name: 'Kinder 1' },
  { programKey: 'kinder', name: 'Kinder 2' },
  { programKey: 'elementary', name: 'Grade 1' },
  { programKey: 'elementary', name: 'Grade 2' },
  { programKey: 'elementary', name: 'Grade 3' },
  { programKey: 'elementary', name: 'Grade 4' },
  { programKey: 'elementary', name: 'Grade 5' },
  { programKey: 'elementary', name: 'Grade 6' },
  { programKey: 'jhs', name: 'Grade 7' },
  { programKey: 'jhs', name: 'Grade 8' },
  { programKey: 'jhs', name: 'Grade 9' },
  { programKey: 'jhs', name: 'Grade 10' },
  { programKey: 'shs', name: 'Grade 11' },
  { programKey: 'shs', name: 'Grade 12' },
  { programKey: 'college', name: '1st Year' },
  { programKey: 'college', name: '2nd Year' },
  { programKey: 'college', name: '3rd Year' },
  { programKey: 'college', name: '4th Year' },
  { programKey: 'college', name: '5th Year' },
];

export const seedLevelDefaults: Record<string, { label: string; defaultCount: number; min: number; max: number }> = {
  daycare: { label: 'Daycare levels', defaultCount: 2, min: 1, max: 5 },
  kinder: { label: 'Kindergarten levels', defaultCount: 2, min: 1, max: 3 },
  elementary: { label: 'Elementary grade levels', defaultCount: 6, min: 1, max: 6 },
  jhs: { label: 'Junior High School grade levels', defaultCount: 4, min: 1, max: 4 },
  shs: { label: 'Senior High School grade levels', defaultCount: 2, min: 1, max: 2 },
  college: { label: 'College year levels', defaultCount: 4, min: 1, max: 5 },
};

export const generateSeedLevelNames = (programKey: string, count: number): string[] => {
  switch (programKey) {
    case 'daycare':
      return Array.from({ length: count }, (_, index) => `Daycare ${index + 1}`);
    case 'kinder':
      return Array.from({ length: count }, (_, index) => `Kinder ${index + 1}`);
    case 'elementary':
      return Array.from({ length: count }, (_, index) => `Grade ${index + 1}`);
    case 'jhs':
      return Array.from({ length: count }, (_, index) => `Grade ${index + 7}`);
    case 'shs':
      return Array.from({ length: count }, (_, index) => `Grade ${index + 11}`);
    case 'college': {
      const labels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
      return labels.slice(0, count);
    }
    default:
      return [];
  }
};

const k12Scale = [
  { label: 'Outstanding', minScore: 90, maxScore: 100, gradeValue: '1.0' },
  { label: 'Very Satisfactory', minScore: 85, maxScore: 89, gradeValue: '2.0' },
  { label: 'Satisfactory', minScore: 80, maxScore: 84, gradeValue: '3.0' },
  { label: 'Fairly Satisfactory', minScore: 75, maxScore: 79, gradeValue: '4.0' },
  { label: 'Did Not Meet', minScore: 0, maxScore: 74, gradeValue: '5.0' },
];

const collegeScale = [
  { label: 'Excellent', minScore: 97, maxScore: 100, gradeValue: '1.0' },
  { label: 'Very Good', minScore: 93, maxScore: 96, gradeValue: '1.25' },
  { label: 'Very Good', minScore: 89, maxScore: 92, gradeValue: '1.5' },
  { label: 'Good', minScore: 85, maxScore: 88, gradeValue: '1.75' },
  { label: 'Good', minScore: 82, maxScore: 84, gradeValue: '2.0' },
  { label: 'Satisfactory', minScore: 78, maxScore: 81, gradeValue: '2.25' },
  { label: 'Satisfactory', minScore: 75, maxScore: 77, gradeValue: '2.5' },
  { label: 'Passing', minScore: 70, maxScore: 74, gradeValue: '2.75' },
  { label: 'Passing', minScore: 65, maxScore: 69, gradeValue: '3.0' },
  { label: 'Conditional', minScore: 55, maxScore: 64, gradeValue: '4.0' },
  { label: 'Fail', minScore: 0, maxScore: 54, gradeValue: '5.0' },
];

const passFailScale = [
  { label: 'Pass', minScore: 75, maxScore: 100, gradeValue: 'P' },
  { label: 'Fail', minScore: 0, maxScore: 74, gradeValue: 'F' },
];

export const seedGradingScales: Record<string, GradingScalePayload> = {
  daycare: { presetKey: 'pass-fail', name: 'Pass/Fail Scale', ranges: passFailScale },
  kinder: { presetKey: 'pass-fail', name: 'Pass/Fail Scale', ranges: passFailScale },
  elementary: { presetKey: 'k12', name: 'K-12 Scale', ranges: k12Scale },
  jhs: { presetKey: 'k12', name: 'K-12 Scale', ranges: k12Scale },
  shs: { presetKey: 'k12', name: 'K-12 Scale', ranges: k12Scale },
  college: { presetKey: 'college-numeric', name: 'College Numeric Scale', ranges: collegeScale },
};

export const seedGradingSchemes = [
  {
    name: 'Daycare Scheme',
    programKey: 'daycare',
    components: [
      { name: 'Play and Activities', type: 'activity', weight: 40 },
      { name: 'Participation', type: 'manual', weight: 30 },
      { name: 'Behavior', type: 'manual', weight: 20 },
      { name: 'Health and Hygiene', type: 'manual', weight: 10 },
    ],
  },
  {
    name: 'Kindergarten Scheme',
    programKey: 'kinder',
    components: [
      { name: 'Quizzes', type: 'quiz', weight: 20 },
      { name: 'Activities', type: 'activity', weight: 30 },
      { name: 'Behavior', type: 'manual', weight: 20 },
      { name: 'Projects', type: 'activity', weight: 30 },
    ],
  },
  {
    name: 'Elementary Scheme',
    programKey: 'elementary',
    components: [
      { name: 'Quizzes', type: 'quiz', weight: 25 },
      { name: 'Activities', type: 'activity', weight: 25 },
      { name: 'Behavior', type: 'manual', weight: 20 },
      { name: 'Projects', type: 'activity', weight: 20 },
      { name: 'Exams', type: 'exam', weight: 10 },
    ],
  },
  {
    name: 'High School Scheme',
    programKey: 'jhs',
    components: [
      { name: 'Quizzes', type: 'quiz', weight: 20 },
      { name: 'Activities', type: 'activity', weight: 20 },
      { name: 'Behavior', type: 'manual', weight: 20 },
      { name: 'Exams', type: 'exam', weight: 40 },
    ],
  },
  {
    name: 'Senior High School Scheme',
    programKey: 'shs',
    components: [
      { name: 'Quizzes', type: 'quiz', weight: 20 },
      { name: 'Activities', type: 'activity', weight: 20 },
      { name: 'Behavior', type: 'manual', weight: 10 },
      { name: 'Projects', type: 'activity', weight: 10 },
      { name: 'Exams', type: 'exam', weight: 40 },
    ],
  },
  {
    name: 'College Scheme',
    programKey: 'college',
    components: [
      { name: 'Quizzes', type: 'quiz', weight: 20 },
      { name: 'Activities', type: 'activity', weight: 20 },
      { name: 'Behavior', type: 'manual', weight: 20 },
      { name: 'Exams', type: 'exam', weight: 40 },
    ],
  },
];

export const seedSemesterTemplates = [
  {
    name: 'Daycare / Kinder Template',
    programKey: 'daycare',
    semesters: ['Whole Year: 1st Quarter, 2nd Quarter, 3rd Quarter, 4th Quarter'],
  },
  {
    name: 'Kinder Template',
    programKey: 'kinder',
    semesters: ['Whole Year: 1st Quarter, 2nd Quarter, 3rd Quarter, 4th Quarter'],
  },
  {
    name: 'Elementary Semester Template',
    programKey: 'elementary',
    semesters: ['1st Semester: 1st Quarter, 2nd Quarter', '2nd Semester: 3rd Quarter, 4th Quarter'],
  },
  {
    name: 'Junior High School Semester Template',
    programKey: 'jhs',
    semesters: ['1st Semester: 1st Quarter, 2nd Quarter', '2nd Semester: 3rd Quarter, 4th Quarter'],
  },
  {
    name: 'Senior High School Semester Template',
    programKey: 'shs',
    semesters: ['1st Semester: 1st Quarter, 2nd Quarter', '2nd Semester: 3rd Quarter, 4th Quarter'],
  },
  {
    name: 'College Semester Template',
    programKey: 'college',
    semesters: ['1st Semester: Midterm, Finals', '2nd Semester: Midterm, Finals'],
  },
];

export const seedSubjectGroups = [
  { programKey: 'daycare', name: 'Daycare subjects', detail: 'Activity-based daycare subjects.' },
  { programKey: 'kinder', name: 'Kindergarten subjects', detail: 'Kinder readiness and foundational subjects.' },
  { programKey: 'elementary', name: 'Elementary subjects', detail: 'Grade 1 to Grade 6 core subjects.' },
  { programKey: 'jhs', name: 'Junior High School subjects', detail: 'Grade 7 to Grade 10 core subjects.' },
  { programKey: 'shs', name: 'Senior High School subjects', detail: 'SHS core, strand, and shared subjects.' },
  { programKey: 'college', name: 'College subjects', detail: 'College majors and general education subjects.' },
];

export const seedSubjectCatalog: Record<string, string[]> = {
  'Daycare 1': [
    'Language and Literacy',
    'Cognitive and Numeracy Skills',
    'Physical Development, Health, and Safety',
    'Social and Emotional Development',
    'Creative Arts and Music',
    'Understanding the World / Discovery',
  ],
  'Daycare 2': [
    'Language and Literacy',
    'Cognitive and Numeracy Skills',
    'Physical Development, Health, and Safety',
    'Social and Emotional Development',
    'Creative Arts and Music',
    'Understanding the World / Discovery',
  ],
  'Kinder 1': [
    'Language, Literacy, and Communication',
    'Mathematical Thinking',
    'Physical Development, Health, and Safety',
    'Social and Emotional Development / Values Formation',
    'Creative Arts',
    'Understanding the World / Discovery',
  ],
  'Kinder 2': [
    'Language, Literacy, and Communication',
    'Mathematical Thinking',
    'Physical Development, Health, and Safety',
    'Social and Emotional Development / Values Formation',
    'Creative Arts',
    'Understanding the World / Discovery',
  ],
  'Grade 1': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'Edukasyon sa Pagpapakatao (ESP)'],
  'Grade 2': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'Edukasyon sa Pagpapakatao (ESP)'],
  'Grade 3': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'Edukasyon sa Pagpapakatao (ESP)'],
  'Grade 4': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'Edukasyon sa Pagpapakatao (ESP)'],
  'Grade 5': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'Edukasyon sa Pagpapakatao (ESP)'],
  'Grade 6': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'Edukasyon sa Pagpapakatao (ESP)'],
  'Grade 7': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'Edukasyon sa Pagpapakatao (ESP)', 'TLE'],
  'Grade 8': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'Edukasyon sa Pagpapakatao (ESP)', 'TLE'],
  'Grade 9': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'Edukasyon sa Pagpapakatao (ESP)', 'TLE'],
  'Grade 10': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'Edukasyon sa Pagpapakatao (ESP)', 'TLE'],
  'Grade 11': ['Oral Communication', 'Reading and Writing Skills', 'General Mathematics', 'Earth and Life Science', 'Physical Education / Health'],
  'Grade 12': ['Practical Research', 'Entrepreneurship', 'Contemporary Philippine Arts', 'Physical Education / Health'],
  college_ge: [
    'Mathematics in the Modern World',
    'Understanding the Self',
    'Contemporary World',
    'Readings in Philippine History',
    'Life and Works of Jose Rizal',
    'Ethics',
    'Art Appreciation',
    'Science, Technology, and Society',
    'National Service Training Program (NSTP)',
  ],
};

export const seedPayloadFeatureLabels = [
  'Programs',
  'Courses',
  'Strands',
  'Levels',
  'Sections',
  'Subjects',
  'Grading schemes',
  'Grading scales',
  'Semester templates',
];
