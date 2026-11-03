export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

export const WEEKDAY_NUMBER: Record<Weekday, number> = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

export const COURSE = { code: 'BSCS', name: 'BS Computer Science' };

export const SEMESTER_NAMES: string[] = ['1st Semester', '2nd Semester'];
export const SEMESTER_TERM_NAMES: string[] = ['Prelim', 'Midterm', 'Finals'];
export const SEMESTER_TEMPLATE_NAME = 'College Semester Template';
export const SEMESTER_BREAK_LABEL = 'Semester Break';
export const SEMESTER_BREAK_DAYS = 14;

export const COLLEGE_SCALE_NAME = 'College Numeric Scale';

export interface SectionDef {
  name: string;
  levelName: string;
  capacity: number;
}

export const SECTIONS: SectionDef[] = [
  { name: 'BSCS-1A', levelName: '1st Year', capacity: 50 },
  { name: 'BSCS-1B', levelName: '1st Year', capacity: 50 },
  { name: 'BSCS-2A', levelName: '2nd Year', capacity: 50 },
  { name: 'BSCS-3A', levelName: '3rd Year', capacity: 50 },
  { name: 'BSCS-4A', levelName: '4th Year', capacity: 50 },
];

export const LEGACY_SECTION_NAMES: Record<string, string> = {
  'BSCS-2A': 'BSCS-2',
  'BSCS-3A': 'BSCS-3',
  'BSCS-4A': 'BSCS-4',
};

export type TermLabel = '1st Semester' | '2nd Semester' | 'Summer';

export type RoomKind = 'cs' | 'ge' | 'pe';

export interface TimeBlock {
  start: string;
  end: string;
}

export const CLASS_DAYS: Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const FULL_BLOCKS: TimeBlock[] = [
  { start: '07:30', end: '10:30' },
  { start: '11:00', end: '14:00' },
  { start: '14:00', end: '17:00' },
];

export const HALF_BLOCKS: TimeBlock[] = [
  { start: '07:30', end: '09:00' },
  { start: '09:00', end: '10:30' },
  { start: '11:00', end: '12:30' },
  { start: '12:30', end: '14:00' },
  { start: '14:00', end: '15:30' },
  { start: '15:30', end: '17:00' },
];

export const ROOM_POOLS: Record<RoomKind, string[]> = {
  cs: ['CB204', 'CB205', 'CB206'],
  ge: ['SHS101', 'SHS102', 'SHS202', 'SHS206', 'SHS208', 'SHS703'],
  pe: ['Gym'],
};

export interface CurriculumSubject {
  code: string;
  name: string;
  levelName: string;
  term: TermLabel;
  prerequisites: string[];
  instructors: string[];
  roomKind: RoomKind;
  halfBlock?: boolean;
  legacyNames?: string[];
}

