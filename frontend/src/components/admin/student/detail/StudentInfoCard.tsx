"use client";

import { useState } from "react";
import { Mail, AtSign, Hash, Calendar, GraduationCap, BookOpen, Users, Layers, ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/utils/profile.util";
import { AssignSectionDialog } from "@/components/admin/school-years/program-view/AssignSectionDialog";
import type { Student } from "@/types/admin/student.types";
import type {
  StudentSchoolYearEnrollment,
  ProgramEnrollmentSnapshot,
} from "@/types/admin/student-enrollment.types";

interface Props {
  student:               Student;
  schoolYearEnrollments: StudentSchoolYearEnrollment[];
  schoolYearId:          string;
  isEnded:               boolean;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

interface InfoRowProps {
  icon:  React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps): React.JSX.Element {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5 not-interactive">{label}</p>
        <div className="text-sm font-medium break-all not-interactive">{value}</div>
      </div>
    </div>
  );
}

export function StudentInfoCard({
  student,
  schoolYearEnrollments,
  schoolYearId,
  isEnded,
}: Props): React.JSX.Element {
const [moveTarget, setMoveTarget] = useState<{
    sye: StudentSchoolYearEnrollment;
    programEnrollment: ProgramEnrollmentSnapshot;
  } | null>(null);

  // Map each program enrollment back to its parent school-year enrollment so the
  // Move action can reuse AssignSectionDialog.
  const enrollmentByProgramId = new Map<string, StudentSchoolYearEnrollment>();
  for (const sye of schoolYearEnrollments) {
    for (const pe of sye.programEnrollments) {
      enrollmentByProgramId.set(pe.id, sye);
    }
  }

  const allProgramEnrollments = schoolYearEnrollments.flatMap(
    (sye) => sye.programEnrollments,
  );

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex gap-6">
        <Avatar className="h-20 w-20 shrink-0">
          <AvatarImage
            src={getProfileImageUrl(student.profileImage)}
            alt={student.fullName}
          />
          <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
            {getInitials(student.fullName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <InfoRow
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={student.email}
          />
          <InfoRow
            icon={<AtSign className="h-4 w-4" />}
            label="Personal Email"
            value={student.personalEmail || "—"}
          />
          <InfoRow
            icon={<Hash className="h-4 w-4" />}
            label="Student ID"
            value={<span className="font-mono">{student.studentId}</span>}
          />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Account Created"
            value={new Date(student.createdAt).toLocaleDateString("en-US", {
              year:  "numeric",
              month: "long",
              day:   "numeric",
            })}
          />

          <InfoRow
            icon={<GraduationCap className="h-4 w-4" />}
            label="Enrollments"
            value={
              allProgramEnrollments.length === 0 ? (
                <span className="text-muted-foreground font-normal not-interactive">
                  Not enrolled in any program yet.
                </span>
              ) : (
                <div className="space-y-3 mt-1">
                  {allProgramEnrollments.map((pe) => (
                    <div
                      key={pe.id}
                      className="rounded-md border bg-muted/30 px-3 py-2.5 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-semibold not-interactive">{pe.program.name}</span>
                        {!isEnded && (
                          <button
                            onClick={() => {
                              const sye = enrollmentByProgramId.get(pe.id);
                              if (sye) {
                                setMoveTarget({ sye, programEnrollment: pe });
                              }
                            }}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors shrink-0"
                            title="Move to another section"
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                            Move
                          </button>
                        )}
                        <Badge
                          variant={pe.status === "active" ? "default" : "secondary"}
                          className="text-xs ml-auto not-interactive"
                        >
                          {pe.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 pl-5 text-xs text-muted-foreground">
                        {pe.level && (
                          <span className="flex items-center gap-1 not-interactive">
                            <Layers className="h-3 w-3" />
                            {pe.level.name}
                          </span>
                        )}
                        {pe.course && (
                          <span className="flex items-center gap-1 not-interactive">
                            <BookOpen className="h-3 w-3" />
                            {pe.course.code
                              ? `${pe.course.code} – ${pe.course.name}`
                              : pe.course.name}
                          </span>
                        )}
                        {pe.strand && (
                          <span className="flex items-center gap-1 not-interactive">
                            <BookOpen className="h-3 w-3" />
                            {pe.strand.name}
                          </span>
                        )}
                        {pe.section && (
                          <span className="flex items-center gap-1 not-interactive">
                            <Users className="h-3 w-3" />
                            {pe.section.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          />
        </div>
      </div>

      {moveTarget && (
        <AssignSectionDialog
          open
          onClose={() => setMoveTarget(null)}
          enrollment={moveTarget.sye}
          programEnrollment={moveTarget.programEnrollment}
          schoolYearId={schoolYearId}
          isEnded={isEnded}
        />
      )}
    </div>
  );
}
