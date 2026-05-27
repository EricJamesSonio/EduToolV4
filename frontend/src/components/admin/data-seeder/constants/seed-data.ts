export const PROGRAMS = [
  { key: "daycare",    label: "Daycare / Pre-School" },
  { key: "kinder",     label: "Kindergarten" },
  { key: "elementary", label: "Elementary School" },
  { key: "jhs",        label: "Junior High School" },
  { key: "shs",        label: "Senior High School" },
  { key: "college",    label: "College / University" },
]

export const COLLEGE_COURSES = [
  { code: "BSIT",      name: "BS Information Technology",      years: 4 },
  { code: "BSBA",      name: "BS Business Administration",     years: 4 },
  { code: "BSED",      name: "Bachelor of Secondary Education", years: 4 },
  { code: "BSA",       name: "BS Accountancy",                 years: 5 },
  { code: "BSCS",      name: "BS Computer Science",            years: 4 },
  { code: "BSHM",      name: "BS Hospitality Management",      years: 4 },
  { code: "BSCRIM",    name: "BS Criminology",                 years: 4 },
  { code: "BSTM",      name: "BS Tourism Management",          years: 4 },
  { code: "BSED-ENG",  name: "BSED – English Major",           years: 4 },
  { code: "BSED-MATH", name: "BSED – Mathematics Major",       years: 4 },
  { code: "BSED-SCI",  name: "BSED – Science Major",            years: 4 },
  { code: "BSED-SS",   name: "BSED – Social Studies Major",    years: 4 },
  { code: "BSED-FIL",  name: "BSED – Filipino Major",          years: 4 },
  { code: "BSED-TLE",  name: "BSED – TLE Major",               years: 4 },
]

export const SHS_STRANDS = [
  "ABM", "STEM", "HUMSS", "GAS", "ICT", "HE", "IA", "Agri-Fishery", "Sports", "Arts and Design",
]

export const COLLEGE_GE_SUBJECTS = [
  "Mathematics in the Modern World",
  "Purposive Communication",
  "Understanding the Self",
  "Readings in Philippine History",
  "The Contemporary World",
  "Life and Works of Jose Rizal",
  "Physical Education 1",
  "Physical Education 2",
  "Ethics",
  "Art Appreciation",
  "Science, Technology, and Society",
  "NSTP 1",
  "NSTP 2",
] as const

export const SHS_MINOR_SUBJECTS = [
  "Oral Communication", "Reading and Writing Skills", "Mathematics in the Modern World",
  "Understanding the Self", "Contemporary World", "Readings in Philippine History",
  "Physical Education / Health", "Life and Works of Jose Rizal", "National Service Training Program (NSTP)",
  "Art Appreciation",
] as const

export const COLLEGE_GE_SET = new Set<string>(COLLEGE_GE_SUBJECTS)
export const SHS_MINOR_SET = new Set<string>(SHS_MINOR_SUBJECTS)

export const COLLEGE_GE_LEVEL: Record<string, string> = {
  "Mathematics in the Modern World":  "1st Year",
  "Purposive Communication":          "1st Year",
  "Understanding the Self":           "1st Year",
  "Readings in Philippine History":   "1st Year",
  "The Contemporary World":           "1st Year",
  "Life and Works of Jose Rizal":     "1st Year",
  "Physical Education 1":             "1st Year",
  "Physical Education 2":             "2nd Year",
  "Ethics":                           "2nd Year",
  "Art Appreciation":                 "2nd Year",
  "Science, Technology, and Society": "2nd Year",
  "NSTP 1":                           "2nd Year",
  "NSTP 2":                           "2nd Year",
}

export const SHS_MINOR_LEVEL: Record<string, string> = {
  "Oral Communication":                       "Grade 11",
  "Reading and Writing Skills":               "Grade 11",
  "Mathematics in the Modern World":          "Grade 11",
  "Understanding the Self":                   "Grade 11",
  "Contemporary World":                       "Grade 11",
  "Readings in Philippine History":           "Grade 11",
  "Physical Education / Health":              "Grade 11",
  "Life and Works of Jose Rizal":             "Grade 11",
  "National Service Training Program (NSTP)": "Grade 12",
  "Art Appreciation":                         "Grade 12",
}

