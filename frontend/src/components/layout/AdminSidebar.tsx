"use client";

import { SidebarShell } from "./SidebarShell";
import { LogoutButton } from "./LogoutButton";
import {
  LayoutDashboard, Building2, CalendarDays, BookOpen, Layers,
  FlaskConical, CalendarClock, BarChart3, ClipboardList,
  GraduationCap, Users, UserSquare2, Lock, ScrollText,
} from "lucide-react";

const GROUPS = [
  {
    items: [
      { label: "Dashboard",         href: "/admin/dashboard",         icon: LayoutDashboard, exact: true },
      { label: "Organization",      href: "/admin/organization",      icon: Building2 },
      { label: "School Years",      href: "/admin/school-years",      icon: CalendarDays },
      { label: "Programs",          href: "/admin/programs",          icon: BookOpen },
      { label: "Sections",          href: "/admin/sections",          icon: Layers },
      { label: "Subjects",          href: "/admin/subjects",          icon: FlaskConical },
      { label: "Semester Settings", href: "/admin/semester-settings", icon: CalendarClock },
      { label: "Grading Scales",    href: "/admin/grading-scales",    icon: BarChart3 },
      { label: "Grading Schemes",            href: "/admin/grading-schemes",            icon: ClipboardList },
      { label: "Classes",           href: "/admin/classes",           icon: GraduationCap },
      { label: "Educators",         href: "/admin/educators",         icon: UserSquare2 },
      { label: "Students",          href: "/admin/students",          icon: Users },
      { label: "Grade Lock",        href: "/admin/grade-lock",        icon: Lock },
      { label: "Audit Log",         href: "/admin/audit-log",         icon: ScrollText },
    ],
  },
];

export function AdminSidebar(): React.JSX.Element {
  return (
    <SidebarShell
      header={
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin Portal
        </p>
      }
      groups={GROUPS}
      footer={<LogoutButton />}
    />
  );
}