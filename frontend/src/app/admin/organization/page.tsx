"use client"

import { PageHeader } from "@/components/shared/PageHeader"
import { OrgDetailsCard } from "@/components/admin/organization/OrgDetailsCard"
import { SeederCard } from "@/components/admin/organization/SeederCard"
import { EmailExtensionCard } from "@/components/admin/organization/EmailExtensionCard";

export default function OrganizationPage(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader title="Organization" />
      <OrgDetailsCard />
      <EmailExtensionCard />
      <SeederCard />
    </div>
  );
}