export const LEVEL_DEFS: Record<string, string[]> = {
  daycare:    ["Daycare 1", "Daycare 2"],
  kinder:     ["Kinder 1", "Kinder 2"],
  elementary: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
  jhs:        ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
  shs:        ["Grade 11", "Grade 12"],
  college:    ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"],
}

// ===== GRADING SCHEMES =====
export type GradingSchemeComponent = {
  name: string
  type: string
  weight: number
  isOptional: boolean
}

export type GradingSchemeTemplate = {
  name: string
  programType: string
  components: GradingSchemeComponent[]
}

export const GRADING_SCHEME_TEMPLATES: GradingSchemeTemplate[] = [
  {
    name: 'Daycare Scheme',
    programType: 'daycare',
    components: [
      { name: 'Play and Activities', type: 'activity', weight: 40, isOptional: false },
      { name: 'Participation', type: 'manual', weight: 30, isOptional: false },
      { name: 'Behavior', type: 'manual', weight: 20, isOptional: false },
      { name: 'Health and Hygiene', type: 'manual', weight: 10, isOptional: false },
    ],
  },
  {
    name: 'Kindergarten Scheme',
    programType: 'kinder',
    components: [
      { name: 'Quizzes', type: 'quiz', weight: 20, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 30, isOptional: false },
      { name: 'Behavior', type: 'manual', weight: 20, isOptional: false },
      { name: 'Projects', type: 'activity', weight: 30, isOptional: false },
    ],
  },
  {
    name: 'Elementary Scheme',
    programType: 'elementary',
    components: [
      { name: 'Quizzes', type: 'quiz', weight: 25, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 25, isOptional: false },
      { name: 'Behavior', type: 'manual', weight: 20, isOptional: false },
      { name: 'Projects', type: 'activity', weight: 20, isOptional: false },
      { name: 'Exams', type: 'exam', weight: 10, isOptional: false },
    ],
  },
  {
    name: 'High School Scheme',
    programType: 'jhs',
    components: [
      { name: 'Quizzes', type: 'quiz', weight: 20, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 20, isOptional: false },
      { name: 'Behavior', type: 'manual', weight: 20, isOptional: false },
      { name: 'Exams', type: 'exam', weight: 40, isOptional: false },
    ],
  },
  {
    name: 'Senior High School Scheme',
    programType: 'shs',
    components: [
      { name: 'Quizzes', type: 'quiz', weight: 20, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 20, isOptional: false },
      { name: 'Behavior', type: 'manual', weight: 10, isOptional: false },
      { name: 'Projects', type: 'activity', weight: 10, isOptional: false },
      { name: 'Exams', type: 'exam', weight: 40, isOptional: false },
    ],
  },
  {
    name: 'College Scheme',
    programType: 'college',
    components: [
      { name: 'Quizzes', type: 'quiz', weight: 20, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 20, isOptional: false },
      { name: 'Behavior', type: 'manual', weight: 20, isOptional: false },
      { name: 'Exams', type: 'exam', weight: 40, isOptional: false },
    ],
  },
]

// ===== SEMESTER TEMPLATES =====
export type SemesterTerm = {
  name: string
  order_index: number
}

export type SemesterItem = {
  name: string
  order_index: number
  terms: SemesterTerm[]
}

export type SemesterTemplate = {
  name: string
  programType: string
  semesters: SemesterItem[]
}

