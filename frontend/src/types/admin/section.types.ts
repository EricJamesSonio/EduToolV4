/**
 * Section Type Definitions
 * Matches backend/prisma/schema.prisma Section model
 */

export interface Section {
  id: string;
  org_id: string;
  level_id: string;
  course_id: string | null;      // ← ADDED: Optional for College programs
  strand_id: string | null;      // ← ADDED: Optional for SHS programs
  school_year_id: string;        // ← ADDED: Required, ties section to school year
  name: string;
  capacity: number;
  deleted_at: string | null;
  studentCount?: number;         // Optional, computed on frontend
}

/**
 * Section with all related data populated
 * Use when you need the full context (level, course, strand info)
 */
export interface SectionWithRelations extends Section {
  level?: {
    id: string;
    name: string;
    program_id: string;
  };
  course?: {
    id: string;
    name: string;
    code: string | null;
  };
  strand?: {
    id: string;
    name: string;
  };
  schoolYear?: {
    id: string;
    name: string;
  };
}

/**
 * DTO for creating a section
 */
export interface CreateSectionDTO {
  level_id: string;
  course_id?: string;   // Optional for College
  strand_id?: string;   // Optional for SHS
  school_year_id: string;
  name: string;
  capacity: number;
}

/**
 * DTO for updating a section
 */
export interface UpdateSectionDTO {
  level_id?: string;
  course_id?: string | null;
  strand_id?: string | null;
  name?: string;
  capacity?: number;
}