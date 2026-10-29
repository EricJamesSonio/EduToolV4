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

export interface SectionDef {
  name: string;
  levelName: string;
  capacity: number;
}

export const SECTIONS: SectionDef[] = [
  { name: 'BSCS-1A', levelName: '1st Year', capacity: 50 },
  { name: 'BSCS-1B', levelName: '1st Year', capacity: 50 },
  { name: 'BSCS-2', levelName: '2nd Year', capacity: 50 },
  { name: 'BSCS-3', levelName: '3rd Year', capacity: 50 },
  { name: 'BSCS-4', levelName: '4th Year', capacity: 50 },
];

export interface ScheduleDef {
  section: string;
  subject: string;
  instructor: string;
  room: string | null;
  day: Weekday;
  start: string;
  end: string;
}

export const SCHEDULES: ScheduleDef[] = [
  { section: 'BSCS-1A', subject: 'PROG 2', instructor: 'Tolentino', room: 'CB205', day: 'TUE', start: '07:30', end: '10:30' },
  { section: 'BSCS-1A', subject: 'DISCRETE 1', instructor: 'Reyes', room: 'CB206', day: 'TUE', start: '11:00', end: '14:00' },
  { section: 'BSCS-1A', subject: 'STS', instructor: 'Biore', room: 'SHS208', day: 'THU', start: '07:30', end: '10:30' },
  { section: 'BSCS-1A', subject: 'PCO', instructor: 'Oreng', room: 'SHS102', day: 'THU', start: '11:00', end: '14:00' },
  { section: 'BSCS-1A', subject: 'FIL 2', instructor: 'Lomot', room: 'SHS703', day: 'THU', start: '14:00', end: '17:00' },
  { section: 'BSCS-1A', subject: 'DASTRUC', instructor: 'Bernardo', room: 'CB205', day: 'SAT', start: '07:30', end: '10:30' },
  { section: 'BSCS-1A', subject: 'PE 2 / NSTP 2', instructor: 'Osorio', room: 'Gym', day: 'SAT', start: '11:00', end: '14:00' },

  { section: 'BSCS-1B', subject: 'PROG 2', instructor: 'Tolentino', room: 'CB205', day: 'TUE', start: '11:00', end: '14:00' },
  { section: 'BSCS-1B', subject: 'STS', instructor: 'Biore', room: 'SHS206', day: 'THU', start: '07:30', end: '10:30' },
  { section: 'BSCS-1B', subject: 'PCO', instructor: 'Oreng', room: 'SHS101', day: 'THU', start: '11:00', end: '14:00' },
  { section: 'BSCS-1B', subject: 'FIL 2', instructor: 'Lomot', room: 'SHS703', day: 'FRI', start: '07:30', end: '10:30' },
  { section: 'BSCS-1B', subject: 'DISCRETE 1', instructor: 'Reyes', room: 'CB206', day: 'FRI', start: '11:00', end: '14:00' },
  { section: 'BSCS-1B', subject: 'DASTRUC', instructor: 'Bernardo', room: 'CB205', day: 'SAT', start: '07:30', end: '10:30' },
  { section: 'BSCS-1B', subject: 'PE 2 / NSTP 2', instructor: 'Osorio', room: 'Gym', day: 'SAT', start: '11:00', end: '14:00' },

  { section: 'BSCS-2', subject: 'INFOMGT', instructor: 'Tolentino', room: 'CB205', day: 'TUE', start: '14:00', end: '17:00' },
  { section: 'BSCS-2', subject: 'ETHICS', instructor: 'Esteban', room: 'SHS202', day: 'WED', start: '07:30', end: '10:30' },
  { section: 'BSCS-2', subject: 'CSO', instructor: 'Tolentino', room: 'CB205', day: 'WED', start: '11:00', end: '14:00' },
  { section: 'BSCS-2', subject: 'RIZAL', instructor: 'Tomada', room: 'SHS206', day: 'SAT', start: '07:30', end: '10:30' },
  { section: 'BSCS-2', subject: 'ANALGOR', instructor: 'Bernardo', room: 'CB205', day: 'SAT', start: '11:00', end: '14:00' },
  { section: 'BSCS-2', subject: 'SOCISPP', instructor: 'Perez', room: null, day: 'SAT', start: '14:00', end: '17:00' },

  { section: 'BSCS-3', subject: 'OS', instructor: 'Reyes', room: 'CB206', day: 'WED', start: '07:30', end: '10:30' },
  { section: 'BSCS-3', subject: 'QUANMET', instructor: 'Reyes', room: 'CB206', day: 'WED', start: '11:00', end: '14:00' },
  { section: 'BSCS-3', subject: 'CS ELEC 2', instructor: 'Tolentino', room: 'CB205', day: 'WED', start: '14:00', end: '17:00' },
  { section: 'BSCS-3', subject: 'PL 1', instructor: 'Tolentino', room: 'CB205', day: 'THU', start: '07:30', end: '10:30' },
  { section: 'BSCS-3', subject: 'RESEARCH 1', instructor: 'Reyes', room: 'CB204', day: 'THU', start: '11:00', end: '14:00' },
  { section: 'BSCS-3', subject: 'SOFT ENG 2', instructor: 'Reyes', room: 'CB206', day: 'THU', start: '14:00', end: '17:00' },
  { section: 'BSCS-3', subject: 'CS PROF EL 3', instructor: 'Bernardo', room: 'CB205', day: 'SAT', start: '14:00', end: '17:00' },

  { section: 'BSCS-4', subject: 'CS THESIS 2', instructor: 'Reyes', room: 'CB204', day: 'THU', start: '07:30', end: '10:30' },
  { section: 'BSCS-4', subject: 'IAS 1', instructor: 'Tolentino', room: 'CB205', day: 'THU', start: '11:00', end: '14:00' },
  { section: 'BSCS-4', subject: 'MODTECH', instructor: 'Tolentino', room: 'CB205', day: 'THU', start: '14:00', end: '17:00' },
];

export const DEFAULT_STUDENT_SECTION = 'BSCS-4';

export const ENROLL_STUDENTS_IN_CLASSES = true;
export const REGULAR_STUDENTS: string[] = ['Eric James Sonio', 'Rj Diaz'];

export const IRREGULAR_STUDENTS: Record<string, string[]> = {
  'Ian Vitente': ['CSO'],
  'Jay Entileso': ['CSO'],
};

export const IRREGULAR_EXTRA_SECTIONS: string[] = ['BSCS-2', 'BSCS-3'];

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