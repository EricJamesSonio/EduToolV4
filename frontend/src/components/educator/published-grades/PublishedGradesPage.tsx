"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Lock, Loader2, FileText } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Badge } from "@/components/ui/badge"
import { useClassGrades } from "@/hooks/educator/useGrades"
import { useClassGradeLock } from "@/hooks/educator/useGradeLock"
import { educatorGradingSchemeApi } from "@/api/educator/grading-scheme.api"
import { StudentList, type StudentSummary } from "./StudentList"
import { StudentGradeCard } from "./StudentGradeCard"
import type { GradingScale } from "@/types/admin/grading-scale.types"

export function PublishedGradesPage({ classId }: { classId: string }) {
  const { data: allTerms, isLoading: termsLoading } = useClassGrades(classId)
  const { data: lockInfo, isLoading: lockLoading } = useClassGradeLock(classId)

  const { data: gradingScale } = useQuery<GradingScale | null>({
    queryKey: ["grading-scale", "class", classId],
    queryFn: () => educatorGradingSchemeApi.getScaleForClass(classId),
    enabled: !!classId,
  })

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  // Build flat unique student list from all terms
  const allStudents = useMemo<StudentSummary[]>(() => {
    if (!allTerms) return []
    const seen = new Set<string>()
    const result: StudentSummary[] = []
    for (const term of allTerms) {
      for (const s of term.students) {
        if (!seen.has(s.studentId)) {
          seen.add(s.studentId)
          result.push({
            studentId: s.studentId,
            studentName: s.studentName,
            studentCode: s.studentCode,
          })
        }
      }
    }
    return result.sort((a, b) => a.studentName.localeCompare(b.studentName))
  }, [allTerms])

  const selectedStudent = useMemo(
    () => allStudents.find((s) => s.studentId === selectedStudentId) ?? null,
    [allStudents, selectedStudentId],
  )

  if (termsLoading || lockLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading published grades...
      </div>
    )
  }

  if (!lockInfo?.is_locked) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Published Grades"
          breadcrumbs={[
            { label: "Classes", href: "/educator/classes" },
            { label: "Class", href: `/educator/classes/${classId}` },
            { label: "Grades", href: `/educator/classes/${classId}/grades` },
            { label: "Published" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 border rounded-xl bg-card">
          <Lock className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">Grades are not yet locked</p>
          <p className="text-xs text-muted-foreground">
            Published grades will appear here once you lock the class grades.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Published Grades"
        breadcrumbs={[
          { label: "Classes", href: "/educator/classes" },
          { label: "Class", href: `/educator/classes/${classId}` },
          { label: "Grades", href: `/educator/classes/${classId}/grades` },
          { label: "Published" },
        ]}
        actions={
          <Badge variant="secondary" className="gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            {allStudents.length} Student{allStudents.length !== 1 ? "s" : ""}
          </Badge>
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
              terms={allTerms ?? []}
              gradingScale={gradingScale ?? null}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 border rounded-xl bg-card">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">Select a student</p>
              <p className="text-xs text-muted-foreground">
                Choose a student from the list to view their published grades.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
