export type ComponentPreset = {
  name:       string
  type:       string
  weight:     number
  isOptional: boolean
}

export type SchemePreset = {
  name:        string
  programType: string   // matches Program.type — used when seeding GradingSchemeTemplate
  components:  ComponentPreset[]
}

export const SCHEME_PRESETS: SchemePreset[] = [
  {
    name:        'Daycare Scheme',
    programType: 'daycare',
    components: [
      { name: 'Play and Activities', type: 'activity', weight: 40, isOptional: false },
      { name: 'Participation',       type: 'manual',   weight: 30, isOptional: false },
      { name: 'Behavior',            type: 'manual',   weight: 20, isOptional: false },
      { name: 'Health and Hygiene',  type: 'manual',   weight: 10, isOptional: false },
    ],
  },
  {
    name:        'Kindergarten Scheme',
    programType: 'kinder',
    components: [
      { name: 'Quizzes',    type: 'quiz',     weight: 20, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 30, isOptional: false },
      { name: 'Behavior',   type: 'manual',   weight: 20, isOptional: false },
      { name: 'Projects',   type: 'activity', weight: 30, isOptional: false },
    ],
  },
  {
    name:        'Elementary Scheme',
    programType: 'elementary',
    components: [
      { name: 'Quizzes',    type: 'quiz',     weight: 25, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 25, isOptional: false },
      { name: 'Behavior',   type: 'manual',   weight: 20, isOptional: false },
      { name: 'Projects',   type: 'activity', weight: 20, isOptional: false },
      { name: 'Exams',      type: 'exam',     weight: 10, isOptional: false },
    ],
  },
  {
    name:        'High School Scheme',
    programType: 'jhs',
    components: [
      { name: 'Quizzes',    type: 'quiz',     weight: 20, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 20, isOptional: false },
      { name: 'Behavior',   type: 'manual',   weight: 20, isOptional: false },
      { name: 'Exams',      type: 'exam',     weight: 40, isOptional: false },
    ],
  },
  {
    name:        'Senior High School Scheme',
    programType: 'shs',
    components: [
      { name: 'Quizzes',    type: 'quiz',     weight: 20, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 20, isOptional: false },
      { name: 'Behavior',   type: 'manual',   weight: 10, isOptional: false },
      { name: 'Projects',   type: 'activity', weight: 10, isOptional: false },
      { name: 'Exams',      type: 'exam',     weight: 40, isOptional: false },
    ],
  },
  {
    name:        'College Scheme',
    programType: 'college',
    components: [
      { name: 'Quizzes',    type: 'quiz',     weight: 20, isOptional: false },
      { name: 'Activities', type: 'activity', weight: 20, isOptional: false },
      { name: 'Behavior',   type: 'manual',   weight: 20, isOptional: false },
      { name: 'Exams',      type: 'exam',     weight: 40, isOptional: false },
    ],
  },
]