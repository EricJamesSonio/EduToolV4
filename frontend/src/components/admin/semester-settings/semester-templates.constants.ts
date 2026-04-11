/**
 * Philippines Standard Semester Templates
 * 
 * Based on DepEd and Philippine higher education standards:
 * - Elementary (Grades 1-6): 4 Quarters (grading periods)
 * - Junior High School (Grades 7-10): 4 Quarters (grading periods)
 * - Senior High School (Grades 11-12): 2 Semesters with 4 Terms each
 * - College: 2 Semesters with 4 Terms each (Prelim, Midterm, Pre-Finals, Finals)
 * - Kinder & Daycare: 2 Terms
 */

import type { ProgramType } from "@/types/admin/semester-template.types";

export interface LocalTerm {
  name: string;
}

export interface LocalSemester {
  name: string;
  terms: LocalTerm[];
}

/**
 * Default semester & term templates by program type (Philippine standards)
 */
export const DEFAULT_TEMPLATES: Record<ProgramType, LocalSemester[]> = {
  daycare: [
    {
      name: "Level 1",
      terms: [{ name: "1st Term" }, { name: "2nd Term" }],
    },
  ],
  
  kinder: [
    {
      name: "Kinder",
      terms: [{ name: "1st Term" }, { name: "2nd Term" }],
    },
  ],
  
  // Elementary: 4 Quarters (grading periods)
  elementary: [
    {
      name: "Grade 1",
      terms: [
        { name: "1st Quarter" },
        { name: "2nd Quarter" },
        { name: "3rd Quarter" },
        { name: "4th Quarter" },
      ],
    },
  ],
  
  // Junior High School: 4 Quarters per grade
  jhs: [
    {
      name: "Grade 7",
      terms: [
        { name: "1st Quarter" },
        { name: "2nd Quarter" },
        { name: "3rd Quarter" },
        { name: "4th Quarter" },
      ],
    },
    {
      name: "Grade 8",
      terms: [
        { name: "1st Quarter" },
        { name: "2nd Quarter" },
        { name: "3rd Quarter" },
        { name: "4th Quarter" },
      ],
    },
  ],
  
  // Senior High School: 2 Semesters × 4 Terms (Prelim, Midterm, Pre-Finals, Finals)
  shs: [
    {
      name: "1st Semester",
      terms: [
        { name: "Prelim" },
        { name: "Midterm" },
        { name: "Pre-Finals" },
        { name: "Finals" },
      ],
    },
    {
      name: "2nd Semester",
      terms: [
        { name: "Prelim" },
        { name: "Midterm" },
        { name: "Pre-Finals" },
        { name: "Finals" },
      ],
    },
  ],
  
  // College: 2 Semesters × 4 Terms (Prelim, Midterm, Pre-Finals, Finals)
  college: [
    {
      name: "1st Semester",
      terms: [
        { name: "Prelim" },
        { name: "Midterm" },
        { name: "Pre-Finals" },
        { name: "Finals" },
      ],
    },
    {
      name: "2nd Semester",
      terms: [
        { name: "Prelim" },
        { name: "Midterm" },
        { name: "Pre-Finals" },
        { name: "Finals" },
      ],
    },
  ],
  
  custom: [],
};

/**
 * Friendly display labels for program types
 */
export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  daycare: "Daycare",
  kinder: "Kinder / Pre-School",
  elementary: "Elementary (Grades 1-6)",
  jhs: "Junior High School (Grades 7-10)",
  shs: "Senior High School (Grades 11-12)",
  college: "College / University",
  custom: "Custom",
};

/**
 * Descriptions for each program type (shown as hints/help text)
 */
export const PROGRAM_TYPE_DESCRIPTIONS: Record<ProgramType, string> = {
  daycare: "Ages 2-4, typically 2 terms per year",
  kinder: "Kindergarten or pre-school, 2 terms per year",
  elementary: "Grades 1-6, 4 quarters (grading periods) per year",
  jhs: "Junior High School (Grades 7-10), 4 quarters per year",
  shs: "Senior High School (Grades 11-12), 2 semesters with 4 terms each (Prelim, Midterm, Pre-Finals, Finals)",
  college: "Higher education, 2 semesters with 4 terms each (Prelim, Midterm, Pre-Finals, Finals)",
  custom: "Define your own semester and term structure",
};