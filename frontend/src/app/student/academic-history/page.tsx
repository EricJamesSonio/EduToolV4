"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StudentAcademicHistoryPanel } from "@/components/student/StudentAcademicHistoryPanel";

export default function StudentAcademicHistoryPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader title="My Academic History" />
      <StudentAcademicHistoryPanel />
    </div>
  );
}
