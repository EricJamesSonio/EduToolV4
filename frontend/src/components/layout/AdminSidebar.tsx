"use client";

// frontend/src/components/layout/AdminSidebar.tsx

import { SidebarShell } from "./SidebarShell";
import { LogoutButton } from "./LogoutButton";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  BookOpen,
  Layers,
  FlaskConical,
  CalendarClock,
  BarChart3,
  ClipboardList,
  GraduationCap,
  Users,
  UserSquare2,
  Lock,
  ScrollText,
  CalendarRange,
} from "lucide-react";

const GROUPS = [
  {
    label: "Main",
    items: [
      { label: "Dashboard",    href: "/admin/dashboard",    icon: LayoutDashboard, exact: true },
      { label: "Organization", href: "/admin/organization", icon: Building2 },
      { label: "School Years", href: "/admin/school-years", icon: CalendarDays },
    ],
  },
  {
    label: "Academic",
    items: [
      { label: "Programs",          href: "/admin/programs",          icon: BookOpen },
      { label: "Sections",          href: "/admin/sections",          icon: Layers },
      { label: "Subjects",          href: "/admin/subjects",          icon: FlaskConical },
      { label: "Semester Settings", href: "/admin/semester-settings", icon: CalendarClock },
      { label: "Academic Calendar", href: "/admin/academic-calendar", icon: CalendarRange },
    ],
  },
  {
    label: "Grading",
    items: [
      { label: "Grading Scales",  href: "/admin/grading-scales",  icon: BarChart3 },
      { label: "Grading Schemes", href: "/admin/grading-schemes", icon: ClipboardList },
      { label: "Classes",         href: "/admin/classes",         icon: GraduationCap },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Educators", href: "/admin/educators", icon: UserSquare2 },
      { label: "Students",  href: "/admin/students",  icon: Users },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Grade Lock", href: "/admin/grade-lock", icon: Lock },
      { label: "Audit Log",  href: "/admin/audit-log",  icon: ScrollText },
    ],
  },
];

export function AdminSidebar(): React.JSX.Element {
  return (
    <SidebarShell
      header={
        <p className="text-xs font-bold uppercase tracking-widest text-white">
          Admin Portal
        </p>
      }
      groups={GROUPS}
      footer={<LogoutButton />}
    />
  );
}