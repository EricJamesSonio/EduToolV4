export type TermDef = {
  name:        string
  order_index: number
}

export type SemesterItemDef = {
  name:        string
  order_index: number
  terms:       TermDef[]
}

export type SemesterTemplateDef = {
  name:        string
  programType: string   // matches Program.type
  semesters:   SemesterItemDef[]
}

export const SEMESTER_TEMPLATES: SemesterTemplateDef[] = [
  {
    name:        'Daycare / Kinder Template',
    programType: 'daycare',   // also reused for kinder — same structure
    semesters: [
      {
        name:        'Whole Year',
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
    name:        'Kinder Template',
    programType: 'kinder',
    semesters: [
      {
        name:        'Whole Year',
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
    name:        'Elementary Semester Template',
    programType: 'elementary',
    semesters: [
      {
        name:        '1st Semester',
        order_index: 0,
        terms: [
          { name: '1st Quarter', order_index: 0 },
          { name: '2nd Quarter', order_index: 1 },
        ],
      },
      {
        name:        '2nd Semester',
        order_index: 1,
        terms: [
          { name: '3rd Quarter', order_index: 0 },
          { name: '4th Quarter', order_index: 1 },
        ],
      },
    ],
  },
  {
    name:        'Junior High School Semester Template',
    programType: 'jhs',
    semesters: [
      {
        name:        '1st Semester',
        order_index: 0,
        terms: [
          { name: '1st Quarter', order_index: 0 },
          { name: '2nd Quarter', order_index: 1 },
        ],
      },
      {
        name:        '2nd Semester',
        order_index: 1,
        terms: [
          { name: '3rd Quarter', order_index: 0 },
          { name: '4th Quarter', order_index: 1 },
        ],
      },
    ],
  },
  {
    name:        'Senior High School Semester Template',
    programType: 'shs',
    semesters: [
      {
        name:        '1st Semester',
        order_index: 0,
        terms: [
          { name: '1st Quarter', order_index: 0 },
          { name: '2nd Quarter', order_index: 1 },
        ],
      },
      {
        name:        '2nd Semester',
        order_index: 1,
        terms: [
          { name: '3rd Quarter', order_index: 0 },
          { name: '4th Quarter', order_index: 1 },
        ],
      },
    ],
  },
  {
    name:        'College Semester Template',
    programType: 'college',
    semesters: [
      {
        name:        '1st Semester',
        order_index: 0,
        terms: [
          { name: 'Midterm', order_index: 0 },
          { name: 'Finals',  order_index: 1 },
        ],
      },
      {
        name:        '2nd Semester',
        order_index: 1,
        terms: [
          { name: 'Midterm', order_index: 0 },
          { name: 'Finals',  order_index: 1 },
        ],
      },
    ],
  },
]

/** Maps a programType to its template def for quick lookup */
export const SEMESTER_TEMPLATE_BY_PROGRAM: Record<string, SemesterTemplateDef> =
  Object.fromEntries(SEMESTER_TEMPLATES.map((t) => [t.programType, t]))