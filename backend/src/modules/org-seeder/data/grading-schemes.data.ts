import { ComponentType } from '@/modules/grading-scheme/dto/grading-scheme.dto';

export type ComponentPreset = {
  name: string;
  type: ComponentType;
  weight: number;
  isOptional: boolean;
};

export type SchemePreset = {
  name: string;
  programType: string; // matches Program.type — used when seeding GradingSchemeTemplate
  components: ComponentPreset[];
};

export const SCHEME_PRESETS: SchemePreset[] = [
  {
    name: 'Daycare Scheme',
    programType: 'daycare',
    components: [
      {
        name: 'Play and Activities',
        type: ComponentType.ACTIVITY,
        weight: 40,
        isOptional: false,
      },
      {
        name: 'Participation',
        type: ComponentType.PARTICIPATION,
        weight: 30,
        isOptional: false,
      },
      {
        name: 'Behavior',
        type: ComponentType.BEHAVIOR,
        weight: 20,
        isOptional: false,
      },
      {
        name: 'Health and Hygiene',
        type: ComponentType.OTHER,
        weight: 10,
        isOptional: false,
      },
    ],
  },
  {
    name: 'Kindergarten Scheme',
    programType: 'kinder',
    components: [
      {
        name: 'Quizzes',
        type: ComponentType.QUIZ,
        weight: 20,
        isOptional: false,
      },
      {
        name: 'Activities',
        type: ComponentType.ACTIVITY,
        weight: 30,
        isOptional: false,
      },
      {
        name: 'Behavior',
        type: ComponentType.BEHAVIOR,
        weight: 20,
        isOptional: false,
      },
      {
        name: 'Projects',
        type: ComponentType.ACTIVITY,
        weight: 30,
        isOptional: false,
      },
    ],
  },
  {
    name: 'Elementary Scheme',
    programType: 'elementary',
    components: [
      {
        name: 'Quizzes',
        type: ComponentType.QUIZ,
        weight: 25,
        isOptional: false,
      },
      {
        name: 'Activities',
        type: ComponentType.ACTIVITY,
        weight: 25,
        isOptional: false,
      },
      {
        name: 'Behavior',
        type: ComponentType.BEHAVIOR,
        weight: 20,
        isOptional: false,
      },
      {
        name: 'Projects',
        type: ComponentType.ACTIVITY,
        weight: 20,
        isOptional: false,
      },
      {
        name: 'Exams',
        type: ComponentType.EXAM,
        weight: 10,
        isOptional: false,
      },
    ],
  },
  {
    name: 'High School Scheme',
    programType: 'jhs',
    components: [
      {
        name: 'Quizzes',
        type: ComponentType.QUIZ,
        weight: 20,
        isOptional: false,
      },
      {
        name: 'Activities',
        type: ComponentType.ACTIVITY,
        weight: 20,
        isOptional: false,
      },
      {
        name: 'Behavior',
        type: ComponentType.BEHAVIOR,
        weight: 20,
        isOptional: false,
      },
      {
        name: 'Exams',
        type: ComponentType.EXAM,
        weight: 40,
        isOptional: false,
      },
    ],
  },
  {
    name: 'Senior High School Scheme',
    programType: 'shs',
    components: [
      {
        name: 'Quizzes',
        type: ComponentType.QUIZ,
        weight: 20,
        isOptional: false,
      },
      {
        name: 'Activities',
        type: ComponentType.ACTIVITY,
        weight: 20,
        isOptional: false,
      },
      {
        name: 'Behavior',
        type: ComponentType.BEHAVIOR,
        weight: 10,
        isOptional: false,
      },
      {
        name: 'Projects',
        type: ComponentType.ACTIVITY,
        weight: 10,
        isOptional: false,
      },
      {
        name: 'Exams',
        type: ComponentType.EXAM,
        weight: 40,
        isOptional: false,
      },
    ],
  },
  {
    name: 'College Scheme',
    programType: 'college',
    components: [
      {
        name: 'Quizzes',
        type: ComponentType.QUIZ,
        weight: 20,
        isOptional: false,
      },
      {
        name: 'Activities',
        type: ComponentType.ACTIVITY,
        weight: 20,
        isOptional: false,
      },
      {
        name: 'Behavior',
        type: ComponentType.BEHAVIOR,
        weight: 20,
        isOptional: false,
      },
      {
        name: 'Exams',
        type: ComponentType.EXAM,
        weight: 40,
        isOptional: false,
      },
    ],
  },
];