import { SubjectDef, subj } from './index'
import { SHS_STRAND_DEFS } from '../strands.data'

type ShsSubjRaw = { name: string; grade: 11 | 12; term: string; prereqs: string[] }

// ---------------------------------------------------------------------------
// Minor (core/GE) subjects — shared across ALL SHS strands
// ---------------------------------------------------------------------------

const SHS_MINOR: ShsSubjRaw[] = [
  { name: 'Oral Communication',                       grade: 11, term: '1st Semester',  prereqs: [] },
  { name: 'Reading and Writing Skills',               grade: 11, term: '1st Semester',  prereqs: [] },
  { name: 'Mathematics in the Modern World',          grade: 11, term: '1st Semester',  prereqs: [] },
  { name: 'Understanding the Self',                   grade: 11, term: '1st Semester',  prereqs: [] },
  { name: 'Contemporary World',                       grade: 11, term: '2nd Semester',  prereqs: [] },
  { name: 'Readings in Philippine History',           grade: 11, term: '2nd Semester',  prereqs: [] },
  { name: 'Physical Education / Health',              grade: 11, term: 'Both Semesters', prereqs: [] },
  { name: 'Life and Works of Jose Rizal',             grade: 11, term: '2nd Semester',  prereqs: [] },
  { name: 'National Service Training Program (NSTP)', grade: 12, term: 'Both Semesters', prereqs: [] },
  { name: 'Art Appreciation',                         grade: 12, term: '1st Semester',  prereqs: [] },
]

