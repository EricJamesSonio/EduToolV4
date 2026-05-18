"use client";

import { PortalHelpGuide } from "@/components/shared/help-guide/PortalHelpGuide";

export default function StudentHelpPage() {
  return (
    <div className="container mx-auto max-w-3xl py-6">
      <PortalHelpGuide portal="student" />
    </div>
  );
}
