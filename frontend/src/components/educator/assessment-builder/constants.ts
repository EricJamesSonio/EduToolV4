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
