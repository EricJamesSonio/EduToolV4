import {
  Info,
  AlertCircle,
  CheckCircle,
  BookOpen,
  MessageSquare,
  Reply,
  ClipboardList,
  FileText,
  Send,
  Award,
  Lock,
  PenLine,
  RotateCcw,
} from "lucide-react";

export const TYPE_ICON: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  lesson: BookOpen,
  concern_created: MessageSquare,
  concern_reply: Reply,
  application_submitted: ClipboardList,
  assessment_released: FileText,
  assessment_assigned: ClipboardList,
  assessment_reopened: RotateCcw,
  assessment_submitted: Send,
  score_published: Award,
  essay_graded: PenLine,
  grade_locked: Lock,
};

export const SUMMARY_ROWS: {
  type: string;
  icon: React.ElementType;
  label: (n: number) => string;
  href: string;
}[] = [
  {
    type: "concern_created",
    icon: MessageSquare,
    label: (n) => `${n} new concern${n === 1 ? "" : "s"} from students`,
    href: "/admin/concerns",
  },
  {
    type: "concern_reply",
    icon: Reply,
    label: (n) => `${n} new repl${n === 1 ? "y" : "ies"} on concerns`,
    href: "/admin/concerns",
  },
  {
    type: "application_submitted",
    icon: ClipboardList,
    label: (n) => `${n} new application form${n === 1 ? "" : "s"}`,
    href: "/admin/enrollment-portal/applications",
  },
];