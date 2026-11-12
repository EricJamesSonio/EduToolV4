"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/shared/Modal";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/utils/profile.util";
import type { Student } from "@/types/admin/student.types";

export interface StudentDetailContext {
  programName?: string | null;
  sectionName?: string | null;
}

interface StudentDetailModalProps {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  context?: StudentDetailContext | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function DetailItem({
  label,
  value,
  breakAll,
}: {
  label: string;
  value: ReactNode;
  breakAll?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border bg-muted/20 px-4 py-3">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div
        className={
          breakAll
            ? "break-all text-sm font-medium"
            : "break-words text-sm font-medium"
        }
      >
        {value}
      </div>
    </div>
  );
}

export function StudentDetailModal({
  open,
  onClose,
  student,
  context,
}: StudentDetailModalProps) {
  const courseOrStrand = student?.courseName ?? student?.strandName ?? null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Student Details"
      description="Profile and enrollment information"
      size="2xl"
    >
      {!student ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Student details are not available.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage
                src={getProfileImageUrl(student.profileImage)}
                alt={student.fullName}
              />
              <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                {getInitials(student.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <p className="truncate text-base font-semibold">
                {student.fullName}
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">
                  {student.studentId}
                </span>
                <Badge
                  variant={student.status === "active" ? "default" : "secondary"}
                  className="text-[10px] capitalize"
                >
                  {student.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem label="Email" value={student.email} breakAll />
            <DetailItem
              label="Personal Email"
              value={student.personalEmail || "—"}
              breakAll
            />
            <DetailItem
              label="Department"
              value={context?.programName || student.programName || "—"}
            />
            <DetailItem label="Course / Strand" value={courseOrStrand ?? "—"} />
            <DetailItem label="Level / Grade" value={student.levelName ?? "—"} />
            <DetailItem
              label="Section"
              value={context?.sectionName || student.sectionName || "—"}
            />
            <DetailItem
              label="Account Created"
              value={new Date(student.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}