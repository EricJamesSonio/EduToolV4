// Program Types Constants
// Centralized program type definitions for consistency across the application

export const PROGRAM_TYPES = [
  { value: 'daycare', label: 'Daycare / Pre-School' },
  { value: 'kinder', label: 'Kindergarten' },
  { value: 'elementary', label: 'Elementary School' },
  { value: 'jhs', label: 'Junior High School' },
  { value: 'shs', label: 'Senior High School' },
  { value: 'college', label: 'College / University' },
  { value: 'vocational', label: 'Vocational' },
  { value: 'special', label: 'Special Education' },
  { value: 'stem', label: 'STEM' },
  { value: 'arts', label: 'Arts' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' },
] as const;

// Individual program type constants for better type safety
export const PROGRAM_TYPE_DAYCARE = 'daycare';
export const PROGRAM_TYPE_KINDER = 'kinder';
export const PROGRAM_TYPE_ELEMENTARY = 'elementary';
export const PROGRAM_TYPE_JHS = 'jhs';
export const PROGRAM_TYPE_SHS = 'shs';
export const PROGRAM_TYPE_COLLEGE = 'college';
export const PROGRAM_TYPE_VOCATIONAL = 'vocational';
export const PROGRAM_TYPE_SPECIAL_EDUCATION = 'special';
export const PROGRAM_TYPE_STEM = 'stem';
export const PROGRAM_TYPE_ARTS = 'arts';
export const PROGRAM_TYPE_SPORTS = 'sports';
export const PROGRAM_TYPE_OTHER = 'other';

// Type definition for program types
export type ProgramType = typeof PROGRAM_TYPES[number]['value'];

// Helper function to get label by value
export const getProgramTypeLabel = (value: string): string => {
  const programType = PROGRAM_TYPES.find(type => type.value === value);
  return programType?.label || value;
};

// Helper function to validate program type
export const isValidProgramType = (value: string): boolean => {
  return PROGRAM_TYPES.some(type => type.value === value);
};