export const CURRICULUM: CurriculumSubject[] = [
  { code: 'COMP 1', name: 'Introduction to Computing', levelName: '1st Year', term: '1st Semester', prerequisites: [], instructors: ['Bernardo', 'Tolentino'], roomKind: 'cs' },
  { code: 'PROG 1', name: 'Computer Programming 1', levelName: '1st Year', term: '1st Semester', prerequisites: [], instructors: ['Tolentino', 'Bernardo'], roomKind: 'cs' },
  { code: 'UTS', name: 'Understanding the Self', levelName: '1st Year', term: '1st Semester', prerequisites: [], instructors: ['Esteban', 'Perez'], roomKind: 'ge' },
  { code: 'RPH', name: 'Readings in Philippine History', levelName: '1st Year', term: '1st Semester', prerequisites: [], instructors: ['Tomada', 'Perez'], roomKind: 'ge' },
  { code: 'MMW', name: 'Mathematics in the Modern World', levelName: '1st Year', term: '1st Semester', prerequisites: [], instructors: ['Reyes'], roomKind: 'ge' },
  { code: 'PE 1', name: 'Physical Fitness', levelName: '1st Year', term: '1st Semester', prerequisites: [], instructors: ['Osorio'], roomKind: 'pe', halfBlock: true },
  { code: 'FIL 1', name: 'Ugnayan ng Wika, Kultura at Lipunan', levelName: '1st Year', term: '1st Semester', prerequisites: [], instructors: ['Lomot'], roomKind: 'ge' },
  { code: 'NSTP 1', name: 'Civic Welfare Training Service', levelName: '1st Year', term: '1st Semester', prerequisites: [], instructors: ['Osorio'], roomKind: 'pe', halfBlock: true },

  { code: 'DISCRETE 1', name: 'Discrete Structures 1', levelName: '1st Year', term: '2nd Semester', prerequisites: [], instructors: ['Reyes'], roomKind: 'cs' },
  { code: 'PROG 2', name: 'Computer Programming 2', levelName: '1st Year', term: '2nd Semester', prerequisites: ['PROG 1'], instructors: ['Tolentino'], roomKind: 'cs' },
  { code: 'DASTRUC', name: 'Data Structures and Algorithms', levelName: '1st Year', term: '2nd Semester', prerequisites: ['PROG 1'], instructors: ['Bernardo'], roomKind: 'cs' },
  { code: 'STS', name: 'Science, Technology and Society', levelName: '1st Year', term: '2nd Semester', prerequisites: [], instructors: ['Biore'], roomKind: 'ge' },
  { code: 'PCO', name: 'Purposive Communication', levelName: '1st Year', term: '2nd Semester', prerequisites: [], instructors: ['Oreng'], roomKind: 'ge' },
  { code: 'PE 2', name: 'Rhythmic Activities', levelName: '1st Year', term: '2nd Semester', prerequisites: ['PE 1'], instructors: ['Osorio'], roomKind: 'pe', halfBlock: true, legacyNames: ['PE 2 / NSTP 2'] },
  { code: 'FIL 2', name: 'Panitikan ng Pilipinas', levelName: '1st Year', term: '2nd Semester', prerequisites: ['FIL 1'], instructors: ['Lomot'], roomKind: 'ge' },
  { code: 'NSTP 2', name: 'Literacy Training Service', levelName: '1st Year', term: '2nd Semester', prerequisites: ['NSTP 1'], instructors: ['Osorio'], roomKind: 'pe', halfBlock: true },

  { code: 'OOP', name: 'Object Oriented Programming', levelName: '2nd Year', term: '1st Semester', prerequisites: [], instructors: ['Tolentino', 'Bernardo'], roomKind: 'cs' },
  { code: 'DISCRETE 2', name: 'Discrete Structures 2', levelName: '2nd Year', term: '1st Semester', prerequisites: ['DISCRETE 1'], instructors: ['Reyes'], roomKind: 'cs' },
  { code: 'HUMCOIN', name: 'Human Computer Interaction', levelName: '2nd Year', term: '1st Semester', prerequisites: [], instructors: ['Tolentino', 'Perez'], roomKind: 'cs' },
  { code: 'TCW', name: 'The Contemporary World', levelName: '2nd Year', term: '1st Semester', prerequisites: [], instructors: ['Perez', 'Tomada'], roomKind: 'ge' },
  { code: 'AAP', name: 'Art Appreciation', levelName: '2nd Year', term: '1st Semester', prerequisites: [], instructors: ['Esteban', 'Perez'], roomKind: 'ge' },
  { code: 'FIL 3', name: 'Malikhaing Pagsulat', levelName: '2nd Year', term: '1st Semester', prerequisites: ['FIL 2'], instructors: ['Lomot'], roomKind: 'ge' },
  { code: 'ACCTGFUND', name: 'Fundamentals of Accounting', levelName: '2nd Year', term: '1st Semester', prerequisites: [], instructors: ['Perez', 'Esteban'], roomKind: 'ge' },
  { code: 'PE 3', name: 'Individual/Dual Sports/Games', levelName: '2nd Year', term: '1st Semester', prerequisites: ['PE 2'], instructors: ['Osorio'], roomKind: 'pe', halfBlock: true },

  { code: 'INFOMGT', name: 'Information Management', levelName: '2nd Year', term: '2nd Semester', prerequisites: [], instructors: ['Tolentino'], roomKind: 'cs' },
  { code: 'CSO', name: 'Computer Architecture and Organization', levelName: '2nd Year', term: '2nd Semester', prerequisites: ['PROG 2'], instructors: ['Tolentino'], roomKind: 'cs' },
  { code: 'ETHICS', name: 'Ethics', levelName: '2nd Year', term: '2nd Semester', prerequisites: [], instructors: ['Esteban'], roomKind: 'ge' },
  { code: 'RIZAL', name: 'Life, Works and Writings of Dr. Jose Rizal', levelName: '2nd Year', term: '2nd Semester', prerequisites: [], instructors: ['Tomada'], roomKind: 'ge' },
  { code: 'PE 4', name: 'Team Sports/Games', levelName: '2nd Year', term: '2nd Semester', prerequisites: ['PE 3'], instructors: ['Osorio'], roomKind: 'pe', halfBlock: true },
  { code: 'SOCISPP', name: 'Social Issues and Professional Practice', levelName: '2nd Year', term: '2nd Semester', prerequisites: [], instructors: ['Perez'], roomKind: 'ge' },
  { code: 'ANALGOR', name: 'Analysis and Design of Algorithms', levelName: '2nd Year', term: '2nd Semester', prerequisites: [], instructors: ['Bernardo'], roomKind: 'cs' },

  { code: 'AUTOMATA 1', name: 'Automata Theory and Formal Languages', levelName: '3rd Year', term: '1st Semester', prerequisites: ['OOP'], instructors: ['Reyes', 'Bernardo'], roomKind: 'cs' },
  { code: 'DATACOM', name: 'Data Communications and Networking', levelName: '3rd Year', term: '1st Semester', prerequisites: ['PROG 2'], instructors: ['Tolentino', 'Reyes'], roomKind: 'cs' },
  { code: 'CS ELEC 1', name: 'Intelligent Systems', levelName: '3rd Year', term: '1st Semester', prerequisites: [], instructors: ['Tolentino', 'Bernardo'], roomKind: 'cs' },
  { code: 'SOFTENG 1', name: 'Software Engineering 1', levelName: '3rd Year', term: '1st Semester', prerequisites: [], instructors: ['Reyes', 'Tolentino'], roomKind: 'cs' },
  { code: 'APP SDEV 1', name: 'Applications Development and Emerging Technology', levelName: '3rd Year', term: '1st Semester', prerequisites: ['OOP'], instructors: ['Tolentino', 'Bernardo'], roomKind: 'cs' },
  { code: 'CS PROF EL 1', name: 'Computational Science', levelName: '3rd Year', term: '1st Semester', prerequisites: [], instructors: ['Bernardo', 'Reyes'], roomKind: 'cs' },
  { code: 'CS PROF EL 2', name: 'System Fundamentals', levelName: '3rd Year', term: '1st Semester', prerequisites: [], instructors: ['Bernardo', 'Tolentino'], roomKind: 'cs' },

  { code: 'PL 1', name: 'Programming Languages', levelName: '3rd Year', term: '2nd Semester', prerequisites: [], instructors: ['Tolentino'], roomKind: 'cs' },
  { code: 'RESEARCH 1', name: 'Methods of Research in Computing', levelName: '3rd Year', term: '2nd Semester', prerequisites: ['APP SDEV 1'], instructors: ['Reyes'], roomKind: 'cs' },
  { code: 'CS ELEC 2', name: 'Graphics and Visual Computing', levelName: '3rd Year', term: '2nd Semester', prerequisites: [], instructors: ['Tolentino'], roomKind: 'cs' },
  { code: 'SOFTENG 2', name: 'Software Engineering 2', levelName: '3rd Year', term: '2nd Semester', prerequisites: ['SOFTENG 1'], instructors: ['Reyes'], roomKind: 'cs', legacyNames: ['SOFT ENG 2'] },
  { code: 'CS PROF EL 3', name: 'Parallel and Distributed Computing', levelName: '3rd Year', term: '2nd Semester', prerequisites: [], instructors: ['Bernardo'], roomKind: 'cs' },
  { code: 'QUANMET', name: 'Quantitative Methods', levelName: '3rd Year', term: '2nd Semester', prerequisites: [], instructors: ['Reyes'], roomKind: 'cs' },
  { code: 'OS', name: 'Operating Systems', levelName: '3rd Year', term: '2nd Semester', prerequisites: [], instructors: ['Reyes'], roomKind: 'cs' },

  { code: 'PRAC 1', name: 'CS Practicum', levelName: '3rd Year', term: 'Summer', prerequisites: [], instructors: ['Tolentino'], roomKind: 'cs' },

  { code: 'NLP', name: 'Natural Language Processing', levelName: '4th Year', term: '1st Semester', prerequisites: [], instructors: ['Bernardo', 'Tolentino'], roomKind: 'cs' },
  { code: 'CS THESIS 1', name: 'Thesis Writing 1', levelName: '4th Year', term: '1st Semester', prerequisites: [], instructors: ['Reyes', 'Tolentino'], roomKind: 'cs' },
  { code: 'ITREVIEW', name: 'Certification Exam Review', levelName: '4th Year', term: '1st Semester', prerequisites: [], instructors: ['Tolentino', 'Bernardo'], roomKind: 'cs' },
  { code: 'BUSINTEG', name: 'Integration of Computing Technologies in Business Management', levelName: '4th Year', term: '1st Semester', prerequisites: [], instructors: ['Perez', 'Tolentino'], roomKind: 'ge' },

  { code: 'IAS 1', name: 'Information Assurance and Security', levelName: '4th Year', term: '2nd Semester', prerequisites: [], instructors: ['Tolentino'], roomKind: 'cs' },
  { code: 'CS THESIS 2', name: 'Thesis Writing 2', levelName: '4th Year', term: '2nd Semester', prerequisites: [], instructors: ['Reyes'], roomKind: 'cs' },
  { code: 'MODTECH', name: 'Modern Technologies in Software Development', levelName: '4th Year', term: '2nd Semester', prerequisites: [], instructors: ['Tolentino'], roomKind: 'cs' },
];
export const SEEDED_TERMS: TermLabel[] = ['1st Semester', '2nd Semester'];

