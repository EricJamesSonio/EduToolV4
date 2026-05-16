"use client";

import { useParams, usePathname } from "next/navigation";
import { SidebarShell, NavGroup } from "./SidebarShell";
import { LogoutButton } from "./LogoutButton";
import {
  BookOpen,
  Video,
  ScrollText,
  LayoutGrid,
  FileText,
  ClipboardCheck,
  CalendarCheck,
  BarChart2,
} from "lucide-react";

const TOP_LEVEL_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "My Classes", href: "/student/classes", icon: BookOpen },
      { label: "Meetings", href: "/student/meetings", icon: Video },
      { label: "Transcript", href: "/student/transcript", icon: ScrollText },
    ],
  },
];

export function StudentSidebar() {
  const params = useParams();
  const pathname = usePathname();

  const classId = params?.classId as string | undefined;
  const inClass = !!classId && pathname.includes(`/student/classes/${classId}`);

  const groups: NavGroup[] = inClass
    ? [
        {
          label: "Main",
          items: [
            { label: "My Classes", href: "/student/classes", icon: BookOpen, exact: true },
            { label: "Meetings", href: "/student/meetings", icon: Video },
            { label: "Transcript", href: "/student/transcript", icon: ScrollText },
          ],
        },
        {
          label: "Current Class",
          items: [
            { label: "Overview", href: `/student/classes/${classId}`, icon: LayoutGrid, exact: true },
            { label: "Lessons", href: `/student/classes/${classId}/lessons`, icon: FileText },
            { label: "Assessments", href: `/student/classes/${classId}/assessments`, icon: ClipboardCheck },
            { label: "Attendance", href: `/student/classes/${classId}/attendance`, icon: CalendarCheck },
            { label: "Grades", href: `/student/classes/${classId}/grades`, icon: BarChart2 },
          ],
        },
      ]
    : TOP_LEVEL_GROUPS;

  return (
    <SidebarShell
      header={
        <p className="text-xs font-bold uppercase tracking-widest text-white">
          Student Portal
        </p>
      }
      groups={groups}
      footer={<LogoutButton />}
    />
  );
}