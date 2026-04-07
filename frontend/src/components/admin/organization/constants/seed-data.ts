// frontend/src/components/admin/organization/constants/seed-data.ts
// (replace existing file — only additions are GRADING_SCALE_PRESETS and LEVEL_DEFS is now a function)

export const PROGRAMS = [
  { key: "daycare",    label: "Daycare / Pre-School" },
  { key: "kinder",     label: "Kindergarten" },
  { key: "elementary", label: "Elementary School" },
  { key: "jhs",        label: "Junior High School" },
  { key: "shs",        label: "Senior High School" },
  { key: "college",    label: "College / University" },
]

export const COLLEGE_COURSES = [
  { code: "BSIT",      name: "BS Information Technology" },
  { code: "BSBA",      name: "BS Business Administration" },
  { code: "BSED",      name: "Bachelor of Secondary Education" },
  { code: "BSA",       name: "BS Accountancy" },
  { code: "BSCS",      name: "BS Computer Science" },
  { code: "BSHM",      name: "BS Hospitality Management" },
  { code: "BSCRIM",    name: "BS Criminology" },
  { code: "BSTM",      name: "BS Tourism Management" },
  { code: "BSED-ENG",  name: "BSED – English Major" },
  { code: "BSED-MATH", name: "BSED – Mathematics Major" },
  { code: "BSED-SCI",  name: "BSED – Science Major" },
  { code: "BSED-SS",   name: "BSED – Social Studies Major" },
  { code: "BSED-FIL",  name: "BSED – Filipino Major" },
  { code: "BSED-TLE",  name: "BSED – TLE Major" },
]

export const SHS_STRANDS = [
  "ABM", "STEM", "HUMSS", "GAS", "ICT", "HE", "IA",
  "Agri-Fishery", "Sports", "Arts and Design",
]

export const COLLEGE_GE_SUBJECTS = [
  "Oral Communication", "Reading and Writing Skills", "Mathematics in the Modern World",
  "Understanding the Self", "Contemporary World", "Readings in Philippine History",
  "Physical Education / Health", "Life and Works of Jose Rizal",
  "National Service Training Program (NSTP)", "Art Appreciation",
] as const

export const SHS_MINOR_SUBJECTS = [
  "Oral Communication", "Reading and Writing Skills", "Mathematics in the Modern World",
  "Understanding the Self", "Contemporary World", "Readings in Philippine History",
  "Physical Education / Health", "Life and Works of Jose Rizal",
  "National Service Training Program (NSTP)", "Art Appreciation",
] as const

export const COLLEGE_GE_SET = new Set<string>(COLLEGE_GE_SUBJECTS)
export const SHS_MINOR_SET  = new Set<string>(SHS_MINOR_SUBJECTS)

// Default level definitions (used as seed for custom level state)
export const LEVEL_DEFS: Record<string, string[]> = {
  daycare:    ["Daycare 1", "Daycare 2"],
  kinder:     ["Kinder 1", "Kinder 2"],
  elementary: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
  jhs:        ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
  shs:        ["Grade 11", "Grade 12"],
  college:    ["1st Year", "2nd Year", "3rd Year", "4th Year"],
}

// Max levels allowed per program (for the stepper UI)
export const LEVEL_MAX: Record<string, number> = {
  daycare:    5,
  kinder:     3,
  elementary: 12,
  jhs:        6,
  shs:        4,
  college:    6,
}

// Min levels per program
export const LEVEL_MIN: Record<string, number> = {
  daycare:    1,
  kinder:     1,
  elementary: 1,
  jhs:        1,
  shs:        1,
  college:    1,
}

const COLLEGE_YEAR_LABELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year"]

