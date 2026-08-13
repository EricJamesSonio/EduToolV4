"use client";

import { useState, useMemo } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { studentApi } from "@/api/admin/student.api";
import type { Student } from "@/types/admin/student.types";
import type { StudentSchoolYearEnrollment } from "@/types/admin/student-enrollment.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  alreadyEnrolled: StudentSchoolYearEnrollment[];
  onConfirm: (students: Student[]) => void;
  isLoading: boolean;
}

export function EnrollStudentDialog({
  open,
  onClose,
  alreadyEnrolled,
  onConfirm,
  isLoading,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: allStudents = [], isLoading: studentsLoading } = useAsyncQuery(
    queryKeys.admin.students.list(),
    () => studentApi.getAll({}),
    { enabled: open },
  );

  const enrolledIds = useMemo(
    () => new Set(alreadyEnrolled.map((e) => e.student_id)),
    [alreadyEnrolled],
  );

  const eligible = useMemo(
    () => allStudents.filter((s) => !enrolledIds.has(s.id)),
    [allStudents, enrolledIds],
  );

  const filtered = useMemo(() => {
    if (!search) return eligible;
    const q = search.toLowerCase();
    return eligible.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q),
    );
  }, [eligible, search]);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  const toggle = (student: Student) => {
    setSelected((prev) =>
      selectedIds.has(student.id)
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, student],
    );
  };

  const handleClose = () => {
    setSearch("");
    setSelected([]);
    onClose();
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    onConfirm(selected);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Enroll Students
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((s) => (
              <Badge
                key={s.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {s.fullName}
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  className="ml-0.5 rounded hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="max-h-96 overflow-y-auto rounded-md border divide-y">
          {studentsLoading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Loading students...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {search
                ? "No students match your search."
                : "All students are already enrolled in this school year."}
            </div>
          ) : (
            filtered.map((student) => {
              const isSelected = selectedIds.has(student.id);
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => toggle(student)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-left",
                    "hover:bg-muted/50 transition-colors",
                    isSelected && "bg-primary/5",
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{student.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {student.studentId} · {student.email}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "ml-3 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {isSelected && (
                      <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current">
                        <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {selected.length > 0
              ? `${selected.length} student${selected.length > 1 ? "s" : ""} selected`
              : "Select students to enroll"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={selected.length === 0 || isLoading}
            >
              {isLoading ? "Enrolling..." : `Enroll ${selected.length > 0 ? `(${selected.length})` : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>

      {confirmOpen && (
        <ConfirmDialog
          open
          title="Enroll students?"
          message={`Are you sure you want to enroll ${selected.length} student${selected.length > 1 ? "s" : ""} in the department?`}
          confirmLabel="Enroll"
          isLoading={isLoading}
          onConfirm={handleConfirm}
          onOpenChange={(o) => { if (!o) setConfirmOpen(false); }}
        />
      )}
    </Dialog>
  );
}