export interface ScheduleDef {
  section: string;
  subject: string;
  instructor: string;
  room: string | null;
  day: Weekday;
  start: string;
  end: string;
  semester: number;
}

export type PostedSchedule = Omit<ScheduleDef, 'semester'>;

export const POSTED_TIMETABLE_SEMESTER = 2;

export const STUDENT_SEMESTER = 2;

export const SCHEDULES: PostedSchedule[] = [
  { section: 'BSCS-1A', subject: 'PROG 2', instructor: 'Tolentino', room: 'CB205', day: 'TUE', start: '07:30', end: '10:30' },
  { section: 'BSCS-1A', subject: 'DISCRETE 1', instructor: 'Reyes', room: 'CB206', day: 'TUE', start: '11:00', end: '14:00' },
  { section: 'BSCS-1A', subject: 'STS', instructor: 'Biore', room: 'SHS208', day: 'THU', start: '07:30', end: '10:30' },
  { section: 'BSCS-1A', subject: 'PCO', instructor: 'Oreng', room: 'SHS102', day: 'THU', start: '11:00', end: '14:00' },
  { section: 'BSCS-1A', subject: 'FIL 2', instructor: 'Lomot', room: 'SHS703', day: 'THU', start: '14:00', end: '17:00' },
  { section: 'BSCS-1A', subject: 'DASTRUC', instructor: 'Bernardo', room: 'CB205', day: 'SAT', start: '07:30', end: '10:30' },
  { section: 'BSCS-1A', subject: 'PE 2', instructor: 'Osorio', room: 'Gym', day: 'SAT', start: '11:00', end: '12:30' },
  { section: 'BSCS-1A', subject: 'NSTP 2', instructor: 'Osorio', room: 'Gym', day: 'SAT', start: '12:30', end: '14:00' },

  { section: 'BSCS-1B', subject: 'PROG 2', instructor: 'Tolentino', room: 'CB205', day: 'TUE', start: '11:00', end: '14:00' },
  { section: 'BSCS-1B', subject: 'STS', instructor: 'Biore', room: 'SHS206', day: 'THU', start: '14:00', end: '17:00' },
  { section: 'BSCS-1B', subject: 'PCO', instructor: 'Oreng', room: 'SHS101', day: 'FRI', start: '14:00', end: '17:00' },
  { section: 'BSCS-1B', subject: 'FIL 2', instructor: 'Lomot', room: 'SHS703', day: 'FRI', start: '07:30', end: '10:30' },
  { section: 'BSCS-1B', subject: 'DISCRETE 1', instructor: 'Reyes', room: 'CB206', day: 'FRI', start: '11:00', end: '14:00' },
  { section: 'BSCS-1B', subject: 'DASTRUC', instructor: 'Bernardo', room: 'CB205', day: 'WED', start: '07:30', end: '10:30' },
  { section: 'BSCS-1B', subject: 'PE 2', instructor: 'Osorio', room: 'Gym', day: 'SAT', start: '14:00', end: '15:30' },
  { section: 'BSCS-1B', subject: 'NSTP 2', instructor: 'Osorio', room: 'Gym', day: 'SAT', start: '15:30', end: '17:00' },

  { section: 'BSCS-2A', subject: 'INFOMGT', instructor: 'Tolentino', room: 'CB205', day: 'TUE', start: '14:00', end: '17:00' },
  { section: 'BSCS-2A', subject: 'ETHICS', instructor: 'Esteban', room: 'SHS202', day: 'WED', start: '07:30', end: '10:30' },
  { section: 'BSCS-2A', subject: 'CSO', instructor: 'Tolentino', room: 'CB205', day: 'WED', start: '11:00', end: '14:00' },
  { section: 'BSCS-2A', subject: 'RIZAL', instructor: 'Tomada', room: 'SHS206', day: 'SAT', start: '07:30', end: '10:30' },
  { section: 'BSCS-2A', subject: 'ANALGOR', instructor: 'Bernardo', room: 'CB205', day: 'SAT', start: '11:00', end: '14:00' },
  { section: 'BSCS-2A', subject: 'SOCISPP', instructor: 'Perez', room: null, day: 'SAT', start: '14:00', end: '17:00' },

  { section: 'BSCS-3A', subject: 'OS', instructor: 'Reyes', room: 'CB206', day: 'WED', start: '07:30', end: '10:30' },
  { section: 'BSCS-3A', subject: 'QUANMET', instructor: 'Reyes', room: 'CB206', day: 'WED', start: '11:00', end: '14:00' },
  { section: 'BSCS-3A', subject: 'CS ELEC 2', instructor: 'Tolentino', room: 'CB205', day: 'WED', start: '14:00', end: '17:00' },
  { section: 'BSCS-3A', subject: 'PL 1', instructor: 'Tolentino', room: 'CB205', day: 'THU', start: '07:30', end: '10:30' },
  { section: 'BSCS-3A', subject: 'RESEARCH 1', instructor: 'Reyes', room: 'CB204', day: 'THU', start: '11:00', end: '14:00' },
  { section: 'BSCS-3A', subject: 'SOFTENG 2', instructor: 'Reyes', room: 'CB206', day: 'THU', start: '14:00', end: '17:00' },
  { section: 'BSCS-3A', subject: 'CS PROF EL 3', instructor: 'Bernardo', room: 'CB205', day: 'SAT', start: '14:00', end: '17:00' },

  { section: 'BSCS-4A', subject: 'CS THESIS 2', instructor: 'Reyes', room: 'CB204', day: 'THU', start: '07:30', end: '10:30' },
  { section: 'BSCS-4A', subject: 'IAS 1', instructor: 'Tolentino', room: 'CB205', day: 'THU', start: '11:00', end: '14:00' },
  { section: 'BSCS-4A', subject: 'MODTECH', instructor: 'Tolentino', room: 'CB205', day: 'THU', start: '14:00', end: '17:00' },
];

