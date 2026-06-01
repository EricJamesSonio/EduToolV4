// frontend/src/app/educator/classes/[classId]/assessments/[assessmentId]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import {
  useAssessment,
  useDeleteAssessment,
  usePublishAssessment,
  useUnpublishAssessment,
} from "@/hooks/educator/useAssessments";
import { assessmentApi } from "@/api/educator/assessment.api";
import { educatorClassApi } from "@/api/educator/class.api";

import { PageHeader } from "@/components/shared/PageHeader";
import { AssessmentQuestions } from "@/components/educator/assessment/AssessmentQuestions";
import { AssignStudentsDialog } from "@/components/educator/assessment/AssignStudentsDialog";
import { ReopenDialog } from "@/components/educator/assessment/ReopenDialog";
import { AssessmentInfoCard } from "@/components/educator/assessment/AssessmentInfoCard";
import { AssessmentActions } from "@/components/educator/assessment/AssessmentActions";
import { AssessmentBadges } from "@/components/educator/assessment/AssessmentBadges";

import { Loader2 } from "lucide-react";

export default function AssessmentDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();

  const classId = params.classId as string;
  const assessmentId = params.assessmentId as string;

  const { data: assessment, isLoading } = useAssessment(classId, assessmentId);
  const { mutateAsync: deleteAssessment, isPending: isDeleting } = useDeleteAssessment(classId);
  const { mutateAsync: publish, isPending: isPublishing } = usePublishAssessment(classId);
  const { mutateAsync: unpublish, isPending: isUnpublishing } = useUnpublishAssessment(classId);

  const [assignOpen, setAssignOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [reopening, setReopening] = useState(false);

  const { data: students } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: () => educatorClassApi.getStudents(classId),
    enabled: assignOpen || reopenOpen,
  });

  async function handleAssign(selectedIds: string[]) {
    setAssigning(true);
    try {
      await assessmentApi.assignStudents(classId, assessmentId, selectedIds);
      toast.success(`Assigned to ${selectedIds.length} student${selectedIds.length > 1 ? "s" : ""}.`);
      setAssignOpen(false);
    } catch {
      toast.error("Failed to assign students.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleReopen(selectedIds: string[], reopenUntil: string) {
    setReopening(true);
    try {
      const res = await assessmentApi.reopen(classId, assessmentId, selectedIds, reopenUntil);
      toast.success(`Reopened for ${res.reopened} student${res.reopened !== 1 ? "s" : ""}.`);
      setReopenOpen(false);
    } catch {
      toast.error("Failed to reopen assessment.");
    } finally {
      setReopening(false);
    }
  }

  async function handleDelete() {
    await deleteAssessment(assessmentId);
    toast.success("Assessment deleted.");
    router.push(`/educator/classes/${classId}/assessments`);
  }

  if (isLoading || !assessment) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading assessment...
      </div>
    );
  }

  const isBeforeRelease = !assessment.releaseDate || new Date() < new Date(assessment.releaseDate);
  const isClosed = assessment.status === "closed";

  return (
    <div className="space-y-6">
      <PageHeader
        title={assessment.title}
        breadcrumbs={[
          { label: "Assessments", href: `/educator/classes/${classId}/assessments` },
          { label: assessment.title },
        ]}
        description="Assessment details, instructions, and submissions overview."
        actions={
          <AssessmentActions
            classId={classId}
            assessmentId={assessmentId}
            isPublished={assessment.isPublished}
            isClosed={isClosed}
            isPublishing={isPublishing}
            isUnpublishing={isUnpublishing}
            isDeleting={isDeleting}
            onAssignOpen={() => setAssignOpen(true)}
            onReopenOpen={() => setReopenOpen(true)}
            onPublish={() => publish(assessmentId)}
            onUnpublish={() => unpublish(assessmentId)}
            onDelete={handleDelete}
          />
        }
      />

      <AssessmentBadges type={assessment.type} status={assessment.status} isPublished={assessment.isPublished} />

      <AssessmentInfoCard assessment={assessment} />

      <AssessmentQuestions
        questions={assessment.questions}
        gradingMode={assessment.gradingMode}
        isBeforeRelease={isBeforeRelease}
      />

      <AssignStudentsDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        students={students}
        onAssign={handleAssign}
        assigning={assigning}
      />

      <ReopenDialog
        open={reopenOpen}
        onOpenChange={setReopenOpen}
        students={students}
        onReopen={handleReopen}
        reopening={reopening}
      />
    </div>
  );
}