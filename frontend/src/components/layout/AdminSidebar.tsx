"use client";

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
  UserPlus,
  Database,
  Inbox,
} from "lucide-react";

const GROUPS = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, exact: true },
      { label: "Organization", href: "/admin/organization", icon: Building2 },
      { label: "Data Seeder", href: "/admin/data-seeder", icon: Database },
      { label: "Enrollment", href: "/admin/enrollment", icon: UserPlus },
      { label: "Enrollment Portal", href: "/admin/enrollment-portal", icon: Inbox },
      
    ],
  },
  {
    label: "Academic",
    items: [
      { label: "School Years", href: "/admin/school-years", icon: CalendarDays },
      { label: "Programs", href: "/admin/programs", icon: BookOpen },
      { label: "Sections", href: "/admin/sections", icon: Layers },
      { label: "Subjects", href: "/admin/subjects", icon: FlaskConical },
      { label: "Academic Calendar", href: "/admin/academic-calendar", icon: CalendarRange },
      { label: "Semester Settings", href: "/admin/semester-settings", icon: CalendarClock },
      { label: "Classes", href: "/admin/classes", icon: GraduationCap },
      
    ],
  },
  {
    label: "Grading",
    items: [
      { label: "Grading Scales", href: "/admin/grading-scales", icon: BarChart3 },
      { label: "Grading Schemes", href: "/admin/grading-schemes", icon: ClipboardList },
      
    ],
  },
  {
    label: "People",
    items: [
      { label: "Educators", href: "/admin/educators", icon: UserSquare2 },
      { label: "Students", href: "/admin/students", icon: Users },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Grade Lock", href: "/admin/grade-lock", icon: Lock },
      { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
    ],
  },
];

export function AdminSidebar(): React.JSX.Element {
  return (
    <SidebarShell
      header={
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground not-interactive">
            Admin Portal
          </p>
          <p className="text-[11px] text-muted-foreground not-interactive">
            System Management
          </p>
        </div>
      }
      groups={GROUPS}
      footer={<LogoutButton />}
    />
  );
}