export const SEMESTER_TEMPLATES: SemesterTemplate[] = [
  {
    name: 'Daycare / Kinder Template',
    programType: 'daycare',
    semesters: [
      {
        name: 'Whole Year',
        order_index: 0,
        terms: [
          { name: '1st Quarter', order_index: 0 },
          { name: '2nd Quarter', order_index: 1 },
          { name: '3rd Quarter', order_index: 2 },
          { name: '4th Quarter', order_index: 3 },
        ],
      },
    ],
  },
  {
    name: 'Kinder Template',
    programType: 'kinder',
    semesters: [
      {
        name: 'Whole Year',
        order_index: 0,
        terms: [
          { name: '1st Quarter', order_index: 0 },
          { name: '2nd Quarter', order_index: 1 },
          { name: '3rd Quarter', order_index: 2 },
          { name: '4th Quarter', order_index: 3 },
        ],
      },
    ],
  },
  {
    name: 'Elementary Semester Template',
    programType: 'elementary',
    semesters: [
      {
        name: '1st Semester',
        order_index: 0,
        terms: [
          { name: '1st Quarter', order_index: 0 },
          { name: '2nd Quarter', order_index: 1 },
        ],
      },
      {
        name: '2nd Semester',
        order_index: 1,
        terms: [
          { name: '3rd Quarter', order_index: 0 },
          { name: '4th Quarter', order_index: 1 },
        ],
      },
    ],
  },
  {
    name: 'Junior High School Semester Template',
    programType: 'jhs',
    semesters: [
      {
        name: '1st Semester',
        order_index: 0,
        terms: [
          { name: '1st Quarter', order_index: 0 },
          { name: '2nd Quarter', order_index: 1 },
        ],
      },
      {
        name: '2nd Semester',
        order_index: 1,
        terms: [
          { name: '3rd Quarter', order_index: 0 },
          { name: '4th Quarter', order_index: 1 },
        ],
      },
    ],
  },
  {
    name: 'Senior High School Semester Template',
    programType: 'shs',
    semesters: [
      {
        name: '1st Semester',
        order_index: 0,
        terms: [
          { name: '1st Quarter', order_index: 0 },
          { name: '2nd Quarter', order_index: 1 },
        ],
      },
      {
        name: '2nd Semester',
        order_index: 1,
        terms: [
          { name: '3rd Quarter', order_index: 0 },
          { name: '4th Quarter', order_index: 1 },
        ],
      },
    ],
  },
  {
    name: 'College Semester Template',
    programType: 'college',
    semesters: [
      {
        name: '1st Semester',
        order_index: 0,
        terms: [
          { name: 'Midterm', order_index: 0 },
          { name: 'Finals', order_index: 1 },
        ],
      },
      {
        name: '2nd Semester',
        order_index: 1,
        terms: [
          { name: 'Midterm', order_index: 0 },
          { name: 'Finals', order_index: 1 },
        ],
      },
    ],
  },
]

export const SEMESTER_TEMPLATE_BY_PROGRAM: Record<string, SemesterTemplate> = Object.fromEntries(
  SEMESTER_TEMPLATES.map((t) => [t.programType, t])
)

// ===== REST OF EXISTING DATA =====
export const LEVEL_MAX: Record<string, number> = {
  daycare:    5,
  kinder:     3,
  elementary: 12,
  jhs:        6,
  shs:        4,
  college:    5,
}

export const LEVEL_MIN: Record<string, number> = {
  daycare:    1,
  kinder:     1,
  elementary: 1,
  jhs:        1,
  shs:        1,
  college:    1,
}

export const COLLEGE_YEAR_LABELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]

export function generateLevelNames(prog: string, count: number): string[] {
  switch (prog) {
    case "daycare":    return Array.from({ length: count }, (_, i) => `Daycare ${i + 1}`)
    case "kinder":     return Array.from({ length: count }, (_, i) => `Kinder ${i + 1}`)
    case "elementary": return Array.from({ length: count }, (_, i) => `Grade ${i + 1}`)
    case "jhs":        return Array.from({ length: count }, (_, i) => `Grade ${i + 7}`)
    case "shs":        return Array.from({ length: count }, (_, i) => `Grade ${i + 11}`)
    case "college":    return Array.from({ length: count }, (_, i) => COLLEGE_YEAR_LABELS[i] ?? `Year ${i + 1}`)
    default:           return Array.from({ length: count }, (_, i) => `Level ${i + 1}`)
  }
}

