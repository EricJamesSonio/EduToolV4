"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { OrgScheduleTab } from "@/components/admin/organization/OrgScheduleTab";
import { Button } from "@/components/ui/button";

export default function OrganizationSchedulePage(): React.JSX.Element {
  const router = useRouter();
  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Schedule time range"
        description="Global for all departments. Configure the daily window and slot length."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/organization")}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Organization
            </Button>
            <HelpGuide slug="admin_organization" />
          </div>
        }
      />

      <OrgScheduleTab />
    </div>
  );
}
