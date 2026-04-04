import type { TermInput } from "@/api/admin/semester.api";

export interface SemesterDraft {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  terms: TermInput[];
}

export interface SemesterErrors {
  name?: string;
  startDate?: string;
  endDate?: string;
  dateRange?: string;
  overlap?: string;
  terms?: Record<number, string[]>;
}

function isOverlapping(
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string }
): boolean {
  return a.startDate < b.endDate && a.endDate > b.startDate;
}

export function validateSemester(sem: SemesterDraft): SemesterErrors {
  const errors: SemesterErrors = {};

  if (!sem.name.trim()) errors.name = "Name is required.";
  if (!sem.startDate) errors.startDate = "Start date is required.";
  if (!sem.endDate) errors.endDate = "End date is required.";

  if (sem.startDate && sem.endDate && sem.startDate >= sem.endDate) {
    errors.dateRange = "Start date must be before end date.";
  }

  // Term validation
  const termErrors: Record<number, string[]> = {};
  sem.terms.forEach((term, i) => {
    const errs: string[] = [];
    if (!term.name.trim()) errs.push("Name is required.");
    if (!term.startDate) errs.push("Start date required.");
    if (!term.endDate) errs.push("End date required.");
    if (term.startDate && term.endDate && term.startDate >= term.endDate)
      errs.push("Start must be before end.");
    if (
      sem.startDate &&
      sem.endDate &&
      term.startDate &&
      term.endDate &&
      (term.startDate < sem.startDate || term.endDate > sem.endDate)
    ) {
      errs.push("Must fall within semester dates.");
    }
    if (errs.length > 0) termErrors[i] = errs;
  });

  // Term overlap check
  for (let i = 0; i < sem.terms.length; i++) {
    for (let j = i + 1; j < sem.terms.length; j++) {
      if (isOverlapping(sem.terms[i], sem.terms[j])) {
        termErrors[i] = [
          ...(termErrors[i] ?? []),
          `Overlaps with "${sem.terms[j].name || `Term ${j + 1}`}".`,
        ];
      }
    }
  }

  if (Object.keys(termErrors).length > 0) errors.terms = termErrors;

  return errors;
}

export function validateAllSemesters(semesters: SemesterDraft[]): {
  semesterErrors: SemesterErrors[];
  hasErrors: boolean;
  overlapError?: string;
} {
  const semesterErrors = semesters.map(validateSemester);

  // Cross-semester overlap
  let overlapError: string | undefined;
  for (let i = 0; i < semesters.length; i++) {
    for (let j = i + 1; j < semesters.length; j++) {
      if (
        semesters[i].startDate &&
        semesters[i].endDate &&
        semesters[j].startDate &&
        semesters[j].endDate &&
        isOverlapping(semesters[i], semesters[j])
      ) {
        overlapError = `"${semesters[i].name || `Semester ${i + 1}`}" and "${
          semesters[j].name || `Semester ${j + 1}`
        }" have overlapping dates.`;
      }
    }
  }

  const hasErrors =
    !!overlapError || semesterErrors.some((e) => Object.keys(e).length > 0);

  return { semesterErrors, hasErrors, overlapError };
}