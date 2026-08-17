import { SubjectDef, subj } from './index';
import { COLLEGE_COURSES } from '../courses.data';

type CollegeSubjRaw = {
  name: string;
  year: string;
  term: string;
  prereqs: string[];
};

/**
 * College GE (General Education) subjects — MINOR subjects
 * Shared across ALL college programs, not tied to specific courses
 */
const COLLEGE_GE: CollegeSubjRaw[] = [
  {
    name: 'Mathematics in the Modern World',
    year: '1st Year',
    term: '1st Semester',
    prereqs: [],
  },
  {
    name: 'Purposive Communication',
    year: '1st Year',
    term: '1st Semester',
    prereqs: [],
  },
  {
    name: 'Understanding the Self',
    year: '1st Year',
    term: '1st Semester',
    prereqs: [],
  },
  {
    name: 'Readings in Philippine History',
    year: '1st Year',
    term: '2nd Semester',
    prereqs: [],
  },
  {
    name: 'The Contemporary World',
    year: '1st Year',
    term: '2nd Semester',
    prereqs: [],
  },
  {
    name: 'Life and Works of Jose Rizal',
    year: '1st Year',
    term: '2nd Semester',
    prereqs: [],
  },
  {
    name: 'Physical Education 1',
    year: '1st Year',
    term: '1st Semester',
    prereqs: [],
  },
  {
    name: 'Physical Education 2',
    year: '1st Year',
    term: '2nd Semester',
    prereqs: [],
  },
  {
    name: 'Ethics',
    year: '2nd Year',
    term: '1st Semester',
    prereqs: ['Understanding the Self'],
  },
  {
    name: 'Art Appreciation',
    year: '2nd Year',
    term: '2nd Semester',
    prereqs: [],
  },
  {
    name: 'Science, Technology, and Society',
    year: '2nd Year',
    term: '2nd Semester',
    prereqs: [],
  },
  { name: 'NSTP 1', year: '2nd Year', term: '1st Semester', prereqs: [] },
  { name: 'NSTP 2', year: '2nd Year', term: '2nd Semester', prereqs: [] },
];

/**
 * College major subjects by course code
 * BSIT, BSBA, BSCS, BSHM, BSCRIM, BSTM have dedicated course codes
 */