export function getDefaultLevelNames(entityKey: string): string[] {
  if (LEVEL_DEFS[entityKey]) return [...LEVEL_DEFS[entityKey]]
  const course = COLLEGE_COURSES.find((c) => c.code === entityKey)
  if (course) return COLLEGE_YEAR_LABELS.slice(0, course.years)
  if (SHS_STRANDS.includes(entityKey)) return [...LEVEL_DEFS["shs"]]
  return generateLevelNames(entityKey, 4)
}

export const SUBJECT_SEP = "::"

export function subjectKey(groupName: string, subjectName: string): string {
  return `${groupName}${SUBJECT_SEP}${subjectName}`
}

export function parseSubjectKey(key: string): { groupName: string; subjectName: string } {
  const idx = key.indexOf(SUBJECT_SEP)
  if (idx === -1) return { groupName: "", subjectName: key }
  return {
    groupName:   key.slice(0, idx),
    subjectName: key.slice(idx + SUBJECT_SEP.length),
  }
}

export const LEVEL_SUBJECTS: Record<string, string[]> = {
  "Daycare 1": [
    "Language and Literacy", "Cognitive and Numeracy Skills", "Physical Development, Health, and Safety",
    "Social and Emotional Development", "Creative Arts and Music", "Understanding the World / Discovery",
  ],
  "Daycare 2": [
    "Language and Literacy", "Cognitive and Numeracy Skills", "Physical Development, Health, and Safety",
    "Social and Emotional Development", "Creative Arts and Music", "Understanding the World / Discovery",
  ],
  "Kinder 1": [
    "Language, Literacy, and Communication", "Mathematical Thinking", "Physical Development, Health, and Safety",
    "Social and Emotional Development / Values Formation", "Creative Arts", "Understanding the World / Discovery",
  ],
  "Kinder 2": [
    "Language, Literacy, and Communication", "Mathematical Thinking", "Physical Development, Health, and Safety",
    "Social and Emotional Development / Values Formation", "Creative Arts", "Understanding the World / Discovery",
  ],
  "Grade 1":  ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 2":  ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 3":  ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 4":  ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 5":  ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 6":  ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 7":  ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)","TLE"],
  "Grade 8":  ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)","TLE"],
  "Grade 9":  ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)","TLE"],
  "Grade 10": ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)","TLE"],
}

export interface GradeRange {
  label:      string
  minScore:   number
  maxScore:   number
  gradeValue: string
}

export interface GradingScalePreset {
  key:    string
  name:   string
  ranges: GradeRange[]
}

