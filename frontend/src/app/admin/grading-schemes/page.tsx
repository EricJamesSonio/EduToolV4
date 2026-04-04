"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { GradingSchemeEditor } from "@/components/admin/grading-scheme/GradingSchemeEditor";

export default function GradingSchemesPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Default Grading Scheme"
        description="This grading scheme is automatically applied to all new classes."
      />

      <div className="rounded-lg border p-6">
        <GradingSchemeEditor />
      </div>
    </div>
  );
}