const COLLEGE_MAJOR: Record<string, CollegeSubjRaw[]> = {
  BSIT: [
    {
      name: 'Introduction to Computing',
      year: '1st Year',
      term: '1st Semester',
      prereqs: [],
    },
    {
      name: 'Computer Programming 1',
      year: '1st Year',
      term: '1st Semester',
      prereqs: ['Introduction to Computing'],
    },
    {
      name: 'Computer Programming 2',
      year: '1st Year',
      term: '2nd Semester',
      prereqs: ['Computer Programming 1'],
    },
    {
      name: 'Data Structures and Algorithms',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: ['Computer Programming 2'],
    },
    {
      name: 'Database Management Systems',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Data Structures and Algorithms'],
    },
    {
      name: 'Web Systems and Technologies',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Computer Programming 2'],
    },
    {
      name: 'Software Engineering',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Data Structures and Algorithms'],
    },
    {
      name: 'Human-Computer Interaction',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Software Engineering'],
    },
    {
      name: 'Operating Systems',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Data Structures and Algorithms'],
    },
    {
      name: 'Computer Networks',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Operating Systems'],
    },
    {
      name: 'Information Assurance and Security',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Computer Networks'],
    },
    {
      name: 'Systems Analysis and Design',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Software Engineering'],
    },
    {
      name: 'IT Project Management',
      year: '4th Year',
      term: '1st Semester',
      prereqs: ['Systems Analysis and Design'],
    },
    {
      name: 'Capstone Project / Thesis',
      year: '4th Year',
      term: '2nd Semester',
      prereqs: ['IT Project Management'],
    },
  ],
  BSBA: [
    {
      name: 'Principles of Management',
      year: '1st Year',
      term: '1st Semester',
      prereqs: [],
    },
    {
      name: 'Microeconomics',
      year: '1st Year',
      term: '2nd Semester',
      prereqs: [],
    },
    {
      name: 'Macroeconomics',
      year: '1st Year',
      term: '2nd Semester',
      prereqs: ['Microeconomics'],
    },
    {
      name: 'Business Statistics',
      year: '1st Year',
      term: '2nd Semester',
      prereqs: ['Mathematics in the Modern World'],
    },
    {
      name: 'Principles of Marketing',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: ['Principles of Management'],
    },
    {
      name: 'Financial Management',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: ['Principles of Management', 'Business Statistics'],
    },
    {
      name: 'Business Law',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: [],
    },
    {
      name: 'Human Resource Management',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Principles of Management'],
    },
    {
      name: 'Operations Management',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Principles of Management', 'Business Statistics'],
    },
    {
      name: 'Business Ethics',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: [],
    },
    {
      name: 'Organizational Behavior',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Principles of Management'],
    },
    {
      name: 'Strategic Management',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: [
        'Principles of Management',
        'Principles of Marketing',
        'Financial Management',
      ],
    },
    {
      name: 'International Business',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Principles of Marketing', 'Strategic Management'],
    },
    {
      name: 'Entrepreneurial Management',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Principles of Marketing', 'Strategic Management'],
    },
    {
      name: 'Business Research',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Business Statistics', 'Principles of Management'],
    },
    {
      name: 'Project Management',
      year: '4th Year',
      term: '1st Semester',
      prereqs: ['Strategic Management', 'Operations Management'],
    },
  ],
  BSA: [
    {
      name: 'Fundamentals of Accounting',
      year: '1st Year',
      term: '1st Semester',
      prereqs: [],
    },
    {
      name: 'Financial Accounting and Reporting I',
      year: '1st Year',
      term: '2nd Semester',
      prereqs: ['Fundamentals of Accounting'],
    },
    {
      name: 'Business Law',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: [],
    },
    {
      name: 'Management Accounting',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: ['Financial Accounting and Reporting I'],
    },
    {
      name: 'Regulatory Framework and Legal Issues in Business',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: ['Business Law'],
    },
    {
      name: 'Cost Accounting',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Management Accounting'],
    },
    {
      name: 'Accounting Information Systems',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Fundamentals of Accounting'],
    },
    {
      name: 'Auditing Theory',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Cost Accounting'],
    },
    {
      name: 'Advanced Financial Accounting and Reporting',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Financial Accounting and Reporting I'],
    },
    {
      name: 'Financial Management',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Management Accounting'],
    },
    {
      name: 'Auditing and Assurance Services',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Auditing Theory'],
    },
    {
      name: 'Taxation (Income Tax, Business Tax)',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Financial Accounting and Reporting I'],
    },
    {
      name: 'Strategic Cost Management',
      year: '4th Year',
      term: '1st Semester',
      prereqs: ['Cost Accounting'],
    },
    {
      name: 'Governance, Business Ethics, Risk Management, and Internal Control',
      year: '4th Year',
      term: '1st Semester',
      prereqs: ['Auditing Theory'],
    },
    {
      name: 'Accounting Research',
      year: '4th Year',
      term: '2nd Semester',
      prereqs: [
        'Advanced Financial Accounting and Reporting',
        'Management Accounting',
      ],
    },
    {
      name: 'Integrated Review Courses (Board Exam Preparation)',
      year: '4th Year',
      term: '2nd Semester',
      prereqs: [],
    },
    {
      name: 'Advanced Taxation',
      year: '5th Year',
      term: '1st Semester',
      prereqs: ['Taxation (Income Tax, Business Tax)'],
    },
    {
      name: 'CPA Licensure Exam Review',
      year: '5th Year',
      term: '2nd Semester',
      prereqs: [],
    },
  ],
  BSCS: [
    {
      name: 'Introduction to Computing',
      year: '1st Year',
      term: '1st Semester',
      prereqs: [],
    },
    {
      name: 'Computer Programming 1',
      year: '1st Year',
      term: '1st Semester',
      prereqs: ['Introduction to Computing'],
    },
    {
      name: 'Computer Programming 2',
      year: '1st Year',
      term: '2nd Semester',
      prereqs: ['Computer Programming 1'],
    },
    {
      name: 'Discrete Mathematics',
      year: '1st Year',
      term: '2nd Semester',
      prereqs: [],
    },
    {
      name: 'Object-Oriented Programming',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: ['Computer Programming 2'],
    },
    {
      name: 'Computer Architecture',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Introduction to Computing', 'Object-Oriented Programming'],
    },
    {
      name: 'Data Structures and Algorithms',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Object-Oriented Programming', 'Discrete Mathematics'],
    },
    {
      name: 'Database Systems',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Computer Programming 2'],
    },
    {
      name: 'Algorithms and Complexity',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Data Structures and Algorithms'],
    },
    {
      name: 'Automata Theory',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Discrete Mathematics'],
    },
    {
      name: 'Operating Systems',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Data Structures and Algorithms', 'Computer Architecture'],
    },
    {
      name: 'Numerical Methods',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Discrete Mathematics'],
    },
    {
      name: 'Programming Languages',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: [
        'Object-Oriented Programming',
        'Data Structures and Algorithms',
      ],
    },
    {
      name: 'Software Engineering',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Object-Oriented Programming'],
    },
    {
      name: 'Computer Networks',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Operating Systems'],
    },
    {
      name: 'Human-Computer Interaction',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Software Engineering'],
    },
    {
      name: 'Artificial Intelligence',
      year: '4th Year',
      term: '1st Semester',
      prereqs: ['Data Structures and Algorithms', 'Algorithms and Complexity'],
    },
    {
      name: 'Machine Learning',
      year: '4th Year',
      term: '2nd Semester',
      prereqs: ['Artificial Intelligence', 'Data Structures and Algorithms'],
    },
    {
      name: 'CS Thesis / Capstone Project',
      year: '4th Year',
      term: '2nd Semester',
      prereqs: [],
    },
  ],
  BSED: [],
  BSHM: [
    {
      name: 'Introduction to Hospitality Industry',
      year: '1st Year',
      term: '1st Semester',
      prereqs: [],
    },
    {
      name: 'Food and Beverage Service Operations',
      year: '1st Year',
      term: '2nd Semester',
      prereqs: ['Introduction to Hospitality Industry'],
    },
    {
      name: 'Housekeeping Operations',
      year: '1st Year',
      term: '2nd Semester',
      prereqs: ['Introduction to Hospitality Industry'],
    },
    {
      name: 'Front Office Operations',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: ['Introduction to Hospitality Industry'],
    },
    {
      name: 'Culinary Arts / Basic Cooking',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: ['Food and Beverage Service Operations'],
    },
    {
      name: 'Hospitality Marketing',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: [
        'Introduction to Hospitality Industry',
        'Front Office Operations',
      ],
    },
    {
      name: 'Hospitality Financial Management',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Food and Beverage Service Operations'],
    },
    {
      name: 'Food Safety and Sanitation',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Culinary Arts / Basic Cooking'],
    },
    {
      name: 'Hospitality Law',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: [],
    },
    {
      name: 'Customer Service Management',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: [
        'Front Office Operations',
        'Food and Beverage Service Operations',
      ],
    },
    {
      name: 'Tourism Planning and Development',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Introduction to Hospitality Industry'],
    },
    {
      name: 'Hotel and Restaurant Management',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Front Office Operations', 'Housekeeping Operations'],
    },
    {
      name: 'Beverage Management (Bar and Drinks)',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Food and Beverage Service Operations'],
    },
    {
      name: 'Event Management',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Hospitality Marketing'],
    },
    {
      name: 'Banquet and Catering Management',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Food and Beverage Service Operations', 'Event Management'],
    },
    {
      name: 'Entrepreneurship in Hospitality',
      year: '4th Year',
      term: '1st Semester',
      prereqs: ['Hospitality Marketing', 'Hotel and Restaurant Management'],
    },
    {
      name: 'Internship / OJT',
      year: '4th Year',
      term: '2nd Semester',
      prereqs: [],
    },
  ],
  BSCRIM: [
    {
      name: 'Introduction to Criminology',
      year: '1st Year',
      term: '1st Semester',
      prereqs: [],
    },
    {
      name: 'Criminal Law',
      year: '1st Year',
      term: '2nd Semester',
      prereqs: ['Introduction to Criminology'],
    },
    {
      name: 'Criminological Theories',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: ['Introduction to Criminology'],
    },
    {
      name: 'Law Enforcement Administration',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: ['Criminological Theories'],
    },
    {
      name: 'Ethics and Moral Values in Law Enforcement',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: [],
    },
    {
      name: 'Criminalistics / Forensic Science',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Criminal Law'],
    },
    {
      name: 'Crime Detection and Investigation',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: [
        'Criminalistics / Forensic Science',
        'Law Enforcement Administration',
      ],
    },
    {
      name: 'Juvenile Delinquency',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Criminological Theories'],
    },
    {
      name: 'Police Administration',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Law Enforcement Administration'],
    },
    {
      name: 'Criminal Psychology',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Criminological Theories', 'Juvenile Delinquency'],
    },
    {
      name: 'Correctional Administration',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Police Administration'],
    },
    {
      name: 'Disaster and Risk Management',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Law Enforcement Administration'],
    },
    {
      name: 'Research in Criminology',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Criminological Theories', 'Criminal Law'],
    },
    {
      name: 'Criminal Investigation Practicum',
      year: '4th Year',
      term: '1st Semester',
      prereqs: ['Crime Detection and Investigation', 'Police Administration'],
    },
    {
      name: 'Community Policing and Public Safety',
      year: '4th Year',
      term: '2nd Semester',
      prereqs: ['Criminal Investigation Practicum'],
    },
  ],
  BSTM: [
    {
      name: 'Principles of Tourism',
      year: '1st Year',
      term: '1st Semester',
      prereqs: [],
    },
    {
      name: 'Tourism Research and Statistics',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: [],
    },
    {
      name: 'Tourism Planning and Development',
      year: '2nd Year',
      term: '1st Semester',
      prereqs: ['Principles of Tourism'],
    },
    {
      name: 'Travel Agency Operations',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Principles of Tourism'],
    },
    {
      name: 'Tour Guiding and Tour Operations',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Principles of Tourism'],
    },
    {
      name: 'Hospitality and Tourism Law',
      year: '2nd Year',
      term: '2nd Semester',
      prereqs: ['Principles of Tourism'],
    },
    {
      name: 'Tourism Marketing and Promotion',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Tourism Planning and Development'],
    },
    {
      name: 'Event and Convention Management',
      year: '3rd Year',
      term: '1st Semester',
      prereqs: ['Tourism Marketing and Promotion'],
    },
    {
      name: 'Sustainable Tourism',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Tourism Planning and Development'],
    },
    {
      name: 'Cultural and Heritage Tourism',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Tourism Planning and Development'],
    },
    {
      name: 'Tourism Policy and Governance',
      year: '3rd Year',
      term: '2nd Semester',
      prereqs: ['Principles of Tourism', 'Sustainable Tourism'],
    },
    {
      name: 'Airline and Cruise Management',
      year: '4th Year',
      term: '1st Semester',
      prereqs: ['Travel Agency Operations'],
    },
    {
      name: 'Tourism Entrepreneurship',
      year: '4th Year',
      term: '1st Semester',
      prereqs: ['Tourism Marketing and Promotion'],
    },
    {
      name: 'Internship / OJT',
      year: '4th Year',
      term: '2nd Semester',
      prereqs: [],
    },
  ],
};