export const GRADING_SCALE_PRESETS: GradingScalePreset[] = [
  {
    key:  "deped_k12",
    name: "DepEd K–12 (Proficiency-Based)",
    ranges: [
      { label: "Outstanding",              minScore: 90, maxScore: 100, gradeValue: "A"  },
      { label: "Very Satisfactory",        minScore: 85, maxScore: 89,  gradeValue: "B+" },
      { label: "Satisfactory",             minScore: 80, maxScore: 84,  gradeValue: "B"  },
      { label: "Fairly Satisfactory",      minScore: 75, maxScore: 79,  gradeValue: "C"  },
      { label: "Did Not Meet Expectation", minScore: 0,  maxScore: 74,  gradeValue: "F"  },
    ],
  },
  {
    key:  "college_5pt",
    name: "College 5-Point Scale (CHED)",
    ranges: [
      { label: "Excellent",         minScore: 97, maxScore: 100, gradeValue: "1.00" },
      { label: "Superior",          minScore: 94, maxScore: 96,  gradeValue: "1.25" },
      { label: "Very Good",         minScore: 91, maxScore: 93,  gradeValue: "1.50" },
      { label: "Good",              minScore: 88, maxScore: 90,  gradeValue: "1.75" },
      { label: "Meritorious",       minScore: 85, maxScore: 87,  gradeValue: "2.00" },
      { label: "Very Satisfactory", minScore: 82, maxScore: 84,  gradeValue: "2.25" },
      { label: "Satisfactory",      minScore: 79, maxScore: 81,  gradeValue: "2.50" },
      { label: "Fairly Good",       minScore: 76, maxScore: 78,  gradeValue: "2.75" },
      { label: "Passing",           minScore: 75, maxScore: 75,  gradeValue: "3.00" },
      { label: "Failure",           minScore: 0,  maxScore: 74,  gradeValue: "5.00" },
    ],
  },
  {
    key:  "letter_grade",
    name: "Standard Letter Grade (A–F)",
    ranges: [
      { label: "A+", minScore: 97, maxScore: 100, gradeValue: "A+" },
      { label: "A",  minScore: 93, maxScore: 96,  gradeValue: "A"  },
      { label: "A−", minScore: 90, maxScore: 92,  gradeValue: "A−" },
      { label: "B+", minScore: 87, maxScore: 89,  gradeValue: "B+" },
      { label: "B",  minScore: 83, maxScore: 86,  gradeValue: "B"  },
      { label: "B−", minScore: 80, maxScore: 82,  gradeValue: "B−" },
      { label: "C+", minScore: 77, maxScore: 79,  gradeValue: "C+" },
      { label: "C",  minScore: 73, maxScore: 76,  gradeValue: "C"  },
      { label: "C−", minScore: 70, maxScore: 72,  gradeValue: "C−" },
      { label: "D",  minScore: 60, maxScore: 69,  gradeValue: "D"  },
      { label: "F",  minScore: 0,  maxScore: 59,  gradeValue: "F"  },
    ],
  },
  {
    key:  "pass_fail",
    name: "Pass / Fail",
    ranges: [
      { label: "Pass", minScore: 75, maxScore: 100, gradeValue: "P" },
      { label: "Fail", minScore: 0,  maxScore: 74,  gradeValue: "F" },
    ],
  },
]

export const SHS_STRAND_SUBJECTS: Record<string, string[]> = {
  ABM: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Fundamentals of Accounting","Business Math","Fundamentals of Economics",
    "Principles of Management","Entrepreneurship","Organization and Management",
    "Business Finance","Business Ethics","Applied Economics","Strategic Business Planning",
  ],
  STEM: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "General Biology","General Chemistry","General Physics","Earth and Life Science",
    "Calculus and Analytical Geometry","Advanced Physics","Organic Chemistry",
    "Research in Science","Engineering and Technology Applications","Applied Mathematics",
  ],
  HUMSS: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Introduction to Philosophy","Understanding Culture and Society","Creative Writing",
    "Philippine Politics and Governance","Psychology","Social Research and Statistics",
    "World History and Globalization","Philosophy of Human Person",
    "Economics for Social Sciences","Applied Social Sciences / Ethics in Society",
  ],
  GAS: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Introduction to Humanities","Introduction to Social Sciences",
    "Fundamentals of Business and Management","Basic Principles of Science and Technology",
    "Creative Writing","Introduction to Philosophy","Research Methods / Applied Research",
    "Economics / Business Economics","Social Issues and Ethics","Interdisciplinary Elective",
  ],
  ICT: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Computer Programming 1","Introduction to Computing","Web Development 1 (HTML, CSS)",
    "Computer Programming 2","Web Development 2 (JavaScript)","Database Management Systems",
    "Systems Analysis and Design","Mobile Application Development",
    "Computer Networks and Security","Capstone Project","ICT Project Management",
    "Emerging Technologies in ICT",
  ],
  HE: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Introduction to Home Economics","Cookery / Culinary Basics","Bread and Pastry Production",
    "Food and Beverage Services","Housekeeping","Caregiving (Basic)","Dressmaking / Tailoring",
    "Advanced Cookery / International Cuisine","Events Management Services",
    "Entrepreneurship in Home Economics","Work Immersion (OJT)","Capstone Project / Practical Assessment",
  ],
  IA: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Introduction to Industrial Arts","Basic Electrical Installation and Maintenance",
    "Carpentry Fundamentals","Shielded Metal Arc Welding (SMAW) NC I","Plumbing Basics",
    "Automotive Servicing NC I","Electrical Installation and Maintenance NC II",
    "Shielded Metal Arc Welding (SMAW) NC II","Advanced Carpentry / Construction Technology",
    "Industrial Safety and Maintenance","Work Immersion (OJT)","Capstone Project / Practical Assessment",
  ],
  "Agri-Fishery": [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Introduction to Agri-Fishery Arts","Crop Production (Basic)","Animal Production (Basic)",
    "Aquaculture (Basic)","Horticulture","Agricultural Machinery and Tools",
    "Crop Production NC II","Animal Production NC II","Aquaculture NC II","Farm Management",
    "Work Immersion (OJT)","Capstone Project / Practical Assessment",
  ],
  Sports: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Introduction to Sports Science","Physical Fitness and Conditioning",
    "Fundamentals of Coaching","Sports Officiating and Rules","Sports Psychology",
    "Safety and First Aid in Sports","Advanced Coaching and Training Techniques",
    "Sports Event Management","Anatomy and Physiology for Athletes",
    "Sports Analytics and Performance Analysis","Work Immersion (OJT)",
    "Capstone Project / Practical Assessment",
  ],
  "Arts and Design": [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Introduction to Arts and Design","Elements and Principles of Design",
    "Creative Industries I (Applied Arts)","Creative Industries II (Media Arts)",
    "Fundamentals of Performing Arts","Visual Arts Production","Specialization in Arts",
    "Portfolio Development","Arts Production and Management","Contemporary Arts Practices",
    "Work Immersion (OJT)","Capstone Project / Culminating Exhibit",
  ],
}

