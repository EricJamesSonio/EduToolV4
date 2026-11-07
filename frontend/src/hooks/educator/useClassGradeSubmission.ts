import { useCallback, useEffect, useState } from "react";
import {
  classGradeSubmissionApi,
  type ClassSubmissionStatus,
  type ClassSubmitResult,
} from "@/api/educator/class-grade-submission.api";

export function useClassGradeSubmission(classId: string) {
  const [status, setStatus] = useState<ClassSubmissionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!classId) return;
    try {
      setStatus(await classGradeSubmissionApi.status(classId));
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = useCallback(async (): Promise<ClassSubmitResult> => {
    setSubmitting(true);
    try {
      const result = await classGradeSubmissionApi.submit(classId);
      await refresh();
      return result;
    } finally {
      setSubmitting(false);
    }
  }, [classId, refresh]);

  return { status, loading, submitting, refresh, submit };
}