/**
 * BSED core subjects
 */
const BSED_CORE: CollegeSubjRaw[] = [
  {
    name: 'The Teaching Profession',
    year: '1st Year',
    term: '1st Semester',
    prereqs: [],
  },
  {
    name: 'Foundations of Education',
    year: '1st Year',
    term: '2nd Semester',
    prereqs: ['The Teaching Profession'],
  },
  {
    name: 'Child and Adolescent Development',
    year: '2nd Year',
    term: '1st Semester',
    prereqs: ['Foundations of Education'],
  },
  {
    name: 'Principles of Teaching',
    year: '2nd Year',
    term: '1st Semester',
    prereqs: ['The Teaching Profession', 'Foundations of Education'],
  },
  {
    name: 'Facilitating Learner-Centered Teaching',
    year: '2nd Year',
    term: '2nd Semester',
    prereqs: ['Principles of Teaching', 'Child and Adolescent Development'],
  },
  {
    name: 'Educational Technology',
    year: '2nd Year',
    term: '2nd Semester',
    prereqs: ['Facilitating Learner-Centered Teaching'],
  },
  {
    name: 'Assessment of Learning 1',
    year: '3rd Year',
    term: '1st Semester',
    prereqs: ['Facilitating Learner-Centered Teaching'],
  },
  {
    name: 'Assessment of Learning 2',
    year: '3rd Year',
    term: '2nd Semester',
    prereqs: ['Assessment of Learning 1'],
  },
  {
    name: 'Curriculum Development',
    year: '3rd Year',
    term: '2nd Semester',
    prereqs: ['Foundations of Education'],
  },
  {
    name: 'Field Study (Practice Teaching Preparation)',
    year: '3rd Year',
    term: '2nd Semester',
    prereqs: [
      'Assessment of Learning 1',
      'Facilitating Learner-Centered Teaching',
    ],
  },
  {
    name: 'Practice Teaching / Internship',
    year: '4th Year',
    term: '1st Semester',
    prereqs: ['Field Study (Practice Teaching Preparation)'],
  },
];

