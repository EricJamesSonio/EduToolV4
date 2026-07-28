"use client";

import { ArrowLeft, Pencil, KeyRound, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Student } from "@/types/admin/student.types";

interface Props {
  student: Student;
  onEdit: () => void;
  onResetPassword: () => void;
  onUpdateStatus: () => void;
}

export function StudentDetailHeader({
  student,
  onEdit,
  onResetPassword,
  onUpdateStatus,
}: Props): React.JSX.Element {
  const router = useRouter();

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <button
          onClick={() => router.push("/admin/students")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Students
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight not-interactive">
            {student.fullName}
          </h1>
          <StatusBadge status={student.status} />
        </div>
        <p className="text-sm text-muted-foreground font-mono not-interactive">
          {student.studentId}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={onUpdateStatus}>
          <ShieldCheck className="mr-1.5 h-4 w-4" />
          Status
        </Button>
        <Button variant="outline" size="sm" onClick={onResetPassword}>
          <KeyRound className="mr-1.5 h-4 w-4" />
          Reset Password
        </Button>
        <Button size="sm" onClick={onEdit}>
          <Pencil className="mr-1.5 h-4 w-4" />
          Edit
        </Button>
      </div>
    </div>
  );
}