"use client";

import { SidebarShell } from "./SidebarShell";
import { LogoutButton } from "./LogoutButton";
import { useRole } from "@/hooks/useRole";
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
  UserCog,
  Database,
  Inbox,
  LifeBuoy,
} from "lucide-react";

const GROUPS = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, exact: true, registrarVisible: false },
      { label: "Organization", href: "/admin/organization", icon: Building2, registrarVisible: false },
      { label: "Data Seeder", href: "/admin/data-seeder", icon: Database, registrarVisible: false },
      { label: "Enrollment", href: "/admin/enrollment", icon: UserPlus },
      { label: "Enrollment Portal", href: "/admin/enrollment-portal", icon: Inbox },
      
    ],
  },
  {
    label: "Academic",
    items: [
      { label: "School Years", href: "/admin/school-years", icon: CalendarDays, registrarVisible: false },
      { label: "Departments", href: "/admin/programs", icon: BookOpen, registrarVisible: false },
      { label: "Sections", href: "/admin/sections", icon: Layers },
      { label: "Subjects", href: "/admin/subjects", icon: FlaskConical, registrarVisible: false },
      { label: "Academic Calendar", href: "/admin/academic-calendar", icon: CalendarRange, registrarVisible: false },
      { label: "Semester Settings", href: "/admin/semester-settings", icon: CalendarClock, registrarVisible: false },
      { label: "Classes", href: "/admin/classes", icon: GraduationCap, registrarVisible: false },
      
    ],
  },
  {
    label: "Grading",
    items: [
      { label: "Grading Scales", href: "/admin/grading-scales", icon: BarChart3, registrarVisible: false },
      { label: "Grading Schemes", href: "/admin/grading-schemes", icon: ClipboardList, registrarVisible: false },
      
    ],
  },
  {
    label: "People",
    items: [
      { label: "Educators", href: "/admin/educators", icon: UserSquare2, registrarVisible: false },
      { label: "Students", href: "/admin/students", icon: Users },
      { label: "Registrars", href: "/admin/registrars", icon: UserCog, registrarVisible: false },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Grade Lock", href: "/admin/grade-lock", icon: Lock, registrarVisible: false },
      { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText, registrarVisible: false },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "Concerns", href: "/admin/concerns", icon: LifeBuoy, registrarVisible: true },
    ],
  },
];

export function AdminSidebar(): React.JSX.Element {
  const { isRegistrar } = useRole();
  const filteredGroups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !isRegistrar || item.registrarVisible !== false,
    ),
  })).filter((group) => group.items.length > 0);

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
      groups={filteredGroups}
      footer={<LogoutButton />}
    />
  );
}