// filepath: components/EducatorSidebar.tsx

"use client";

import { useParams, usePathname } from "next/navigation";
import { SidebarShell, NavGroup } from "./SidebarShell";
import { LogoutButton } from "./LogoutButton";
import {
  BookOpen,
  Library,
  ActivitySquare,
  LayoutGrid,
  FileText,
  ClipboardCheck,
  CalendarCheck,
  BarChart2,
  ClipboardList,
  Video,
  HelpCircle,
} from "lucide-react";

const TOP_LEVEL_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "My Classes", href: "/educator/classes", icon: BookOpen },
      { label: "Grading Scheme Library", href: "/educator/grading-scheme-library", icon: Library },
      { label: "Activity Log", href: "/educator/activity-log", icon: ActivitySquare },
    ],
  },
  {
    items: [
      { label: "Help", href: "/educator/help", icon: HelpCircle },
    ],
  },
];

export function EducatorSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const classId = params?.classId as string | undefined;

  const inClass =
    !!classId && pathname.includes(`/educator/classes/${classId}`);

  const groups: NavGroup[] = inClass
    ? [
        {
          items: [
            { label: "My Classes", href: "/educator/classes", icon: BookOpen, exact: true },
            { label: "Grading Scheme Library", href: "/educator/grading-scheme-library", icon: Library },
            { label: "Activity Log", href: "/educator/activity-log", icon: ActivitySquare },
          ],
        },
        {
          label: "Current Class",
          items: [
            { label: "Overview", href: `/educator/classes/${classId}`, icon: LayoutGrid, exact: true },
            { label: "Lessons", href: `/educator/classes/${classId}/lessons`, icon: FileText },
            { label: "Assessments", href: `/educator/classes/${classId}/assessments`, icon: ClipboardCheck },
            { label: "Attendance", href: `/educator/classes/${classId}/attendance`, icon: CalendarCheck },
            { label: "Grades", href: `/educator/classes/${classId}/grades`, icon: BarChart2 },
            { label: "Grading Scheme", href: `/educator/classes/${classId}/grading-scheme`, icon: ClipboardList },
            { label: "Meetings", href: `/educator/classes/${classId}/meetings`, icon: Video },
          ],
        },
        {
          items: [
            { label: "Help", href: "/educator/help", icon: HelpCircle },
          ],
        },
      ]
    : TOP_LEVEL_GROUPS;

  return (
    <SidebarShell
      header={
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Educator Portal
        </p>
      }
      groups={groups}
      footer={<LogoutButton />}
    />
  );
}