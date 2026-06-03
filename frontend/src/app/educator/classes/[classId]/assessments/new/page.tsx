"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { assessmentKeys } from "@/hooks/queryKeys";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks";
import { useUpdateAssessment } from "@/hooks/educator/useAssessments";
import { assessmentApi } from "@/api/educator/assessment.api";
import { educatorGradingSchemeApi } from "@/api/educator/grading-scheme.api";
import { gradeApi } from "@/api/educator/grade.api";
import { Button } from "@/components/ui/button";
import {
  StepIndicator,
  Step0,
  Step1,
  Step2,
  Step3,
  Step4,
  Step5,
  Step6,
  ManualStep1,
  ManualStep2,
  getConceptContent,
  getSectionsForRanges,
  TYPE_LABELS,
} from "@/components/educator/assessment-builder";
import type { BuilderState, ConceptItemInfo } from "@/components/educator/assessment-builder";
import type { AssessmentType, GradingMode } from "@/types/educator/assessment.types";
import type { RangeConfig } from "@/api/educator/assessment.api";

export default function NewAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const classId = params.classId as string;

  const [step, setStep] = useState(0);
  const [state, setState] = useState<BuilderState>({
    selectedLesson: null, type: "quiz", title: "Quiz", gradingMode: "system", showBreakdown: false, manualMaxScore: 0,
    totalItems: 1, sections: [], createdAssessmentId: null, previewId: null, generatedQuestions: [],
    manualInstructions: "", releaseDate: "", endDate: "", selectedStudentIds: [], selectedTermId: "", weekNumber: 0,
  });
  const submittingRef = useRef(false);

  const { mutateAsync: updateAssessment, isPending: isUpdating } = useUpdateAssessment(classId);
  const { data: weeks } = useClassWeeks(classId);
  const { data: gradingScheme } = useQuery({
    queryKey: ["grading-scheme", classId],
    queryFn: () => educatorGradingSchemeApi.getForClass(classId),
  });
  const schemeTypes = gradingScheme?.components
    ?.map((c) => c.type) ?? [];
  const patch = useCallback((u: Partial<BuilderState>) => setState((p) => ({ ...p, ...u })), []);
  const next = () => setStep((s) => s + 1);

  useEffect(() => {
    if (schemeTypes.length > 0) {
      setState((prev) => {
        if (schemeTypes.includes(prev.type)) return prev;
        const first = schemeTypes[0];
        const label = TYPE_LABELS[first] ?? first.charAt(0).toUpperCase() + first.slice(1);
        return { ...prev, type: first, title: label };
      });
    }
  }, [schemeTypes]);

  const prevTypeRef = useRef(state.type);
  useEffect(() => {
    if (state.type !== prevTypeRef.current) {
      const oldType = prevTypeRef.current;
      prevTypeRef.current = state.type;
      const oldDefault = TYPE_LABELS[oldType] ?? oldType.charAt(0).toUpperCase() + oldType.slice(1);
      const newDefault = TYPE_LABELS[state.type] ?? state.type.charAt(0).toUpperCase() + state.type.slice(1);
      if (!state.title || state.title === oldDefault) {
        patch({ title: newDefault });
      }
    }
  }, [state.type]);
  const prev = () => setStep((s) => s - 1);
  const concept = state.selectedLesson?.concept ?? null;
  const cc = getConceptContent(concept);

  const isManual = state.gradingMode === "manual";
  const isSystem = state.gradingMode === "system" || state.gradingMode === "hybrid";

  const systemSteps = ["Select Lesson", "View Concepts", "Configuration", "Generate", "Review Questions", "Set Dates & Assign"];
  const manualSteps = ["Type & Instructions", "Items & Dates"];
  const allSteps = ["Grading Mode", ...(isManual ? manualSteps : systemSteps)];

  const { data: termOptions = [] } = useQuery({
    queryKey: ["grade-term-options", classId],
    queryFn: () => gradeApi.getTermOptions(classId),
    enabled: !!classId,
  });

  function getLessonTermInfo(): { termId: string; termName: string; semesterName: string } | null {
    if (!state.selectedLesson || !weeks?.length) return null;
    const week = weeks.find((w) => w.value === state.selectedLesson!.weekNumber);
    if (!week) return null;
    return { termId: week.termId, termName: week.termName, semesterName: week.semesterName };
  }

  useEffect(() => {
    if (isManual && step === 2 && !state.selectedTermId && termOptions.length > 0) {
      patch({ selectedTermId: termOptions[0].termId });
    }
  }, [isManual, step, state.selectedTermId, termOptions.length]);

  async function handleGenerate() {
    if (submittingRef.current) return;
    if (!state.selectedLesson) return;
    const termId = getLessonTermInfo()?.termId ?? "";
    if (!termId) { toast.error("Could not determine term for this lesson's week."); return; }
    const ranges = getSectionsForRanges(state.sections, cc.conceptItems);
    if (!ranges.length) { toast.error("No sections configured."); return; }

    const hasManualSections = ranges.some((r) => r.questionType === 'manual');
    const effectiveGradingMode = state.gradingMode === 'system' && hasManualSections ? 'hybrid' : state.gradingMode;

    const manualScoreTotal = ranges
      .filter((r) => r.questionType === 'manual')
      .reduce((sum, r) => sum + (r.manualMaxScore ?? 1), 0);
    const derivedManualMaxScore = effectiveGradingMode === 'hybrid' ? manualScoreTotal : undefined;

    submittingRef.current = true;
    try {
      const combinedTotal = hasManualSections ? state.totalItems + manualScoreTotal : state.totalItems;
      const { previewId } = await assessmentApi.generatePreview(classId, {
        lessonId: state.selectedLesson.id, termId, type: state.type,
        title: state.title || undefined,
        totalItems: combinedTotal,
        gradingMode: effectiveGradingMode as GradingMode,
        showBreakdown: state.showBreakdown,
        manualMaxScore: derivedManualMaxScore,
        ranges: ranges.map((r) => ({ from: r.from, to: r.to, questionType: r.questionType as RangeConfig["questionType"], conceptSections: r.conceptSections, manualQuestionText: r.manualQuestionText, manualMaxScore: r.manualMaxScore })),
      });
      patch({ previewId, gradingMode: effectiveGradingMode as GradingMode });
      next();
    } catch { toast.error("Failed to start question generation."); }
    finally { submittingRef.current = false; }
  }

  async function handlePublish() {
    if (submittingRef.current) return;
    if (!state.previewId) return;
    submittingRef.current = true;
    try {
      const assessment = await assessmentApi.confirmPreview(classId, state.previewId);
      const assessmentId = assessment.id;
      queryClient.setQueryData(assessmentKeys.detail(assessmentId), assessment);
      await updateAssessment({ assessmentId, data: { releaseDate: state.releaseDate, endDate: state.endDate, showBreakdown: state.showBreakdown, weekNumber: state.weekNumber || undefined } });
      const published = await assessmentApi.publish(classId, assessmentId, state.selectedStudentIds.length > 0 ? { studentIds: state.selectedStudentIds } : undefined);
      if (published) queryClient.setQueryData(assessmentKeys.detail(assessmentId), (old: any) => old ? { ...old, isPublished: true } : old);
      queryClient.invalidateQueries({ queryKey: ["grades", classId] });
      toast.success("Assessment published!");
      await router.push(`/educator/classes/${classId}/assessments/${assessmentId}`);
      return;
    } catch { toast.error("Failed to publish."); }
    submittingRef.current = false;
  }

  async function handleCreateManual() {
    if (submittingRef.current) return;
    const termId = state.selectedTermId;
    if (!termId) { toast.error("Please select a term."); return; }
    if (!state.weekNumber) { toast.error("Please select a week."); return; }
    submittingRef.current = true;
    try {
      const assessment = await assessmentApi.create(classId, {
        termId, type: state.type,
        title: state.title || undefined,
        totalItems: state.totalItems,
        gradingMode: "manual",
        showBreakdown: state.showBreakdown,
        manualInstructions: state.manualInstructions,
        releaseDate: state.releaseDate || undefined,
        endDate: state.endDate || undefined,
        weekNumber: state.weekNumber,
        ranges: [],
      });
      queryClient.setQueryData(assessmentKeys.detail(assessment.id), assessment);
      queryClient.invalidateQueries({ queryKey: ["grades", classId] });
      toast.success("Manual assessment created!");
      await router.push(`/educator/classes/${classId}/assessments/${assessment.id}`);
      return;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create assessment.");
    }
    submittingRef.current = false;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="New Assessment"
        breadcrumbs={[{ label: "Assessments", href: `/educator/classes/${classId}/assessments` }]}
      />
      <StepIndicator steps={allSteps} current={step} />
      <div className="pt-2">
        {step === 0 && (
          <Step0 gradingMode={state.gradingMode} showBreakdown={state.showBreakdown}
            onChange={(u) => patch(u)} onNext={() => { if (state.gradingMode) next(); else toast.error("Please select a grading mode."); }} />
        )}

        {isSystem && step === 1 && (
          <div className="space-y-6">
            <Step1 classId={classId} selected={state.selectedLesson} onSelect={(l) => patch({ selectedLesson: l, weekNumber: l.weekNumber })} onNext={next} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to grading mode</Button>
          </div>
        )}
        {isSystem && step === 2 && (
          <div className="space-y-6">
            <Step2 concept={concept} onNext={next} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to lesson selection</Button>
          </div>
        )}
        {isSystem && step === 3 && (
          <div className="space-y-6">
            <Step3 type={state.type} title={state.title} totalItems={state.totalItems} sections={state.sections}
              conceptItems={cc.conceptItems} sectionNames={cc.sections} schemeTypes={schemeTypes}
              gradingMode={state.gradingMode} showBreakdown={state.showBreakdown} manualMaxScore={state.manualMaxScore}
              onChange={(u) => patch(u)} onNext={handleGenerate} isLoading={false} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to concepts</Button>
          </div>
        )}
        {isSystem && step === 4 && state.previewId && <Step4 classId={classId} previewId={state.previewId} onQuestionsReady={(q) => { patch({ generatedQuestions: q }); next(); }} />}
        {isSystem && step === 5 && state.previewId && (
          <div className="space-y-6">
            <Step5 classId={classId} previewId={state.previewId} questions={state.generatedQuestions}
              state={state} conceptItems={cc.conceptItems} sectionNames={cc.sections}
              termInfo={getLessonTermInfo()}
              onNext={next} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to generation</Button>
          </div>
        )}
        {isSystem && step === 6 && (
          <div className="space-y-6">
            <Step6 classId={classId} releaseDate={state.releaseDate} endDate={state.endDate} selectedStudentIds={state.selectedStudentIds} termInfo={getLessonTermInfo()} onChange={(u) => patch(u)} onPublish={handlePublish} isLoading={isUpdating} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to question review</Button>
          </div>
        )}

        {isManual && step === 1 && (
          <div className="space-y-6">
            <ManualStep1 type={state.type} title={state.title} manualInstructions={state.manualInstructions} schemeTypes={schemeTypes} onChange={(u) => patch(u)} onNext={next} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to grading mode</Button>
          </div>
        )}
        {isManual && step === 2 && (
          <div className="space-y-6">
            <ManualStep2 classId={classId} totalItems={state.totalItems} weekNumber={state.weekNumber}
              releaseDate={state.releaseDate} endDate={state.endDate}
              selectedStudentIds={state.selectedStudentIds}
              selectedTermId={state.selectedTermId}
              onChange={(u) => patch(u)} onCreate={handleCreateManual} isLoading={isUpdating} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to instructions</Button>
          </div>
        )}
      </div>
    </div>
  );
}