export const COURSE_SUBJECTS: Record<string, string[]> = {
  BSIT: [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "Introduction to Computing","Computer Programming 1","Computer Programming 2",
    "Data Structures and Algorithms","Database Management Systems",
    "Web Systems and Technologies","Software Engineering","Human-Computer Interaction",
    "Operating Systems","Computer Networks","Information Assurance and Security",
    "Systems Analysis and Design","IT Project Management","Capstone Project / Thesis",
  ],
  BSBA: [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "Principles of Management","Microeconomics","Macroeconomics","Business Statistics",
    "Principles of Marketing","Financial Management","Business Law",
    "Human Resource Management","Operations Management","Business Ethics",
    "Organizational Behavior","Strategic Management","International Business",
    "Entrepreneurial Management","Business Research","Project Management",
  ],
  BSA: [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "Fundamentals of Accounting","Financial Accounting and Reporting I","Business Law",
    "Management Accounting","Regulatory Framework and Legal Issues in Business",
    "Cost Accounting","Accounting Information Systems","Auditing Theory",
    "Advanced Financial Accounting and Reporting","Financial Management",
    "Auditing and Assurance Services","Taxation (Income Tax, Business Tax)",
    "Strategic Cost Management",
    "Governance, Business Ethics, Risk Management, and Internal Control",
    "Accounting Research","Integrated Review Courses (Board Exam Preparation)",
    "Advanced Taxation","CPA Licensure Exam Review",
  ],
  BSCS: [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "Introduction to Computing","Computer Programming 1","Computer Programming 2",
    "Discrete Mathematics","Object-Oriented Programming","Computer Architecture",
    "Data Structures and Algorithms","Database Systems","Algorithms and Complexity",
    "Automata Theory","Operating Systems","Numerical Methods","Programming Languages",
    "Software Engineering","Computer Networks","Human-Computer Interaction",
    "Artificial Intelligence","Machine Learning","CS Thesis / Capstone Project",
  ],
  BSHM: [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "Introduction to Hospitality Industry","Food and Beverage Service Operations",
    "Housekeeping Operations","Front Office Operations","Culinary Arts / Basic Cooking",
    "Hospitality Marketing","Hospitality Financial Management","Food Safety and Sanitation",
    "Hospitality Law","Customer Service Management","Tourism Planning and Development",
    "Hotel and Restaurant Management","Beverage Management (Bar and Drinks)",
    "Event Management","Banquet and Catering Management","Entrepreneurship in Hospitality",
    "Internship / OJT",
  ],
  BSCRIM: [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "Introduction to Criminology","Criminal Law","Criminological Theories",
    "Law Enforcement Administration","Ethics and Moral Values in Law Enforcement",
    "Criminalistics / Forensic Science","Crime Detection and Investigation",
    "Juvenile Delinquency","Police Administration","Criminal Psychology",
    "Correctional Administration","Disaster and Risk Management",
    "Research in Criminology","Criminal Investigation Practicum",
    "Community Policing and Public Safety",
  ],
  BSTM: [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "Principles of Tourism","Tourism Research and Statistics",
    "Tourism Planning and Development","Travel Agency Operations",
    "Tour Guiding and Tour Operations","Hospitality and Tourism Law",
    "Tourism Marketing and Promotion","Event and Convention Management",
    "Sustainable Tourism","Cultural and Heritage Tourism",
    "Tourism Policy and Governance","Airline and Cruise Management",
    "Tourism Entrepreneurship","Internship / OJT",
  ],
  BSED: [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "The Teaching Profession","Foundations of Education","Child and Adolescent Development",
    "Principles of Teaching","Facilitating Learner-Centered Teaching",
    "Educational Technology","Assessment of Learning 1","Assessment of Learning 2",
    "Curriculum Development","Field Study (Practice Teaching Preparation)",
    "Practice Teaching / Internship",
  ],
  "BSED-ENG": [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "The Teaching Profession","Foundations of Education","Child and Adolescent Development",
    "Principles of Teaching","Facilitating Learner-Centered Teaching",
    "Educational Technology","Assessment of Learning 1","Assessment of Learning 2",
    "Curriculum Development","Field Study (Practice Teaching Preparation)",
    "Practice Teaching / Internship"
  ],
  "BSED-MATH": [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "The Teaching Profession","Foundations of Education","Child and Adolescent Development",
    "Principles of Teaching","Facilitating Learner-Centered Teaching",
    "Educational Technology","Assessment of Learning 1","Assessment of Learning 2",
    "Curriculum Development","Field Study (Practice Teaching Preparation)",
    "Practice Teaching / Internship"
  ],
  "BSED-SCI": [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "The Teaching Profession","Foundations of Education","Child and Adolescent Development",
    "Principles of Teaching","Facilitating Learner-Centered Teaching",
    "Educational Technology","Assessment of Learning 1","Assessment of Learning 2",
    "Curriculum Development","Field Study (Practice Teaching Preparation)",
    "Practice Teaching / Internship"
  ],
  "BSED-SS": [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "The Teaching Profession","Foundations of Education","Child and Adolescent Development",
    "Principles of Teaching","Facilitating Learner-Centered Teaching",
    "Educational Technology","Assessment of Learning 1","Assessment of Learning 2",
    "Curriculum Development","Field Study (Practice Teaching Preparation)",
    "Practice Teaching / Internship"
  ],
  "BSED-FIL": [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "The Teaching Profession","Foundations of Education","Child and Adolescent Development",
    "Principles of Teaching","Facilitating Learner-Centered Teaching",
    "Educational Technology","Assessment of Learning 1","Assessment of Learning 2",
    "Curriculum Development","Field Study (Practice Teaching Preparation)",
    "Practice Teaching / Internship"
  ],
  "BSED-TLE": [
    "Mathematics in the Modern World","Purposive Communication",
    "Understanding the Self","Readings in Philippine History","The Contemporary World",
    "Life and Works of Jose Rizal",
    "Physical Education 1","Physical Education 2",
    "Ethics","Art Appreciation",
    "Science, Technology, and Society",
    "NSTP 1","NSTP 2",
    "The Teaching Profession","Foundations of Education","Child and Adolescent Development",
    "Principles of Teaching","Facilitating Learner-Centered Teaching",
    "Educational Technology","Assessment of Learning 1","Assessment of Learning 2",
    "Curriculum Development","Field Study (Practice Teaching Preparation)",
    "Practice Teaching / Internship"
  ],
}

export const SECTION_DEFAULTS: { name: string; capacity: number }[] = [
  { name: "Section A", capacity: 40 },
  { name: "Section B", capacity: 40 },
]