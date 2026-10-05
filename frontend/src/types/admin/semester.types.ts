// ===== File: frontend/src/types/admin/semester.types.ts =====

// ========================================
// TERM
// ========================================

export interface Term {
  id: string
  name: string
  orderIndex: number
  startDate: string
  endDate: string
}

// ========================================
// SEMESTER (ACTUAL - SCHOOL YEAR)
// ========================================

export interface Semester {
  id: string
  schoolYearId: string
  // The program this semester belongs to — required backend-side since the
  // semester program-scope migration; semesters are per-department.
  programId: string
  name: string
  startDate: string
  endDate: string
  terms: Term[]
}

// ========================================
// TEMPLATE (UPDATED)
// ========================================

export interface SemesterTemplate {
  id: string
  orgId: string

  name: string

  // ❌ REMOVED (implicit)
  // programType

  // ✅ NEW: explicit assignments
  assignments: ProgramSemesterAssignment[]

  semesters: Semester[]

  usedByCount: number

  createdAt: string
  updatedAt: string
}

// ========================================
// NEW: PROGRAM ASSIGNMENT
// ========================================

export interface ProgramSemesterAssignment {
  id: string

  programId: string   // ✅ replaces program_type

  templateId: string
}