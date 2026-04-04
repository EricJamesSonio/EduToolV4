"use client";

import { use } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClassGradingSchemeEditor } from "@/components/educator/grading-scheme/ClassGradingSchemeEditor";
import { useEducatorClass } from "@/hooks/educator/useEducatorClasses";

interface Props {
  params: Promise<{ classId: string }>;
}

export default function ClassGradingSchemePage({ params }: Props) {
  const { classId } = use(params);
  const { data: cls, isLoading } = useEducatorClass(classId);

  const title = isLoading
    ? "Grading Scheme"
    : `Grading Scheme — ${cls?.name ?? "Class"}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Define how student grades are weighted for this class. Lock occurs automatically once the first student is enrolled."
      />
      <ClassGradingSchemeEditor classId={classId} />
    </div>
  );
}