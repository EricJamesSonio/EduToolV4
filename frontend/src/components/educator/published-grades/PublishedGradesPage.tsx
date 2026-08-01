"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Lock, Loader2, FileText, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useClassGrades, usePublishStudent, useUnlockStudent } from "@/hooks/educator/useGrades"
import { educatorGradingSchemeApi } from "@/api/educator/grading-scheme.api"
import { educatorGradeLockApi } from "@/api/educator/grade-lock.api"
import apiClient from "@/api/client"
import { useQueryClient } from "@tanstack/react-query"
import { StudentList, type StudentSummary } from "./StudentList"
import { StudentGradeCard } from "./StudentGradeCard"
import type { GradingScale } from "@/types/admin/grading-scale.types"

export function PublishedGradesPage({ classId }: { classId: string }) {
  const { data: allTerms, isLoading: termsLoading } = useClassGrades(classId)
  const qc = useQueryClient()

  const { data: gradingScale } = useQuery<GradingScale | null>({
    queryKey: ["grading-scale", "class", classId],
    queryFn: () => educatorGradingSchemeApi.getScaleForClass(classId),
    enabled: !!classId,
  })

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [publishAllOpen, setPublishAllOpen] = useState(false)
  const [publishingAll, setPublishingAll] = useState(false)

  const activeTerms = allTerms ?? []

  // Build flat unique student list with publish status
  const allStudents = useMemo<StudentSummary[]>(() => {
    if (!allTerms) return []
    const seen = new Map<string, StudentSummary>()
    for (const term of allTerms) {
      for (const s of term.students) {
        const existing = seen.get(s.studentId)
        const isPublished = s.grade?.is_locked ?? false
        if (existing) {
          if (isPublished) existing.publishedTermIds.push(term.termId)
        } else {
          seen.set(s.studentId, {
            studentId: s.studentId,
            studentName: s.studentName,
            studentCode: s.studentCode,
            publishedTermIds: isPublished ? [term.termId] : [],
          })
        }
      }
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.studentName.localeCompare(b.studentName),
    )
  }, [allTerms])

  const selectedStudent = useMemo(
    () => allStudents.find((s) => s.studentId === selectedStudentId) ?? null,
    [allStudents, selectedStudentId],
  )

  const publishStudentMutation = usePublishStudent(classId)
  const unlockStudentMutation = useUnlockStudent(classId)

  const handlePublishTerm = async (termId: string, studentId: string) => {
    try {
      await publishStudentMutation.mutateAsync({ termId, studentId })
      toast.success("Grade published.")
    } catch {
      toast.error("Failed to publish grade.")
    }
  }

  const handleUnlockTerm = async (termId: string, studentId: string) => {
    try {
      await unlockStudentMutation.mutateAsync({ termId, studentId })
      toast.success("Grade unpublished.")
    } catch {
      toast.error("Failed to unpublish grade.")
    }
  }

  const handlePublishAllTermsForStudent = async (studentId: string) => {
    try {
      for (const term of activeTerms) {
        await apiClient.patch(
          `/classes/${classId}/grades/${term.termId}/students/${studentId}/publish`,
        )
      }
      toast.success("All terms published.")
      qc.invalidateQueries({ queryKey: ["grades", classId] })
    } catch {
      toast.error("Failed to publish all terms.")
    }
  }

  const handlePublishAll = async () => {
    setPublishingAll(true)
    try {
      await educatorGradeLockApi.lockClass(classId)
      toast.success("All grades published.")
      setPublishAllOpen(false)
      qc.invalidateQueries({ queryKey: ["grades", classId] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to publish all grades.")
    } finally {
      setPublishingAll(false)
    }
  }

  const anyPublished = allStudents.some((s) => s.publishedTermIds.length > 0)
  const allPublished = allStudents.every(
    (s) =>
      s.publishedTermIds.length === activeTerms.length || activeTerms.length === 0,
  )

  if (termsLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading grades...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="View Grades"
        description="Review and download published grades."
        breadcrumbs={[
          { label: "Classes", href: "/educator/classes" },
          { label: "Class", href: `/educator/classes/${classId}` },
          { label: "Grades", href: `/educator/classes/${classId}/grades` },
          { label: "View" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {anyPublished && (
              <span className="text-xs text-muted-foreground">
                {allStudents.filter((s) => s.publishedTermIds.length > 0).length} of {allStudents.length} students published
              </span>
            )}
            {!allPublished && (
              <Button
                size="sm"
                variant="default"
                onClick={() => setPublishAllOpen(true)}
                className="gap-1.5"
              >
                <Lock className="h-3.5 w-3.5" />
                Publish All
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Student list sidebar */}
        <div className="lg:sticky lg:top-6 self-start">
          <StudentList
            students={allStudents}
            selectedId={selectedStudentId}
            onSelect={setSelectedStudentId}
          />
        </div>

        {/* Grade card */}
        <div>
          {selectedStudent ? (
            <StudentGradeCard
              studentId={selectedStudent.studentId}
              studentName={selectedStudent.studentName}
              studentCode={selectedStudent.studentCode}
              terms={activeTerms}
              gradingScale={gradingScale ?? null}
              onPublishTerm={handlePublishTerm}
              onUnlockTerm={handleUnlockTerm}
              onPublishAllTerms={handlePublishAllTermsForStudent}
              isPublishing={publishStudentMutation.isPending || unlockStudentMutation.isPending}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 border rounded-xl bg-card">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">Select a student</p>
              <p className="text-xs text-muted-foreground">
                Choose a student from the list to view their grades.
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={publishAllOpen}
        onOpenChange={setPublishAllOpen}
        title="Publish All Grades"
        destructive
        message="Publishing will make final scores visible to all students and prevent further edits. This action requires admin override to undo. Are you sure?"
        confirmLabel={publishingAll ? "Publishing..." : "Publish All"}
        onConfirm={handlePublishAll}
        isLoading={publishingAll}
      />
    </div>
  )
}