// Generate level names for a given program + count
export function generateLevelNames(prog: string, count: number): string[] {
  switch (prog) {
    case "daycare":
      return Array.from({ length: count }, (_, i) => `Daycare ${i + 1}`)
    case "kinder":
      return Array.from({ length: count }, (_, i) => `Kinder ${i + 1}`)
    case "elementary":
      return Array.from({ length: count }, (_, i) => `Grade ${i + 1}`)
    case "jhs":
      return Array.from({ length: count }, (_, i) => `Grade ${i + 7}`)
    case "shs":
      return Array.from({ length: count }, (_, i) => `Grade ${i + 11}`)
    case "college":
      return Array.from({ length: count }, (_, i) => COLLEGE_YEAR_LABELS[i] ?? `Year ${i + 1}`)
    default:
      return Array.from({ length: count }, (_, i) => `Level ${i + 1}`)
  }
}

export const LEVEL_SUBJECTS: Record<string, string[]> = {
  "Daycare 1": [
    "Language and Literacy", "Cognitive and Numeracy Skills",
    "Physical Development, Health, and Safety", "Social and Emotional Development",
    "Creative Arts and Music", "Understanding the World / Discovery",
  ],
  "Daycare 2": [
    "Language and Literacy", "Cognitive and Numeracy Skills",
    "Physical Development, Health, and Safety", "Social and Emotional Development",
    "Creative Arts and Music", "Understanding the World / Discovery",
  ],
  "Kinder 1": [
    "Language, Literacy, and Communication", "Mathematical Thinking",
    "Physical Development, Health, and Safety",
    "Social and Emotional Development / Values Formation",
    "Creative Arts", "Understanding the World / Discovery",
  ],
  "Kinder 2": [
    "Language, Literacy, and Communication", "Mathematical Thinking",
    "Physical Development, Health, and Safety",
    "Social and Emotional Development / Values Formation",
    "Creative Arts", "Understanding the World / Discovery",
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

// ─── Grading Scale Presets ──────────────────────────────────────────────────

export interface GradeRange {
  label:       string  // e.g. "Excellent", "Outstanding"
  minScore:    number
  maxScore:    number
  gradeValue:  string  // e.g. "A", "1.0", "Passed"
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
      { label: "Outstanding",           minScore: 90, maxScore: 100, gradeValue: "A"  },
      { label: "Very Satisfactory",     minScore: 85, maxScore: 89,  gradeValue: "B+" },
      { label: "Satisfactory",          minScore: 80, maxScore: 84,  gradeValue: "B"  },
      { label: "Fairly Satisfactory",   minScore: 75, maxScore: 79,  gradeValue: "C"  },
      { label: "Did Not Meet Expectation", minScore: 0, maxScore: 74, gradeValue: "F" },
    ],
  },
  {
    key:  "college_5pt",
    name: "College 5-Point Scale (CHED)",
    ranges: [
      { label: "Excellent",      minScore: 97, maxScore: 100, gradeValue: "1.00" },
      { label: "Superior",       minScore: 94, maxScore: 96,  gradeValue: "1.25" },
      { label: "Very Good",      minScore: 91, maxScore: 93,  gradeValue: "1.50" },
      { label: "Good",           minScore: 88, maxScore: 90,  gradeValue: "1.75" },
      { label: "Meritorious",    minScore: 85, maxScore: 87,  gradeValue: "2.00" },
      { label: "Very Satisfactory", minScore: 82, maxScore: 84, gradeValue: "2.25" },
      { label: "Satisfactory",   minScore: 79, maxScore: 81,  gradeValue: "2.50" },
      { label: "Fairly Good",    minScore: 76, maxScore: 78,  gradeValue: "2.75" },
      { label: "Passing",        minScore: 75, maxScore: 75,  gradeValue: "3.00" },
      { label: "Failure",        minScore: 0,  maxScore: 74,  gradeValue: "5.00" },
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

// ─── SHS strand subjects (unchanged, keeping full data) ─────────────────────

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
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Introduction to Computing","Computer Programming 1","Computer Programming 2",
    "Data Structures and Algorithms","Database Management Systems",
    "Web Systems and Technologies","Software Engineering","Human-Computer Interaction",
    "Operating Systems","Computer Networks","Information Assurance and Security",
    "Systems Analysis and Design","IT Project Management","Capstone Project / Thesis",
  ],
  BSBA: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Principles of Management","Microeconomics","Macroeconomics","Business Statistics",
    "Principles of Marketing","Financial Management","Business Law",
    "Human Resource Management","Operations Management","Business Ethics",
    "Organizational Behavior","Strategic Management","International Business",
    "Entrepreneurial Management","Business Research","Project Management",
  ],
  BSA: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Fundamentals of Accounting","Financial Accounting and Reporting I","Business Law",
    "Management Accounting","Regulatory Framework and Legal Issues in Business",
    "Cost Accounting","Accounting Information Systems","Auditing Theory",
    "Advanced Financial Accounting and Reporting","Financial Management",
    "Auditing and Assurance Services","Taxation (Income Tax, Business Tax)",
    "Strategic Cost Management",
    "Governance, Business Ethics, Risk Management, and Internal Control",
    "Accounting Research","Integrated Review Courses (Board Exam Preparation)",
  ],
  BSCS: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Introduction to Computing","Computer Programming 1","Computer Programming 2",
    "Discrete Mathematics","Object-Oriented Programming","Computer Architecture",
    "Data Structures and Algorithms","Database Systems","Algorithms and Complexity",
    "Automata Theory","Operating Systems","Numerical Methods","Programming Languages",
    "Software Engineering","Computer Networks","Human-Computer Interaction",
    "Artificial Intelligence","Machine Learning","CS Thesis / Capstone Project",
  ],
  BSHM: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Introduction to Hospitality Industry","Food and Beverage Service Operations",
    "Housekeeping Operations","Front Office Operations","Culinary Arts / Basic Cooking",
    "Hospitality Marketing","Hospitality Financial Management","Food Safety and Sanitation",
    "Hospitality Law","Customer Service Management","Tourism Planning and Development",
    "Hotel and Restaurant Management","Beverage Management (Bar and Drinks)",
    "Event Management","Banquet and Catering Management","Entrepreneurship in Hospitality",
    "Internship / OJT",
  ],
  BSCRIM: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Introduction to Criminology","Criminal Law","Criminological Theories",
    "Law Enforcement Administration","Ethics and Moral Values in Law Enforcement",
    "Criminalistics / Forensic Science","Crime Detection and Investigation",
    "Juvenile Delinquency","Police Administration","Criminal Psychology",
    "Correctional Administration","Disaster and Risk Management",
    "Research in Criminology","Criminal Investigation Practicum",
    "Community Policing and Public Safety",
  ],
  BSTM: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "Principles of Tourism","Tourism Research and Statistics",
    "Tourism Planning and Development","Travel Agency Operations",
    "Tour Guiding and Tour Operations","Hospitality and Tourism Law",
    "Tourism Marketing and Promotion","Event and Convention Management",
    "Sustainable Tourism","Cultural and Heritage Tourism",
    "Tourism Policy and Governance","Airline and Cruise Management",
    "Tourism Entrepreneurship","Internship / OJT",
  ],
  BSED: [
    "Oral Communication","Reading and Writing Skills","Mathematics in the Modern World",
    "Understanding the Self","Contemporary World","Readings in Philippine History",
    "Physical Education / Health","Life and Works of Jose Rizal",
    "National Service Training Program (NSTP)","Art Appreciation",
    "The Teaching Profession","Foundations of Education","Child and Adolescent Development",
    "Principles of Teaching","Facilitating Learner-Centered Teaching",
    "Educational Technology","Assessment of Learning 1","Assessment of Learning 2",
    "Curriculum Development","Field Study (Practice Teaching Preparation)",
    "Practice Teaching / Internship",
  ],
  "BSED-ENG":  ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-MATH": ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-SCI":  ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-SS":   ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-FIL":  ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-TLE":  ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
}