// ---------------------------------------------------------------------------
// Major subjects per strand
// ---------------------------------------------------------------------------

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
    { name: 'General Biology',                         grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'General Chemistry',                       grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'General Physics',                         grade: 11, term: '2nd Semester', prereqs: ['Mathematics in the Modern World'] },
    { name: 'Earth and Life Science',                  grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Calculus and Analytical Geometry',        grade: 12, term: '1st Semester', prereqs: [] },
    { name: 'Advanced Physics',                        grade: 12, term: '1st Semester', prereqs: ['General Physics'] },
    { name: 'Organic Chemistry',                       grade: 12, term: '2nd Semester', prereqs: ['General Chemistry'] },
    { name: 'Research in Science',                     grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Engineering and Technology Applications', grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Applied Mathematics',                     grade: 12, term: '2nd Semester', prereqs: ['Calculus and Analytical Geometry'] },
  ],
  HUMSS: [
    { name: 'Introduction to Philosophy',              grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Understanding Culture and Society',       grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Creative Writing',                        grade: 11, term: '2nd Semester', prereqs: ['Reading and Writing Skills'] },
    { name: 'Philippine Politics and Governance',      grade: 11, term: '2nd Semester', prereqs: ['Understanding Culture and Society'] },
    { name: 'Psychology',                              grade: 12, term: '1st Semester', prereqs: ['Understanding the Self'] },
    { name: 'Social Research and Statistics',          grade: 12, term: '1st Semester', prereqs: ['Contemporary World'] },
    { name: 'World History and Globalization',         grade: 12, term: '2nd Semester', prereqs: ['Readings in Philippine History'] },
    { name: 'Philosophy of Human Person',              grade: 12, term: '2nd Semester', prereqs: ['Introduction to Philosophy'] },
    { name: 'Economics for Social Sciences',           grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Applied Social Sciences / Ethics in Society', grade: 12, term: '2nd Semester', prereqs: ['Understanding the Self'] },
  ],
  GAS: [
    { name: 'Introduction to Humanities',                 grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Introduction to Social Sciences',            grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Fundamentals of Business and Management',    grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Basic Principles of Science and Technology', grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Creative Writing',                           grade: 12, term: '1st Semester', prereqs: ['Reading and Writing Skills'] },
    { name: 'Introduction to Philosophy',                 grade: 12, term: '1st Semester', prereqs: [] },
    { name: 'Research Methods / Applied Research',        grade: 12, term: '2nd Semester', prereqs: ['Contemporary World'] },
    { name: 'Economics / Business Economics',             grade: 12, term: '2nd Semester', prereqs: ['Fundamentals of Business and Management'] },
    { name: 'Social Issues and Ethics',                   grade: 12, term: '2nd Semester', prereqs: ['Understanding the Self'] },
    { name: 'Interdisciplinary Elective',                 grade: 12, term: '2nd Semester', prereqs: [] },
  ],
  ICT: [
    { name: 'Computer Programming 1',          grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Introduction to Computing',       grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Web Development 1 (HTML, CSS)',   grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Computer Programming 2',          grade: 11, term: '2nd Semester', prereqs: ['Computer Programming 1'] },
    { name: 'Web Development 2 (JavaScript)', grade: 11, term: '2nd Semester', prereqs: ['Web Development 1 (HTML, CSS)'] },
    { name: 'Database Management Systems',     grade: 11, term: '2nd Semester', prereqs: ['Introduction to Computing'] },
    { name: 'Systems Analysis and Design',     grade: 12, term: '1st Semester', prereqs: ['Computer Programming 2', 'Database Management Systems'] },
    { name: 'Mobile Application Development', grade: 12, term: '1st Semester', prereqs: ['Computer Programming 2'] },
    { name: 'Computer Networks and Security', grade: 12, term: '1st Semester', prereqs: ['Introduction to Computing'] },
    { name: 'Capstone Project',               grade: 12, term: '2nd Semester', prereqs: ['Systems Analysis and Design'] },
    { name: 'ICT Project Management',         grade: 12, term: '2nd Semester', prereqs: ['Systems Analysis and Design'] },
    { name: 'Emerging Technologies in ICT',   grade: 12, term: '2nd Semester', prereqs: [] },
  ],
  HE: [
    { name: 'Introduction to Home Economics',           grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Cookery / Culinary Basics',                grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Bread and Pastry Production',              grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Food and Beverage Services',               grade: 11, term: '2nd Semester', prereqs: ['Cookery / Culinary Basics'] },
    { name: 'Housekeeping',                             grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Caregiving (Basic)',                       grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Dressmaking / Tailoring',                  grade: 12, term: '1st Semester', prereqs: [] },
    { name: 'Advanced Cookery / International Cuisine', grade: 12, term: '1st Semester', prereqs: ['Cookery / Culinary Basics'] },
    { name: 'Events Management Services',               grade: 12, term: '1st Semester', prereqs: ['Food and Beverage Services'] },
    { name: 'Entrepreneurship in Home Economics',       grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Work Immersion (OJT)',                     grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Capstone Project / Practical Assessment',  grade: 12, term: '2nd Semester', prereqs: [] },
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
    { name: 'Introduction to Agri-Fishery Arts',       grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Crop Production (Basic)',                  grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Animal Production (Basic)',                grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Aquaculture (Basic)',                      grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Horticulture',                             grade: 11, term: '2nd Semester', prereqs: ['Crop Production (Basic)'] },
    { name: 'Agricultural Machinery and Tools',         grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Crop Production NC II',                    grade: 12, term: '1st Semester', prereqs: ['Crop Production (Basic)'] },
    { name: 'Animal Production NC II',                  grade: 12, term: '1st Semester', prereqs: ['Animal Production (Basic)'] },
    { name: 'Aquaculture NC II',                        grade: 12, term: '1st Semester', prereqs: ['Aquaculture (Basic)'] },
    { name: 'Farm Management',                          grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Work Immersion (OJT)',                     grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Capstone Project / Practical Assessment',  grade: 12, term: '2nd Semester', prereqs: [] },
  ],
  Sports: [
    { name: 'Introduction to Sports Science',             grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Physical Fitness and Conditioning',          grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Fundamentals of Coaching',                   grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Sports Officiating and Rules',               grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Sports Psychology',                          grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Safety and First Aid in Sports',             grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Advanced Coaching and Training Techniques',  grade: 12, term: '1st Semester', prereqs: ['Fundamentals of Coaching'] },
    { name: 'Sports Event Management',                    grade: 12, term: '1st Semester', prereqs: [] },
    { name: 'Anatomy and Physiology for Athletes',        grade: 12, term: '1st Semester', prereqs: ['Introduction to Sports Science'] },
    { name: 'Sports Analytics and Performance Analysis',  grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Work Immersion (OJT)',                       grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Capstone Project / Practical Assessment',    grade: 12, term: '2nd Semester', prereqs: [] },
  ],
  'Arts and Design': [
    { name: 'Introduction to Arts and Design',          grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Elements and Principles of Design',        grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Creative Industries I (Applied Arts)',     grade: 11, term: '1st Semester', prereqs: [] },
    { name: 'Creative Industries II (Media Arts)',      grade: 11, term: '2nd Semester', prereqs: ['Creative Industries I (Applied Arts)'] },
    { name: 'Fundamentals of Performing Arts',          grade: 11, term: '2nd Semester', prereqs: [] },
    { name: 'Visual Arts Production',                   grade: 11, term: '2nd Semester', prereqs: ['Elements and Principles of Design'] },
    { name: 'Specialization in Arts',                  grade: 12, term: '1st Semester', prereqs: [] },
    { name: 'Portfolio Development',                    grade: 12, term: '1st Semester', prereqs: ['Visual Arts Production'] },
    { name: 'Arts Production and Management',           grade: 12, term: '1st Semester', prereqs: [] },
    { name: 'Contemporary Arts Practices',              grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Work Immersion (OJT)',                    grade: 12, term: '2nd Semester', prereqs: [] },
    { name: 'Capstone Project / Culminating Exhibit',  grade: 12, term: '2nd Semester', prereqs: [] },
  ],
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * SHS subjects split by type:
 * - Major subjects are per-strand (subject_type: 'major')
 * - Minor subjects (SHS_MINOR) are seeded per-grade-level but flagged isMinor: true
 *   so the seeder can set subject_type: 'minor' and create SubjectSharing rows
 */
export function shsSubjects(): SubjectDef[] {
  const out: SubjectDef[] = []

  for (const strand of SHS_STRAND_DEFS) {
    const majors = SHS_MAJOR[strand.name] ?? []

    for (const g of [11, 12] as const) {
      const levelName = `Grade ${g} – ${strand.name}`
      const yearLabel = `Grade ${g}`

      // Major subjects — isMinor: false
      for (const m of majors.filter((x) => x.grade === g)) {
        out.push(subj(levelName, null, strand.name, m.name, yearLabel, m.term, m.prereqs, false))
      }

      // Minor subjects — isMinor: true
      // These are still emitted per strand-level so the seeder can create
      // SubjectSharing rows linking each minor → strand
      for (const m of SHS_MINOR.filter((x) => x.grade === g)) {
        out.push(subj(levelName, null, strand.name, m.name, yearLabel, m.term, m.prereqs, true))
      }
    }
  }

  return out
}