export const DEFAULT_STUDENT_SECTION = 'BSCS-4A';

export const ENROLL_STUDENTS_IN_CLASSES = true;
export const REGULAR_STUDENTS: string[] = ['Eric James Sonio', 'Rj Diaz'];

export const IRREGULAR_STUDENTS: Record<string, string[]> = {
  'Ian Vitente': ['CSO'],
  'Jay Entileso': ['CSO'],
};

export const IRREGULAR_EXTRA_SECTIONS: string[] = ['BSCS-2A', 'BSCS-3A'];

export const IRREGULAR_RATE_PERCENT = 30;

export const RAW_STUDENT_NAMES: string[] = [
  'Aldwin Javier Mora',
  'Angelica Delgado',
  'Earbine Mariñas',
  'Earl John Vendivil Oliveros',
  'Eric James Sonio',
  'Ernesto Torres',
  'Florentine Delfin',
  'Gab',
  'Gian Carl Marcos',
  'Gian Carl Marcos',
  'Gian Lobaton',
  'Hero Ocenar',
  'Hero Ocenar',
  'Justine Dizon',
  'Justine Sandiego',
  'Ley',
  'Macky Mc',
  'Mariz Macasa',
  'Mary Ann Adriano',
  'Nicky Shane Villaruel',
  'Orea Brian',
  'Rey Mark Nacor',
  'Rj Diaz',
  'Sheirlyn Reyes',
  'Verto Reels',
  'Vince Hedric de Guzman',
  'Hero Ocenar',
  'JAY ENTILESO',
  'JOhn Florence Adriano',
  'James Harrison Marcos Mangahas',
  'Jessa Mae Jamila',
  'Jessamae Jamila',
  'Jethro Yaneza',
  'Jethro Yaneza',
  'John Francis Bautista',
  'John Francis Bautista',
  'Justine Dizon',
  'Justine Dizon',
  'Justine Sandiego',
  'Ian Vitente',
];