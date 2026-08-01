"use client";

import { use } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClassGradingSchemeEditor } from "@/components/educator/grading-scheme/ClassGradingSchemeEditor";

interface Props {
  params: Promise<{ classId: string }>;
}

export default function ClassGradingSchemePage({ params }: Props) {
  const { classId } = use(params);

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Grading Scheme"
      />
      <ClassGradingSchemeEditor classId={classId} />
    </div>
  );
}