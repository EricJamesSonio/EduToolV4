"use client";

import { Mail, Hash, BookOpen, Users, Calendar } from "lucide-react";
import type { Student } from "@/types/admin/student.types";

interface Props {
  student: Student;
  levelName?: string;
  sectionName?: string;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps): React.JSX.Element {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium break-all">{value}</p>
      </div>
    </div>
  );
}

export function StudentInfoCard({
  student,
  levelName,
  sectionName,
}: Props): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-card px-5 py-1">
      <InfoRow
        icon={<Mail className="h-4 w-4" />}
        label="Email"
        value={student.email}
      />
      <InfoRow
        icon={<Hash className="h-4 w-4" />}
        label="Student ID"
        value={<span className="font-mono">{student.studentId}</span>}
      />
      <InfoRow
        icon={<BookOpen className="h-4 w-4" />}
        label="Level"
        value={levelName ?? <span className="text-muted-foreground">—</span>}
      />
      <InfoRow
        icon={<Users className="h-4 w-4" />}
        label="Section"
        value={sectionName ?? <span className="text-muted-foreground">—</span>}
      />
      <InfoRow
        icon={<Calendar className="h-4 w-4" />}
        label="Enrolled On"
        value={new Date(student.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />
    </div>
  );
}