/**
 * College major subjects — tied to specific courses (BSIT, BSBA, etc.)
 * Each subject has: courseCode, year level, term, prerequisites
 */
export function collegeMajorSubjects(): SubjectDef[] {
  const out: SubjectDef[] = [];

  for (const course of COLLEGE_COURSES) {
    const majors = COLLEGE_MAJOR[course.code] ?? [];

    for (const m of majors) {
      out.push(
        subj(
          m.year, // levelName ("1st Year", "2nd Year", etc.)
          course.code, // courseCode (BSIT, BSBA, BSCS, etc.)
          null, // strandName (not used for college)
          m.name, // subject name
          m.year, // yearLevel
          m.term, // termLabel
          m.prereqs, // prerequisites
          false, // isMinor = false
        ),
      );
    }
  }

  // BSED core subjects
  for (const s of BSED_CORE) {
    out.push(
      subj(
        s.year, // levelName
        'BSED', // courseCode
        null, // strandName
        s.name, // subject name
        s.year, // yearLevel
        s.term, // termLabel
        s.prereqs, // prerequisites
        false, // isMinor = false
      ),
    );
  }

  return out;
}

/**
 * College GE (General Education) subjects — MINOR subjects
 * NOT tied to any course, strand, or specific level
 * Shared across ALL college programs
 *
 * These will be stored in Subject table as:
 *   program_id: null
 *   level_id: null
 *   course_id: null
 *   strand_id: null
 *   subject_type: 'minor'
 *   year_level: "1st Year" / "2nd Year"
 *   term_label: "1st Semester" / "2nd Semester"
 */
export function collegeMinorSubjects(): SubjectDef[] {
  return COLLEGE_GE.map((s) =>
    subj(
      'college_ge', // levelName (marker for GE subjects)
      null, // courseCode (NULL — shared across all courses)
      null, // strandName (NULL)
      s.name, // subject name
      s.year, // yearLevel ("1st Year", "2nd Year")
      s.term, // termLabel ("1st Semester", etc.)
      s.prereqs, // prerequisites
      true, // isMinor = TRUE (these are electives/GE)
    ),
  );
}

/**
 * Export all college subjects
 */
export function collegeSubjects(): SubjectDef[] {
  return [...collegeMajorSubjects(), ...collegeMinorSubjects()];
}
