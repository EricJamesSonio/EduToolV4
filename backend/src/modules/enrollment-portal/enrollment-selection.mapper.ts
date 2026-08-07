// src/modules/enrollment-portal/enrollment-selection.mapper.ts
//
// Single source of truth for the Program -> Course/Strand conditional used by
// the public application form. Mirrors the internal admin enrollment flow
// (frontend/src/app/admin/enrollment/enroll/page.tsx): only `college` picks a
// course and only `shs` picks a strand; every other program type places levels
// directly under the program.

export interface SelectionShape {
  usesCourses: boolean;
  usesStrands: boolean;
}

export function resolveSelectionShape(programType: string): SelectionShape {
  return {
    usesCourses: programType === 'college',
    usesStrands: programType === 'shs',
  };
}