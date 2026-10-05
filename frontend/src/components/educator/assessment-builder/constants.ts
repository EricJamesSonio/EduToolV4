import type { GradingMode, QuestionType } from "@/types/educator/assessment.types";

export const GRADING_MODE_LABELS: Record<string, string> = {
  system: "System-Graded",
  manual: "Manual-Graded",
};

export const TYPE_LABELS: Record<string, string> = {
  written_work: "Written Work", performance_task: "Performance Task",
  quarterly_assessment: "Quarterly Assessment", exam: "Exam", quiz: "Quiz",
  assignment: "Assignment", project: "Project", recitation: "Recitation",
  participation: "Participation", behavior: "Behavior",
  attendance: "Attendance", activity: "Activity", custom: "Custom", other: "Other",
};

// Single source of truth for assessment type values on the frontend.
// `AssessmentType` (types/educator/assessment.types.ts) and the scheme-type
// filter in the new-assessment page both derive from this list — do not
// hardcode a second allow-list elsewhere (see TICK-ASSESS-001).
export const ASSESSMENT_TYPE_VALUES = [
  "written_work", "performance_task", "quarterly_assessment", "exam", "quiz",
  "assignment", "project", "recitation", "participation", "behavior",
  "attendance", "activity", "custom", "other",
] as const;

// TICK-ASSESS-005: the flat list above answers "which types exist?" but not
// "which types can the AI auto-grade?". Without that split the System-Graded
// step offered `behavior` / `participation`, the AI generated auto-graded
// multiple-choice questions for them, and the result was averaged into the
// grade by weight. Must stay in sync with
// `backend/src/modules/grading-scheme/constants/assessment-type.constants.ts`
// (`SYSTEM_GRADABLE_TYPES`) — the parity spec pins the two lists together.
export const SYSTEM_GRADABLE_ASSESSMENT_TYPES = [
  "written_work", "quarterly_assessment", "exam", "quiz",
  "assignment", "project", "recitation", "activity", "custom", "other",
] as const;

export const MANUAL_ONLY_ASSESSMENT_TYPES = [
  "participation", "behavior", "attendance", "performance_task",
] as const;

/**
 * Whether an assessment type may be auto-graded.
 *
 * Mirrors the backend `isSystemGradable()`: unknown values fail closed so a new
 * or stale type stays out of the auto-graded path by default. The backend is
 * still authoritative — this only shapes the UI.
 */
export function isSystemGradable(type: string): boolean {
  return (SYSTEM_GRADABLE_ASSESSMENT_TYPES as readonly string[]).includes(type);
}

/**
 * Filter a scheme's types down to those valid for the active grading mode.
 *
 * System/hybrid assessments are auto-graded, so manual-only types are removed;
 * the manual path can use every type in the scheme.
 */
export function typesForGradingMode<T extends string>(
  types: readonly T[],
  gradingMode: GradingMode,
): T[] {
  if (gradingMode === "manual") return [...types];
  return types.filter(isSystemGradable);
}

export const CIRCLE_COLORS = [
  { fill: "bg-blue-500 text-white border-transparent", outline: "border-blue-500 text-blue-500 bg-card" },
  { fill: "bg-emerald-500 text-white border-transparent", outline: "border-emerald-500 text-emerald-500 bg-card" },
  { fill: "bg-purple-500 text-white border-transparent", outline: "border-purple-500 text-purple-500 bg-card" },
  { fill: "bg-amber-500 text-white border-transparent", outline: "border-amber-500 text-amber-500 bg-card" },
  { fill: "bg-teal-500 text-white border-transparent", outline: "border-teal-500 text-teal-500 bg-card" },
  { fill: "bg-indigo-500 text-white border-transparent", outline: "border-indigo-500 text-indigo-500 bg-card" },
  { fill: "bg-pink-500 text-white border-transparent", outline: "border-pink-500 text-pink-500 bg-card" },
  { fill: "bg-cyan-500 text-white border-transparent", outline: "border-cyan-500 text-cyan-500 bg-card" },
  { fill: "bg-orange-500 text-white border-transparent", outline: "border-orange-500 text-orange-500 bg-card" },
  { fill: "bg-rose-500 text-white border-transparent", outline: "border-rose-500 text-rose-500 bg-card" },
];

export const Q_TYPES: { value: QuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_or_false", label: "True or False" },
  { value: "identification", label: "Identification" },
  { value: "enumeration", label: "Enumeration" },
  { value: "manual", label: "Manual (Educator-Written)" },
];
